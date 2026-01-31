import {useState, useEffect} from 'react';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {TrendingUp, TrendingDown, Lightbulb, Plus, History} from 'lucide-react';
import {transactionsAPI, insightsAPI} from '../api/api';
import BalanceHistoryModal from './BalanceHistoryModal';
import {useTheme} from '../context/ThemeContext';

export default function Dashboard({onAddTransaction, refreshKey}) {
    const {theme} = useTheme();
    const [summary, setSummary] = useState({
        total_income: 0,
        total_expense: 0,
        balance: 0
    });
    const [categoryData, setCategoryData] = useState({expenses: [], incomes: []});
    const [insights, setInsights] = useState([]);
    const [balanceHistory, setBalanceHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isBalanceHistoryOpen, setIsBalanceHistoryOpen] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, [refreshKey]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            const summaryRes = await transactionsAPI.getSummary();
            setSummary(summaryRes.data);

            const categoryRes = await transactionsAPI.getByCategory();
            setCategoryData(categoryRes.data);

            const insightsRes = await insightsAPI.get();
            setInsights(insightsRes.data.insights || []);

            const historyRes = await transactionsAPI.getBalanceHistory(7);
            setBalanceHistory(historyRes.data.history || []);

        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981'];

    const pieLabel = ({cx, cy, midAngle, innerRadius, outerRadius, percent, category__name}) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 1.25;
        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
        const isDark = theme === 'dark';
        return (
            <text
                x={x}
                y={y}
                fill={isDark ? '#ffffff' : '#111827'}
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                style={{fontSize: '12px', fontWeight: 600}}
            >
                {`${category__name} ${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    const AnimatedTooltip = (props) => {
        const {active, payload, label} = props;
        if (!active || !payload || payload.length === 0) return null;

        return (
            <div className="bg-gray-800/95 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm shadow-lg tooltip-in">
                {label ? <div className="text-xs text-gray-200 mb-1">{label}</div> : null}
                {payload.map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                        <span className="text-gray-200">{p.name || p.dataKey}</span>
                        <span className="font-semibold">R$ {Number(p.value).toFixed(2)}</span>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Visão geral das suas finanças</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Total</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                                R$ {Number(summary.balance).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsBalanceHistoryOpen(true)}
                                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                title="Histórico de saldos"
                            >
                                <History className="w-5 h-5 text-gray-700 dark:text-gray-200"/>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Receitas</p>
                            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                                R$ {Number(summary.total_income).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => onAddTransaction?.('IN')}
                                className="p-2 bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50 rounded-lg transition-colors"
                                title="Adicionar Receita"
                            >
                                <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400"/>
                            </button>
                            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400"/>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Despesas</p>
                            <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">
                                R$ {Number(summary.total_expense).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => onAddTransaction?.('OUT')}
                                className="p-2 bg-danger-100 dark:bg-danger-900/30 hover:bg-danger-200 dark:hover:bg-danger-900/50 rounded-lg transition-colors"
                                title="Adicionar Despesa"
                            >
                                <Plus className="w-5 h-5 text-danger-600 dark:text-danger-400"/>
                            </button>
                            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-full flex items-center justify-center">
                                <TrendingDown className="w-6 h-6 text-danger-600 dark:text-danger-400"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" className="dark:stroke-gray-700"/>
                            <XAxis dataKey="date" stroke="#9ca3af" className="dark:stroke-gray-500" style={{fontSize: '12px'}}/>
                            <YAxis stroke="#9ca3af" className="dark:stroke-gray-500" style={{fontSize: '12px'}}/>
                            <Tooltip
                                contentStyle={{backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6'}}
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
                                    label={pieLabel}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="total"
                                    nameKey="category__name"
                                >
                                    {categoryData.expenses.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={<AnimatedTooltip/>}
                                    formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
                                    labelStyle={{color: '#ffffff'}}
                                    itemStyle={{color: '#ffffff'}}
                                    contentStyle={{backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#ffffff'}}
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

            <div className="card">
                <div className="flex items-center space-x-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-primary-600 dark:text-primary-400"/>
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

            {isBalanceHistoryOpen && (
                <BalanceHistoryModal onClose={() => setIsBalanceHistoryOpen(false)}/>
            )}
        </div>
    );
}