import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown } from 'lucide-react';
import { categoriesAPI } from '../api/api';
import CategoryModal from './CategoryModal';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, IN, OUT

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await categoriesAPI.getAll();
      setCategories(res.data.results || res.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Deseja realmente excluir a categoria "${name}"?`)) return;

    try {
      await categoriesAPI.delete(id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      alert('Erro ao excluir categoria. Pode haver transações vinculadas.');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleCategoryAdded = () => {
    handleModalClose();
    loadCategories();
  };

  const filteredCategories = categories.filter(cat => {
    if (filter === 'ALL') return true;
    return cat.type === filter;
  });

  const incomeCount = categories.filter(c => c.type === 'IN').length;
  const expenseCount = categories.filter(c => c.type === 'OUT').length;

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-500 mt-1">Gerencie suas categorias personalizadas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {categories.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Receitas</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">
                {incomeCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Despesas</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">
                {expenseCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-danger-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            filter === 'ALL'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Todas ({categories.length})
        </button>
        <button
          onClick={() => setFilter('IN')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            filter === 'IN'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Receitas ({incomeCount})
        </button>
        <button
          onClick={() => setFilter('OUT')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            filter === 'OUT'
              ? 'border-danger-600 text-danger-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Despesas ({expenseCount})
        </button>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    category.type === 'IN' ? 'bg-primary-100' : 'bg-danger-100'
                  }`}>
                    <span className="text-2xl">{getIconEmoji(category.icon)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {category.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        category.type === 'IN'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-danger-100 text-danger-700'
                      }`}>
                        {category.type === 'IN' ? 'Receita' : 'Despesa'}
                      </span>
                      {category.transaction_count > 0 && (
                        <span className="text-xs text-gray-500">
                          {category.transaction_count} transações
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-1 ml-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id, category.name)}
                    className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <p className="text-gray-500 text-lg">
            {filter === 'ALL'
              ? 'Nenhuma categoria encontrada'
              : `Nenhuma categoria de ${filter === 'IN' ? 'receita' : 'despesa'} encontrada`
            }
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary mt-4 inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Criar Primeira Categoria</span>
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CategoryModal
          category={editingCategory}
          onClose={handleModalClose}
          onCategoryAdded={handleCategoryAdded}
        />
      )}
    </div>
  );
}

// Helper function para converter nome do ícone em emoji
function getIconEmoji(iconName) {
  const iconMap = {
    'UtensilsCrossed': '🍽️',
    'Car': '🚗',
    'Gamepad2': '🎮',
    'Heart': '❤️',
    'GraduationCap': '🎓',
    'Home': '🏠',
    'Shirt': '👕',
    'Briefcase': '💼',
    'Laptop': '💻',
    'TrendingUp': '📈',
    'DollarSign': '💰',
    'ShoppingCart': '🛒',
    'Plane': '✈️',
    'Coffee': '☕',
    'Gift': '🎁',
    'Music': '🎵',
    'Book': '📚',
    'Smartphone': '📱',
    'Dumbbell': '🏋️',
    'PiggyBank': '🐷',
  };
  
  return iconMap[iconName] || '📌';
}