import { useState, useEffect } from 'react';
import { authAPI } from './api/api';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Categories from './components/Categories';

function Login({ onLogin }) {
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
      localStorage.setItem('user', JSON.stringify({
        id: res.data.user_id,
        username: res.data.username,
        email: res.data.email
      }));
      
      onLogin();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">FinControl</h1>
          <p className="text-gray-500 mt-2">
            {isRegister ? 'Crie sua conta' : 'Entre na sua conta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="label">Usuário</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            {isRegister ? 'Já tem conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>

        {!isRegister && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700 text-center">
              <strong>Conta de teste:</strong> teste / teste123
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [transactionType, setTransactionType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const handleAddTransaction = (type) => {
    setTransactionType(type);
    setCurrentView('transactions');
  };

  const handleNavigate = (view) => {
    setTransactionType(null); // Limpar tipo ao navegar
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
        <Login onLogin={() => setIsAuthenticated(true)} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar currentView={currentView} setCurrentView={handleNavigate} />
        
        <main className="lg:pl-64 pt-16 lg:pt-0">
          <div className="p-6 lg:p-8">
            {currentView === 'dashboard' && (
              <Dashboard 
                onNavigate={handleNavigate} 
                onAddTransaction={handleAddTransaction}
              />
            )}
            {currentView === 'transactions' && (
              <Transactions defaultType={transactionType} />
            )}
            {currentView === 'categories' && <Categories />}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;