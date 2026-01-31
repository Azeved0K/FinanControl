from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Transaction, Profile, PiggyBank, PiggyBankTransaction


class UserSerializer(serializers.ModelSerializer):
    """Serializer para cadastro e informações do usuário"""

    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False}
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        Profile.objects.get_or_create(user=user)
        return user


class MeSerializer(serializers.Serializer):
    """Serializer para informações do usuário autenticado"""

    username = serializers.CharField(required=False, allow_blank=False)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=False)
    avatar = serializers.ImageField(required=False, allow_null=True)

    def validate_avatar(self, value):
        if value is None:
            return value
        max_bytes = 25 * 1024 * 1024
        if getattr(value, 'size', 0) > max_bytes:
            raise serializers.ValidationError('A imagem deve ter no máximo 25MB.')
        return value


class CategorySerializer(serializers.ModelSerializer):
    """Serializer para categorias"""

    user = serializers.PrimaryKeyRelatedField(read_only=True)
    transaction_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'icon', 'user', 'created_at', 'transaction_count']
        read_only_fields = ['created_at']

    def get_transaction_count(self, obj):
        return obj.transactions.count()

    def validate(self, data):
        if data.get('type') not in ['IN', 'OUT']:
            raise serializers.ValidationError("Tipo deve ser 'IN' ou 'OUT'")
        return data


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer para transações"""

    user = serializers.PrimaryKeyRelatedField(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'description', 'amount', 'date', 'type',
            'category', 'category_name', 'category_icon',
            'user', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("O valor deve ser maior que zero")
        return value

    def validate(self, data):
        # Validar se a categoria pertence ao usuário
        user = self.context['request'].user
        category = data.get('category')

        if category and category.user != user:
            raise serializers.ValidationError(
                "Você não tem permissão para usar esta categoria"
            )

        # Validar se o tipo da transação corresponde ao tipo da categoria
        if category and data.get('type') != category.type:
            raise serializers.ValidationError(
                f"A categoria '{category.name}' é do tipo '{category.get_type_display()}', "
                f"mas a transação é do tipo '{data.get('type')}'"
            )

        return data


class InsightSerializer(serializers.Serializer):
    """Serializer para insights financeiros"""

    insights = serializers.ListField(child=serializers.CharField())
    period = serializers.CharField()
    total_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_expense = serializers.DecimalField(max_digits=12, decimal_places=2)
    balance = serializers.DecimalField(max_digits=12, decimal_places=2)


class PiggyBankSerializer(serializers.ModelSerializer):
    """Serializer para cofrinhos"""

    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = PiggyBank
        fields = [
            'id', 'name', 'description', 'rate_type', 'rate_value', 'start_date',
            'is_active', 'user', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class PiggyBankTransactionSerializer(serializers.ModelSerializer):
    """Serializer para transações de cofrinhos"""

    piggy_bank = serializers.PrimaryKeyRelatedField(queryset=PiggyBank.objects.all())

    class Meta:
        model = PiggyBankTransaction
        fields = ['id', 'piggy_bank', 'type', 'amount', 'date', 'note', 'created_at']
        read_only_fields = ['created_at']

    def validate(self, data):
        request = self.context['request']
        pb = data.get('piggy_bank')
        if pb and pb.user != request.user:
            raise serializers.ValidationError('Você não tem permissão para usar este cofrinho.')
        return data
