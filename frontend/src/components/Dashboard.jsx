import { useState, useEffect } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Lightbulb } from 'lucide-react';
import { transactionsAPI, insightsAPI } from '../api/api';
import { format, subDays } from 'date-fns';

export default function Dashboard() {
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0
  });
  const [categoryData, setCategoryData] = useState({ expenses: [], incomes: [] });
  const [insights, setInsights] = useState([]);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar resumo
      const summaryRes = await transactionsAPI.getSummary();
      setSummary(summaryRes.data);

      // Carregar dados por categoria
      const categoryRes = await transactionsAPI.getByCategory();
      setCategoryData(categoryRes.data);

      // Carregar insights
      const insightsRes = await insightsAPI.get();
      setInsights(insightsRes.data.insights || []);

      // Simular histórico de saldo (últimos 7 dias)
      const history = [];
      const today = new Date();
      let runningBalance = 0;
      
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        runningBalance += Math.random() * 500 - 200;
        history.push({
          date: format(date, 'dd/MM'),
          balance: Math.max(0, summaryRes.data.balance / 7 + runningBalance)
        });
      }
      setBalanceHistory(history);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Visão geral das suas finanças</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                R$ {Number(summary.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Receitas</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                R$ {Number(summary.total_income).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Despesas</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">
                R$ {Number(summary.total_expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance History */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Evolução do Saldo</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={balanceHistory}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" className="dark:stroke-gray-700" />
              <XAxis dataKey="date" stroke="#9ca3af" className="dark:stroke-gray-500" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" className="dark:stroke-gray-500" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6' }}
                formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Saldo']}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBalance)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses by Category */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Gastos por Categoria</h2>
          {categoryData.expenses.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData.expenses}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category__name, percent }) => `${category__name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                  nameKey="category__name"
                >
                  {categoryData.expenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <p>Nenhuma despesa registrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Financial Insights */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Dicas Financeiras</h2>
        </div>
        <div className="space-y-3">
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                <p className="text-sm text-gray-700 dark:text-gray-300">{insight}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Continue registrando suas transações para receber insights personalizados.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}