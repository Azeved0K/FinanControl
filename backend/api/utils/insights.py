from django.db.models import Sum
from datetime import datetime, timedelta
from decimal import Decimal
from ..models import Transaction


def generate_financial_insights(user):
    """
    Gera insights financeiros baseados nas transações do usuário.
    Retorna dicas e análises do mês atual comparado ao anterior.
    """
    
    insights = []
    
    # Definir períodos
    today = datetime.now().date()
    current_month_start = today.replace(day=1)
    previous_month_end = current_month_start - timedelta(days=1)
    previous_month_start = previous_month_end.replace(day=1)
    
    # Transações do mês atual
    current_month_transactions = Transaction.objects.filter(
        user=user,
        date__gte=current_month_start,
        date__lte=today
    )
    
    # Transações do mês anterior
    previous_month_transactions = Transaction.objects.filter(
        user=user,
        date__gte=previous_month_start,
        date__lte=previous_month_end
    )
    
    # Calcular totais do mês atual
    current_income = current_month_transactions.filter(type='IN').aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0.00')
    
    current_expense = current_month_transactions.filter(type='OUT').aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0.00')
    
    current_balance = current_income - current_expense
    
    # Calcular totais do mês anterior
    previous_income = previous_month_transactions.filter(type='IN').aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0.00')
    
    previous_expense = previous_month_transactions.filter(type='OUT').aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0.00')
    
    # Insight 1: Comparação de gastos totais
    if previous_expense > 0:
        expense_diff = ((current_expense - previous_expense) / previous_expense) * 100
        if expense_diff > 10:
            insights.append(
                f"⚠️ Seus gastos aumentaram {expense_diff:.1f}% comparado ao mês anterior. "
                "Revise suas despesas e identifique onde pode economizar."
            )
        elif expense_diff < -10:
            insights.append(
                f"✅ Parabéns! Você reduziu seus gastos em {abs(expense_diff):.1f}% "
                "comparado ao mês anterior. Continue assim!"
            )
    
    # Insight 2: Comparação de receitas
    if previous_income > 0:
        income_diff = ((current_income - previous_income) / previous_income) * 100
        if income_diff > 15:
            insights.append(
                f"📈 Ótimo! Suas receitas aumentaram {income_diff:.1f}% este mês."
            )
        elif income_diff < -15:
            insights.append(
                f"📉 Suas receitas caíram {abs(income_diff):.1f}% este mês. "
                "Considere buscar fontes adicionais de renda."
            )
    
    # Insight 3: Análise de saldo
    if current_balance < 0:
        insights.append(
            "🚨 Você está gastando mais do que ganha este mês. "
            "É hora de revisar seu orçamento e cortar gastos desnecessários."
        )
    elif current_balance > current_income * Decimal('0.3'):
        insights.append(
            f"💰 Excelente! Você economizou {(current_balance/current_income*100):.0f}% "
            "da sua renda este mês. Considere investir esse valor."
        )
    
    # Insight 4: Gastos por categoria
    top_categories = current_month_transactions.filter(type='OUT').values(
        'category__name'
    ).annotate(
        total=Sum('amount')
    ).order_by('-total')[:3]
    
    if top_categories:
        top_cat_name = top_categories[0]['category__name']
        top_cat_amount = top_categories[0]['total']
        percentage = (top_cat_amount / current_expense * 100) if current_expense > 0 else 0
        
        if percentage > 40:
            insights.append(
                f"💳 A categoria '{top_cat_name}' representa {percentage:.0f}% "
                "dos seus gastos. Analise se é possível reduzir esses custos."
            )
    
    # Insight 5: Frequência de transações
    transaction_count = current_month_transactions.count()
    avg_transaction_value = current_expense / transaction_count if transaction_count > 0 else 0
    
    if transaction_count > 50:
        insights.append(
            f"📊 Você realizou {transaction_count} transações este mês. "
            "Considere consolidar pequenas compras para melhor controle financeiro."
        )
    
    # Insight 6: Taxa de poupança
    if current_income > 0:
        savings_rate = (current_balance / current_income) * 100
        if savings_rate < 10 and current_balance >= 0:
            insights.append(
                "💡 Sua taxa de poupança está baixa. Tente economizar pelo menos "
                "20% da sua renda mensal para construir uma reserva de emergência."
            )
    
    # Se não houver insights específicos, adicionar mensagens genéricas
    if not insights:
        if current_month_transactions.exists():
            insights.append(
                "✨ Continue registrando suas transações para receber análises mais detalhadas!"
            )
        else:
            insights.append(
                "📝 Comece a registrar suas transações para receber insights personalizados "
                "sobre sua saúde financeira."
            )
    
    return {
        'insights': insights,
        'period': f"{current_month_start.strftime('%B/%Y')}",
        'total_income': current_income,
        'total_expense': current_expense,
        'balance': current_balance
    }