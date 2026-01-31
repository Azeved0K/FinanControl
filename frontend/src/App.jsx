import {useState, useEffect} from 'react';
import {authAPI} from './api/api';
import {ThemeProvider} from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Categories from './components/Categories';
import Profile from './components/Profile';
import ThemeToggle from './components/ThemeToggle';
import AddTransaction from './components/AddTransaction';
import {categoriesAPI} from './api/api';
import RequireCategoryModal from './components/RequireCategoryModal';
import CategoryModal from './components/CategoryModal';
import PiggyBanks from './components/PiggyBanks';

function Login({onLogin}) {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = isRegister
                ? await authAPI.register(formData)
                : await authAPI.login({
                    username: formData.username,
                    password: formData.password
                });

            localStorage.setItem('token', res.data.token);

            try {
                const meRes = await authAPI.me();
                localStorage.setItem('user', JSON.stringify({
                    id: meRes.data.id,
                    username: meRes.data.username,
                    email: meRes.data.email,
                    avatar_url: meRes.data.avatar_url || null,
                }));
            } catch (_) {
                localStorage.setItem('user', JSON.stringify({
                    id: res.data.user_id,
                    username: res.data.username,
                    email: res.data.email
                }));
            }

            onLogin();
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100/60 via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-950"/>

            <div className="fixed bottom-4 right-4 z-50">
                <ThemeToggle/>
            </div>

            <div className="relative w-full max-w-md">
                <div className="bg-white/90 dark:bg-gray-800/70 backdrop-blur rounded-2xl shadow-xl p-8 w-full border border-gray-200/60 dark:border-gray-700 modal-panel">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">FinControl</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            {isRegister ? 'Crie sua conta' : 'Entre na sua conta'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-900/40 rounded-lg text-danger-700 dark:text-danger-300 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="label">Usuário</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                className="input"
                                required
                            />
                        </div>

                        {isRegister && (
                            <div>
                                <label className="label">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="input"
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label className="label">Senha</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="input"
                                required
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn btn-primary disabled:opacity-50"
                        >
                            {loading ? 'Carregando...' : isRegister ? 'Cadastrar' : 'Entrar'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsRegister(!isRegister);
                                setError('');
                            }}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium transition-colors"
                        >
                            {isRegister ? 'Já tem conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentView, setCurrentView] = useState('dashboard');
    const [transactionType, setTransactionType] = useState(null);
    const [loading, setLoading] = useState(true);

    const [dashboardAddOpen, setDashboardAddOpen] = useState(false);
    const [dashboardCategories, setDashboardCategories] = useState([]);
    const [requireCategoryOpen, setRequireCategoryOpen] = useState(false);
    const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
    const [pendingTransactionType, setPendingTransactionType] = useState(null);
    const [pendingCategoryType, setPendingCategoryType] = useState('OUT');
    const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
        setLoading(false);
    }, []);

    const handleAddTransaction = async (type) => {
        setTransactionType(type);

        let cats = [];
        try {
            const catRes = await categoriesAPI.getAll();
            cats = catRes.data.results || catRes.data;
        } catch (e) {
            console.error(e);
        }

        const hasTypeCategory = Array.isArray(cats) && cats.some((c) => c.type === type);

        if (!hasTypeCategory) {
            setPendingTransactionType(type);
            setPendingCategoryType(type);
            setRequireCategoryOpen(true);
            return;
        }

        if (currentView === 'dashboard') {
            setDashboardCategories(cats);
            setDashboardAddOpen(true);
            return;
        }

        setCurrentView('transactions');
    };

    const handleNavigate = (view) => {
        setTransactionType(null);
        setCurrentView(view);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <ThemeProvider>
                <Login onLogin={() => setIsAuthenticated(true)}/>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar currentView={currentView} setCurrentView={handleNavigate}/>

                <main className="lg:pl-64 pt-16 lg:pt-0">
                    <div className="p-6 lg:p-8">
                        {currentView === 'dashboard' && (
                            <Dashboard onAddTransaction={handleAddTransaction} refreshKey={dashboardRefreshKey}/>
                        )}
                        {currentView === 'transactions' && (
                            <Transactions defaultType={transactionType}/>
                        )}
                        {currentView === 'categories' && <Categories/>}
                        {currentView === 'piggybanks' && <PiggyBanks/>}
                        {currentView === 'profile' && <Profile/>}
                    </div>
                </main>

                {dashboardAddOpen && (
                    <AddTransaction
                        categories={dashboardCategories}
                        transaction={null}
                        defaultType={transactionType}
                        onClose={() => setDashboardAddOpen(false)}
                        onTransactionAdded={() => {
                            setDashboardAddOpen(false);
                            if (currentView === 'dashboard') {
                                setDashboardRefreshKey((k) => k + 1);
                            }
                        }}
                    />
                )}

                {requireCategoryOpen && (
                    <RequireCategoryModal
                        type={pendingCategoryType}
                        onClose={() => {
                            setRequireCategoryOpen(false);
                            setPendingTransactionType(null);
                        }}
                        onConfirm={() => {
                            setRequireCategoryOpen(false);
                            setCreateCategoryOpen(true);
                        }}
                    />
                )}

                {createCategoryOpen && (
                    <CategoryModal
                        category={null}
                        defaultType={pendingCategoryType}
                        onClose={() => {
                            setCreateCategoryOpen(false);
                            setPendingTransactionType(null);
                        }}
                        onCategoryAdded={async () => {
                            setCreateCategoryOpen(false);
                            try {
                                const catRes = await categoriesAPI.getAll();
                                const cats = catRes.data.results || catRes.data;
                                setDashboardCategories(cats);
                                if (pendingTransactionType) {
                                    setTransactionType(pendingTransactionType);
                                    setDashboardAddOpen(true);
                                }
                            } catch (e) {
                                console.error(e);
                            } finally {
                                setPendingTransactionType(null);
                            }
                        }}
                    />
                )}
            </div>
        </ThemeProvider>
    );
}

export default App;

