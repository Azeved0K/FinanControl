from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from decimal import Decimal


class Category(models.Model):
    """Categoria de transações financeiras"""
    
    TRANSACTION_TYPES = [
        ('IN', 'Receita'),
        ('OUT', 'Despesa'),
    ]
    
    name = models.CharField(max_length=100, verbose_name='Nome')
    type = models.CharField(
        max_length=3, 
        choices=TRANSACTION_TYPES, 
        verbose_name='Tipo'
    )
    icon = models.CharField(
        max_length=50, 
        default='DollarSign',
        verbose_name='Ícone'
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='categories',
        verbose_name='Usuário'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Categoria'
        verbose_name_plural = 'Categorias'
        ordering = ['name']
        unique_together = ['user', 'name', 'type']
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class Transaction(models.Model):
    """Transação financeira (Receita ou Despesa)"""
    
    TRANSACTION_TYPES = [
        ('IN', 'Entrada'),
        ('OUT', 'Saída'),
    ]
    
    description = models.CharField(max_length=255, verbose_name='Descrição')
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Valor'
    )
    date = models.DateField(verbose_name='Data')
    type = models.CharField(
        max_length=3, 
        choices=TRANSACTION_TYPES,
        verbose_name='Tipo'
    )
    category = models.ForeignKey(
        Category, 
        on_delete=models.PROTECT, 
        related_name='transactions',
        verbose_name='Categoria'
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='transactions',
        verbose_name='Usuário'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Transação'
        verbose_name_plural = 'Transações'
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"{self.description} - R$ {self.amount} ({self.get_type_display()})"