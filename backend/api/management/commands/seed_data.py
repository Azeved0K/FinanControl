from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Category, Transaction
from faker import Faker
from decimal import Decimal
from datetime import datetime, timedelta
import random


class Command(BaseCommand):
    help = 'Popula o banco de dados com dados de teste'

    def handle(self, *args, **kwargs):
        fake = Faker('pt_BR')
        
        self.stdout.write(self.style.WARNING('Iniciando seed de dados...'))
        
        # Criar usuário de teste
        username = 'teste'
        email = 'teste@fincontrol.com'
        password = 'teste123'
        
        # Verificar se o usuário já existe
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'Usuário "{username}" já existe. Pulando criação.')
            )
            user = User.objects.get(username=username)
        else:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name='Usuário',
                last_name='Teste'
            )
            self.stdout.write(
                self.style.SUCCESS(f'Usuário criado: {username} / {password}')
            )
        
        # Limpar categorias e transações existentes do usuário
        Transaction.objects.filter(user=user).delete()
        Category.objects.filter(user=user).delete()
        
        # Definir categorias de despesas
        expense_categories_data = [
            {'name': 'Alimentação', 'icon': 'UtensilsCrossed', 'type': 'OUT'},
            {'name': 'Transporte', 'icon': 'Car', 'type': 'OUT'},
            {'name': 'Lazer', 'icon': 'Gamepad2', 'type': 'OUT'},
            {'name': 'Saúde', 'icon': 'Heart', 'type': 'OUT'},
            {'name': 'Educação', 'icon': 'GraduationCap', 'type': 'OUT'},
            {'name': 'Moradia', 'icon': 'Home', 'type': 'OUT'},
            {'name': 'Vestuário', 'icon': 'Shirt', 'type': 'OUT'},
        ]
        
        # Definir categorias de receitas
        income_categories_data = [
            {'name': 'Salário', 'icon': 'Briefcase', 'type': 'IN'},
            {'name': 'Freelance', 'icon': 'Laptop', 'type': 'IN'},
            {'name': 'Investimentos', 'icon': 'TrendingUp', 'type': 'IN'},
        ]
        
        # Criar categorias
        categories = []
        for cat_data in expense_categories_data + income_categories_data:
            category = Category.objects.create(
                user=user,
                name=cat_data['name'],
                icon=cat_data['icon'],
                type=cat_data['type']
            )
            categories.append(category)
        
        self.stdout.write(
            self.style.SUCCESS(f'Criadas {len(categories)} categorias')
        )
        
        # Separar categorias por tipo
        expense_categories = [c for c in categories if c.type == 'OUT']
        income_categories = [c for c in categories if c.type == 'IN']
        
        # Criar transações dos últimos 60 dias
        transactions = []
        today = datetime.now().date()
        
        # Descrições específicas por categoria
        descriptions_by_category = {
            'Alimentação': [
                'Supermercado', 'Restaurante', 'Lanchonete', 
                'Delivery', 'Padaria', 'Feira'
            ],
            'Transporte': [
                'Gasolina', 'Uber', 'Manutenção do carro', 
                'Estacionamento', 'Pedágio'
            ],
            'Lazer': [
                'Cinema', 'Streaming', 'Jogo', 
                'Show', 'Parque', 'Livro'
            ],
            'Saúde': [
                'Farmácia', 'Consulta médica', 'Academia', 
                'Plano de saúde', 'Exames'
            ],
            'Educação': [
                'Curso online', 'Material didático', 'Mensalidade', 
                'Livros técnicos'
            ],
            'Moradia': [
                'Aluguel', 'Condomínio', 'Água', 
                'Luz', 'Internet', 'Gás'
            ],
            'Vestuário': [
                'Roupas', 'Calçados', 'Acessórios'
            ],
            'Salário': ['Salário mensal', 'Pagamento'],
            'Freelance': ['Projeto', 'Consultoria', 'Trabalho extra'],
            'Investimentos': ['Rendimento', 'Dividendos', 'Lucro']
        }
        
        # Gerar transações
        for i in range(60):
            transaction_date = today - timedelta(days=random.randint(0, 60))
            
            # Decidir se é receita ou despesa (80% despesas, 20% receitas)
            is_expense = random.random() < 0.8
            
            if is_expense:
                category = random.choice(expense_categories)
                transaction_type = 'OUT'
                amount = Decimal(str(round(random.uniform(20, 500), 2)))
            else:
                category = random.choice(income_categories)
                transaction_type = 'IN'
                
                # Receitas tendem a ser maiores
                if category.name == 'Salário':
                    amount = Decimal(str(round(random.uniform(3000, 6000), 2)))
                elif category.name == 'Freelance':
                    amount = Decimal(str(round(random.uniform(500, 2000), 2)))
                else:  # Investimentos
                    amount = Decimal(str(round(random.uniform(100, 800), 2)))
            
            # Escolher descrição apropriada
            descriptions = descriptions_by_category.get(
                category.name, 
                [category.name]
            )
            description = random.choice(descriptions)
            
            transaction = Transaction.objects.create(
                user=user,
                category=category,
                description=description,
                amount=amount,
                date=transaction_date,
                type=transaction_type
            )
            transactions.append(transaction)
        
        self.stdout.write(
            self.style.SUCCESS(f'Criadas {len(transactions)} transações')
        )
        
        # Resumo
        total_income = sum(
            t.amount for t in transactions if t.type == 'IN'
        )
        total_expense = sum(
            t.amount for t in transactions if t.type == 'OUT'
        )
        balance = total_income - total_expense
        
        self.stdout.write(self.style.SUCCESS('\n--- RESUMO ---'))
        self.stdout.write(f'Total de Receitas: R$ {total_income:,.2f}')
        self.stdout.write(f'Total de Despesas: R$ {total_expense:,.2f}')
        self.stdout.write(f'Saldo: R$ {balance:,.2f}')
        self.stdout.write(
            self.style.SUCCESS('\n✅ Seed de dados concluído com sucesso!')
        )