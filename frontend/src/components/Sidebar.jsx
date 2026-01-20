import { useState } from 'react';
import { LayoutDashboard, ArrowLeftRight, LogOut, Menu, X, TrendingUp, FolderOpen } from 'lucide-react';
import { authAPI } from '../api/api';
import ThemeToggle from './ThemeToggle';

export default function Sidebar({ currentView, setCurrentView }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transações', icon: ArrowLeftRight },
    { id: 'categories', label: 'Categorias', icon: FolderOpen },
  ];

  const MenuItem = ({ item, onClick }) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;
    
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
          isActive
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : ''}`} />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-7 h-7 text-primary-600 dark:text-primary-500" />
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">FinControl</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="hidden lg:flex items-center space-x-2 px-6 py-6 border-b border-gray-200 dark:border-gray-700">
            <TrendingUp className="w-8 h-8 text-primary-600 dark:text-primary-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">FinControl</span>
          </div>

          {/* User Info */}
          <div className="px-4 py-6 border-b border-gray-200 dark:border-gray-700 mt-16 lg:mt-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <span className="text-primary-700 dark:text-primary-300 font-semibold text-lg">
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.username || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email || 'email@exemplo.com'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <MenuItem
                key={item.id}
                item={item}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsMobileMenuOpen(false);
                }}
              />
            ))}
          </nav>

          {/* Logout */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tema</span>
              <ThemeToggle />
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}