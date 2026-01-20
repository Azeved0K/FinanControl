import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { categoriesAPI } from '../api/api';

const AVAILABLE_ICONS = [
  { name: 'UtensilsCrossed', emoji: '🍽️', label: 'Alimentação' },
  { name: 'Car', emoji: '🚗', label: 'Transporte' },
  { name: 'Gamepad2', emoji: '🎮', label: 'Lazer' },
  { name: 'Heart', emoji: '❤️', label: 'Saúde' },
  { name: 'GraduationCap', emoji: '🎓', label: 'Educação' },
  { name: 'Home', emoji: '🏠', label: 'Moradia' },
  { name: 'Shirt', emoji: '👕', label: 'Vestuário' },
  { name: 'Briefcase', emoji: '💼', label: 'Trabalho' },
  { name: 'Laptop', emoji: '💻', label: 'Tecnologia' },
  { name: 'TrendingUp', emoji: '📈', label: 'Investimentos' },
  { name: 'ShoppingCart', emoji: '🛒', label: 'Compras' },
  { name: 'Plane', emoji: '✈️', label: 'Viagens' },
  { name: 'Coffee', emoji: '☕', label: 'Café' },
  { name: 'Gift', emoji: '🎁', label: 'Presentes' },
  { name: 'Music', emoji: '🎵', label: 'Música' },
  { name: 'Book', emoji: '📚', label: 'Livros' },
  { name: 'Smartphone', emoji: '📱', label: 'Telefone' },
  { name: 'Dumbbell', emoji: '🏋️', label: 'Academia' },
  { name: 'PiggyBank', emoji: '🐷', label: 'Poupança' },
  { name: 'DollarSign', emoji: '💰', label: 'Dinheiro' },
];

export default function CategoryModal({ category, onClose, onCategoryAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'OUT',
    icon: 'DollarSign'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        type: category.type,
        icon: category.icon
      });
    }
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      
      if (category) {
        await categoriesAPI.update(category.id, formData);
      } else {
        await categoriesAPI.create(formData);
      }
      
      onCategoryAdded();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 
                      err.response?.data?.name?.[0] ||
                      'Erro ao salvar categoria';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="label">Nome da Categoria</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              placeholder="Ex: Supermercado"
              required
              maxLength={100}
            />
          </div>

          {/* Type */}
          <div>
            <label className="label">Tipo</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'IN' }))}
                className={`py-3 px-4 rounded-lg font-medium transition-all border-2 ${
                  formData.type === 'IN'
                    ? 'bg-primary-50 border-primary-600 text-primary-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">📈</span>
                  <span>Receita</span>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'OUT' }))}
                className={`py-3 px-4 rounded-lg font-medium transition-all border-2 ${
                  formData.type === 'OUT'
                    ? 'bg-danger-50 border-danger-600 text-danger-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">📉</span>
                  <span>Despesa</span>
                </div>
              </button>
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="label">Ícone</label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-lg">
              {AVAILABLE_ICONS.map((icon) => (
                <button
                  key={icon.name}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon: icon.name }))}
                  className={`p-3 rounded-lg transition-all border-2 ${
                    formData.icon === icon.name
                      ? 'bg-primary-50 border-primary-600'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  title={icon.label}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-2xl">{icon.emoji}</span>
                    <span className="text-xs text-gray-600 truncate w-full text-center">
                      {icon.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selecione um ícone que represente sua categoria
            </p>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Preview:</p>
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                formData.type === 'IN' ? 'bg-primary-100' : 'bg-danger-100'
              }`}>
                <span className="text-2xl">
                  {AVAILABLE_ICONS.find(i => i.name === formData.icon)?.emoji || '💰'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {formData.name || 'Nome da Categoria'}
                </p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  formData.type === 'IN'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-danger-100 text-danger-700'
                }`}>
                  {formData.type === 'IN' ? 'Receita' : 'Despesa'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : category ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}