from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Transaction

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'colored_type', 'user', 'created_at')
    list_filter = ('type', 'user')
    search_fields = ('name',)

    def colored_type(self, obj):
        color = '#22c55e' if obj.type == 'IN' else '#ef4444'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_type_display()
        )
    colored_type.short_description = 'Tipo'

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('description', 'colored_amount', 'date', 'category', 'user')
    list_filter = ('type', 'date', 'category', 'user')
    search_fields = ('description',)

    def colored_amount(self, obj):
        color = '#22c55e' if obj.type == 'IN' else '#ef4444'
        prefix = '+' if obj.type == 'IN' else '-'
        
        # Formata o número como string antes de passar para o format_html
        formatted_value = f"{prefix} R$ {obj.amount:,.2f}"
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            formatted_value
        )
    colored_amount.short_description = 'Valor'