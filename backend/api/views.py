from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth.models import User
from django.db.models import Sum, Q
from datetime import datetime, timedelta
from .models import Category, Transaction
from .serializers import (
    UserSerializer, CategorySerializer, 
    TransactionSerializer, InsightSerializer
)
from .utils.insights import generate_financial_insights


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
        
        # Filtros opcionais via query params
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
        
        transactions = self.get_queryset()
        
        total_income = transactions.filter(type='IN').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        total_expense = transactions.filter(type='OUT').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        balance = total_income - total_expense
        
        return Response({
            'total_income': total_income,
            'total_expense': total_expense,
            'balance': balance,
            'transaction_count': transactions.count()
        })
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Retorna transações agrupadas por categoria"""
        
        transactions = self.get_queryset()
        
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


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def financial_insights(request):
    """Endpoint para obter insights financeiros"""
    
    user = request.user
    insights_data = generate_financial_insights(user)
    
    serializer = InsightSerializer(data=insights_data)
    serializer.is_valid(raise_exception=True)
    
    return Response(serializer.data)