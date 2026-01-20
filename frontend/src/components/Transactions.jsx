import { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { transactionsAPI, categoriesAPI } from '../api/api';
import { format } from 'date-fns';
import AddTransaction from './AddTransaction';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transRes, catRes] = await Promise.all([
        transactionsAPI.getAll(),
        categoriesAPI.getAll()
      ]);
      setTransactions(transRes.data.results || transRes.data);
      setCategories(catRes.data.results || catRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir esta transação?')) return;

    try {
      await transactionsAPI.delete(id);
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      alert('Erro ao excluir transação');
    }
  };

  const handleTransactionAdded = () => {
    setShowAddModal(false);
    loadData();
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-500 mt-1">Gerencie seus gastos e receitas</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Transação</span>
        </button>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(transaction.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {transaction.category_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {transaction.type === 'IN' ? (
                          <TrendingUp className="w-4 h-4 text-primary-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-danger-600" />
                        )}
                        <span className={`text-sm font-semibold ${
                          transaction.type === 'IN' ? 'text-primary-600' : 'text-danger-600'
                        }`}>
                          R$ {Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-danger-600 hover:text-danger-700 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    Nenhuma transação encontrada. Clique em "Nova Transação" para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <AddTransaction
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onTransactionAdded={handleTransactionAdded}
        />
      )}
    </div>
  );
}