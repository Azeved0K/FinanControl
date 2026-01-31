from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth.models import User
from django.db.models import Sum, Q
from datetime import datetime, timedelta
from decimal import Decimal

from .models import Category, Transaction, Profile, PiggyBank, PiggyBankTransaction
from .serializers import (
    UserSerializer, CategorySerializer,
    TransactionSerializer, InsightSerializer, MeSerializer,
    PiggyBankSerializer, PiggyBankTransactionSerializer,
)
from .utils.insights import generate_financial_insights
from .utils.piggybank import piggybank_principal, piggybank_daily_series


class CustomAuthToken(ObtainAuthToken):
    """Endpoint de autenticação customizado"""

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email
        })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    """Endpoint para registro de novos usuários"""

    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_user(request):
    """Endpoint para logout"""

    try:
        request.user.auth_token.delete()
        return Response({
            'message': 'Logout realizado com sucesso'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de categorias"""

    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TransactionViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de transações"""

    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Transaction.objects.filter(user=self.request.user)

        transaction_type = self.request.query_params.get('type', None)
        category_id = self.request.query_params.get('category', None)
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)

        if transaction_type:
            queryset = queryset.filter(type=transaction_type)

        if category_id:
            queryset = queryset.filter(category_id=category_id)

        if start_date:
            queryset = queryset.filter(date__gte=start_date)

        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Retorna resumo financeiro do usuário"""

        all_tx = self.get_queryset()
        external_tx = all_tx.filter(is_internal=False)

        total_income = external_tx.filter(type='IN').aggregate(total=Sum('amount'))['total'] or 0
        total_expense = external_tx.filter(type='OUT').aggregate(total=Sum('amount'))['total'] or 0

        all_income = all_tx.filter(type='IN').aggregate(total=Sum('amount'))['total'] or 0
        all_expense = all_tx.filter(type='OUT').aggregate(total=Sum('amount'))['total'] or 0
        balance = all_income - all_expense

        return Response({
            'total_income': total_income,
            'total_expense': total_expense,
            'balance': balance,
            'transaction_count': external_tx.count()
        })

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Retorna transações agrupadas por categoria"""

        transactions = self.get_queryset().filter(is_internal=False)

        # Agrupar despesas por categoria
        expense_by_category = transactions.filter(type='OUT').values(
            'category__name', 'category__icon'
        ).annotate(
            total=Sum('amount')
        ).order_by('-total')

        # Agrupar receitas por categoria
        income_by_category = transactions.filter(type='IN').values(
            'category__name', 'category__icon'
        ).annotate(
            total=Sum('amount')
        ).order_by('-total')

        return Response({
            'expenses': list(expense_by_category),
            'incomes': list(income_by_category)
        })

    @action(detail=False, methods=['get'])
    def balance_history(self, request):
        """Retorna série temporal do saldo do usuário (por dia)."""

        try:
            days = int(request.query_params.get('days', 7))
        except (TypeError, ValueError):
            days = 7

        # Guardrails
        if days < 1:
            days = 1
        if days > 365:
            days = 365

        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days - 1)

        qs = Transaction.objects.filter(user=request.user)

        # Saldo anterior ao período (para a curva começar no valor correto)
        prior = qs.filter(date__lt=start_date).aggregate(
            income=Sum('amount', filter=Q(type='IN')),
            expense=Sum('amount', filter=Q(type='OUT')),
        )
        prior_income = prior.get('income') or Decimal('0')
        prior_expense = prior.get('expense') or Decimal('0')
        running_balance = prior_income - prior_expense

        # Totais dentro do período por dia
        daily = qs.filter(date__gte=start_date, date__lte=end_date).values('date').annotate(
            income=Sum('amount', filter=Q(type='IN')),
            expense=Sum('amount', filter=Q(type='OUT')),
        )
        daily_map = {row['date']: row for row in daily}

        history = []
        current = start_date
        while current <= end_date:
            row = daily_map.get(current)
            income = (row or {}).get('income') or Decimal('0')
            expense = (row or {}).get('expense') or Decimal('0')
            running_balance = running_balance + income - expense

            history.append({
                'date': current.strftime('%d/%m'),
                'date_iso': current.isoformat(),
                'balance': running_balance,
            })
            current += timedelta(days=1)

        return Response({
            'days': days,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'history': history,
        })

    @action(detail=False, methods=['get'])
    def daily_balance(self, request):
        """Retorna o saldo acumulado no fim de cada dia (23:00) para o período solicitado."""

        try:
            days = int(request.query_params.get('days', 30))
        except (TypeError, ValueError):
            days = 30

        if days < 1:
            days = 1
        if days > 365:
            days = 365

        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days - 1)

        qs = Transaction.objects.filter(user=self.request.user)

        prior = qs.filter(date__lt=start_date).aggregate(
            income=Sum('amount', filter=Q(type='IN')),
            expense=Sum('amount', filter=Q(type='OUT')),
        )
        prior_income = prior.get('income') or Decimal('0')
        prior_expense = prior.get('expense') or Decimal('0')
        running_balance = prior_income - prior_expense

        daily = qs.filter(date__gte=start_date, date__lte=end_date).values('date').annotate(
            income=Sum('amount', filter=Q(type='IN')),
            expense=Sum('amount', filter=Q(type='OUT')),
        )
        daily_map = {row['date']: row for row in daily}

        history = []
        current = start_date
        while current <= end_date:
            row = daily_map.get(current)
            income = (row or {}).get('income') or Decimal('0')
            expense = (row or {}).get('expense') or Decimal('0')
            running_balance = running_balance + income - expense

            history.append({
                'date': current.strftime('%d/%m'),
                'date_iso': current.isoformat(),
                'cutoff_time': '23:00',
                'balance': running_balance,
            })
            current += timedelta(days=1)

        return Response({
            'days': days,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'cutoff_time': '23:00',
            'history': history,
        })


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    user = request.user
    profile, _ = Profile.objects.get_or_create(user=user)

    def payload():
        avatar_url = request.build_absolute_uri(profile.avatar.url) if profile.avatar else None
        return {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'avatar_url': avatar_url,
        }

    if request.method == 'GET':
        return Response(payload())

    serializer = MeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    username = data.get('username', user.username)
    email = data.get('email', user.email)

    if User.objects.exclude(pk=user.pk).filter(username=username).exists():
        return Response({'username': ['Este username já está em uso.']}, status=status.HTTP_400_BAD_REQUEST)

    if email and User.objects.exclude(pk=user.pk).filter(email=email).exists():
        return Response({'email': ['Este email já está em uso.']}, status=status.HTTP_400_BAD_REQUEST)

    user.username = username
    user.email = email
    user.first_name = data.get('first_name', user.first_name)
    user.last_name = data.get('last_name', user.last_name)
    user.save(update_fields=['username', 'email', 'first_name', 'last_name'])

    dirty = []
    if 'avatar' in data:
        profile.avatar = data.get('avatar')
        dirty.append('avatar')
    if dirty:
        profile.save(update_fields=dirty)

    return Response(payload())


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def financial_insights(request):
    """Endpoint para obter insights financeiros"""

    user = request.user
    insights_data = generate_financial_insights(user)

    serializer = InsightSerializer(data=insights_data)
    serializer.is_valid(raise_exception=True)

    return Response(serializer.data)


class PiggyBankViewSet(viewsets.ModelViewSet):
    serializer_class = PiggyBankSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PiggyBank.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        pb = self.get_object()
        principal = piggybank_principal(pb)
        today = datetime.now().date()
        start = pb.start_date
        if start > today:
            start = today
        series = piggybank_daily_series(pb, start, today)
        current_balance = series[-1].balance if series else principal
        return Response({
            'id': pb.id,
            'principal': principal,
            'current_balance': current_balance,
            'rate_type': pb.rate_type,
            'rate_value': pb.rate_value,
        })

    @action(detail=True, methods=['get'])
    def daily(self, request, pk=None):
        pb = self.get_object()
        try:
            days = int(request.query_params.get('days', 30))
        except (TypeError, ValueError):
            days = 30
        if days < 1:
            days = 1
        if days > 365:
            days = 365

        end = datetime.now().date()
        start = end - timedelta(days=days - 1)
        series = piggybank_daily_series(pb, start, end)
        return Response({
            'days': days,
            'start_date': start.isoformat(),
            'end_date': end.isoformat(),
            'history': [
                {
                    'date': r.date.strftime('%d/%m'),
                    'date_iso': r.date.isoformat(),
                    'principal': r.principal,
                    'interest': r.interest,
                    'balance': r.balance,
                }
                for r in series
            ]
        })

    @action(detail=True, methods=['get'])
    def forecast(self, request, pk=None):
        pb = self.get_object()
        try:
            days = int(request.query_params.get('days', 30))
        except (TypeError, ValueError):
            days = 30
        if days < 1:
            days = 1
        if days > 365:
            days = 365

        today = datetime.now().date()
        end = today + timedelta(days=days - 1)
        series = piggybank_daily_series(pb, today, end)
        start_balance = piggybank_principal(pb)
        end_balance = series[-1].balance if series else start_balance
        total_interest = sum((r.interest for r in series), Decimal('0'))

        return Response({
            'days': days,
            'start_date': today.isoformat(),
            'end_date': end.isoformat(),
            'start_balance': start_balance,
            'end_balance': end_balance,
            'total_interest': total_interest,
            'history': [
                {
                    'date': r.date.strftime('%d/%m'),
                    'date_iso': r.date.isoformat(),
                    'interest': r.interest,
                    'balance': r.balance,
                }
                for r in series
            ]
        })


class PiggyBankTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = PiggyBankTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PiggyBankTransaction.objects.filter(piggy_bank__user=self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        temp = serializer.validated_data
        pb = temp['piggy_bank']
        amount = temp['amount']
        tx_type = temp['type']

        if tx_type == 'DEPOSIT':
            totals = Transaction.objects.filter(user=user).aggregate(
                income=Sum('amount', filter=Q(type='IN')),
                expense=Sum('amount', filter=Q(type='OUT')),
            )
            balance = (totals.get('income') or Decimal('0')) - (totals.get('expense') or Decimal('0'))

            if balance <= 0:
                raise serializers.ValidationError({'amount': ['Saldo insuficiente para depositar no cofrinho.']})
            if amount > balance:
                raise serializers.ValidationError({'amount': ['Você não pode depositar mais do que seu saldo total.']})

            tx = serializer.save()

            cat_out = Category.objects.filter(user=user, type='OUT').order_by('created_at').first()
            if not cat_out:
                cat_out = Category.objects.create(user=user, name='Transferências', type='OUT', icon='ArrowLeftRight')

            Transaction.objects.create(
                user=user,
                description=f"Depósito no cofrinho: {tx.piggy_bank.name}",
                amount=amount,
                date=tx.date,
                type='OUT',
                category=cat_out,
                is_internal=True,
            )
            return

        if tx_type == 'WITHDRAW':
            principal = PiggyBankTransaction.objects.filter(piggy_bank=pb).aggregate(
                dep=Sum('amount', filter=Q(type='DEPOSIT')),
                wdr=Sum('amount', filter=Q(type='WITHDRAW')),
            )
            available = (principal.get('dep') or Decimal('0')) - (principal.get('wdr') or Decimal('0'))

            if amount > available:
                raise serializers.ValidationError({'amount': ['Saldo insuficiente no cofrinho para este saque.']})

            tx = serializer.save()

            cat_in = Category.objects.filter(user=user, type='IN').order_by('created_at').first()
            if not cat_in:
                cat_in = Category.objects.create(user=user, name='Transferências', type='IN', icon='ArrowLeftRight')

            Transaction.objects.create(
                user=user,
                description=f"Saque do cofrinho: {tx.piggy_bank.name}",
                amount=amount,
                date=tx.date,
                type='IN',
                category=cat_in,
                is_internal=True,
            )
            return

        raise serializers.ValidationError({'type': ['Tipo inválido.']})
