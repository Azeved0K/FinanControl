import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { transactionsAPI } from '../api/api';
import { format } from 'date-fns';

export default function AddTransaction({ categories, transaction, defaultType, onClose, onTransactionAdded }) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: defaultType || 'OUT',
    category: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setFormData({
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date,
        type: transaction.type,
        category: transaction.category
      });
    }
  }, [transaction]);

  const filteredCategories = categories.filter(c => c.type === formData.type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.category) {
      setError('Selecione uma categoria');
      return;
    }

    try {
      setLoading(true);
      
      if (transaction) {
        // Atualizar transação existente
        await transactionsAPI.update(transaction.id, {
          ...formData,
          amount: parseFloat(formData.amount)
        });
      } else {
        // Criar nova transação
        await transactionsAPI.create({
          ...formData,
          amount: parseFloat(formData.amount)
        });
      }
      
      onTransactionAdded();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar transação');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Reset category when type changes
      if (name === 'type') {
        newData.category = '';
      }
      
      return newData;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {transaction ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg text-danger-700 dark:text-danger-400 text-sm">
              {error}
            </div>
          )}

          {/* Type */}
          <div>
            <label className="label">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'type', value: 'IN' }})}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  formData.type === 'IN'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Receita
              </button>
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'type', value: 'OUT' }})}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  formData.type === 'OUT'
                    ? 'bg-danger-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Despesa
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Descrição</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input"
              placeholder="Ex: Supermercado"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="label">Valor (R$)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="input"
              placeholder="0,00"
              step="0.01"
              min="0.01"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="label">Categoria</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Selecione uma categoria</option>
              {filteredCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="label">Data</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="input"
              required
            />
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
              {loading ? 'Salvando...' : transaction ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}