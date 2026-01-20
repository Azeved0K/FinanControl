# FinControl - Gerenciador Financeiro Pessoal

Sistema completo de gerenciamento financeiro pessoal desenvolvido com Django REST Framework e React, containerizado com Docker.

## 🚀 Tecnologias

### Backend
- Python 3.11
- Django 5.0
- Django REST Framework
- PostgreSQL 15
- Docker & Docker Compose

### Frontend
- React 18
- Vite
- Tailwind CSS
- Recharts (gráficos)
- Lucide React (ícones)
- Axios

## 📋 Funcionalidades

- ✅ Autenticação completa (Login, Registro, Logout)
- ✅ CRUD de Transações (Receitas e Despesas)
- ✅ CRUD de Categorias personalizadas
- ✅ Dashboard com gráficos interativos
- ✅ Sistema de Insights Financeiros
- ✅ Design responsivo (Mobile-first)
- ✅ Dados de teste incluídos

## 🔧 Instalação e Execução

### Pré-requisitos
- Docker
- Docker Compose

### Passo 1: Clone o repositório
```bash
git clone <seu-repositorio>
cd fincontrol
```

### Passo 2: Inicie os containers
```bash
docker-compose up --build
```

Aguarde os containers iniciarem. O processo inclui:
1. Criação do banco PostgreSQL
2. Migrações do Django
3. Seed de dados (usuário de teste + categorias + transações)
4. Inicialização do backend (porta 8000)
5. Inicialização do frontend (porta 5173)

### Passo 3: Acesse o sistema

**Frontend:** http://localhost:5173

**Credenciais de teste:**
- Usuário: `teste`
- Senha: `teste123`

**Backend Admin:** http://localhost:8000/admin
(Crie um superusuário com `docker-compose exec backend python manage.py createsuperuser`)

## 📁 Estrutura do Projeto

```
fincontrol/
├── backend/
│   ├── api/
│   │   ├── models.py              # Models (Category, Transaction)
│   │   ├── serializers.py         # Serializers DRF
│   │   ├── views.py               # ViewSets e endpoints
│   │   ├── urls.py                # Rotas da API
│   │   ├── utils/
│   │   │   └── insights.py        # Engine de insights financeiros
│   │   └── management/
│   │       └── commands/
│   │           └── seed_data.py   # Comando de seed
│   └── fincontrol/
│       ├── settings.py            # Configurações Django
│       └── urls.py                # URLs principais
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Sidebar.jsx        # Navegação lateral
│       │   ├── Dashboard.jsx      # Dashboard com gráficos
│       │   ├── Transactions.jsx   # Lista de transações
│       │   └── AddTransaction.jsx # Modal de criação
│       ├── api/
│       │   └── api.js             # Cliente Axios
│       └── App.jsx                # Componente principal
└── docker-compose.yml
```

## 🔌 API Endpoints

### Autenticação
- `POST /api/auth/login/` - Login
- `POST /api/auth/register/` - Registro
- `POST /api/auth/logout/` - Logout

### Categorias
- `GET /api/categories/` - Listar categorias
- `POST /api/categories/` - Criar categoria
- `PUT /api/categories/{id}/` - Atualizar categoria
- `DELETE /api/categories/{id}/` - Deletar categoria

### Transações
- `GET /api/transactions/` - Listar transações
- `POST /api/transactions/` - Criar transação
- `PUT /api/transactions/{id}/` - Atualizar transação
- `DELETE /api/transactions/{id}/` - Deletar transação
- `GET /api/transactions/summary/` - Resumo financeiro
- `GET /api/transactions/by_category/` - Agrupar por categoria

### Insights
- `GET /api/insights/` - Obter dicas financeiras

## 🎨 Design

O sistema utiliza uma paleta de cores clean e profissional:
- **Verde (Primary):** Receitas e ações positivas
- **Vermelho (Danger):** Despesas e ações de exclusão
- **Cinza:** Backgrounds e textos neutros
- **Branco:** Cards e elementos principais

## 🧪 Comandos Úteis

### Recriar dados de teste
```bash
docker-compose exec backend python manage.py seed_data
```

### Acessar shell do Django
```bash
docker-compose exec backend python manage.py shell
```

### Ver logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Parar containers
```bash
docker-compose down
```

### Limpar volumes (resetar banco)
```bash
docker-compose down -v
```

## 📊 Funcionalidades Detalhadas

### Dashboard
- Cards de resumo (Saldo, Receitas, Despesas)
- Gráfico de área mostrando evolução do saldo
- Gráfico de pizza com distribuição de gastos por categoria
- Seção de insights financeiros personalizados

### Sistema de Insights
Analisa suas transações e fornece dicas como:
- Comparação de gastos entre meses
- Alertas de categorias com gastos elevados
- Sugestões de economia
- Taxa de poupança

### Transações
- Tabela responsiva com todas as transações
- Filtros por tipo, categoria e data
- Modal intuitivo para adicionar novas transações
- Exclusão rápida de transações

## 🔒 Segurança

- Token Authentication (DRF)
- Validação de dados no backend
- Proteção CSRF
- CORS configurado
- Senhas hasheadas (Django)

## 📱 Responsividade

- Layout adaptável para mobile, tablet e desktop
- Sidebar transformada em menu hambúrguer no mobile
- Tabelas com scroll horizontal
- Design mobile-first

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Desenvolvido por

Arquiteto de Software e Desenvolvedor Full Stack Sênior

---

**FinControl** - Controle suas finanças com inteligência! 💰📊