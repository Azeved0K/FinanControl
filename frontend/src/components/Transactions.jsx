import {useState, useEffect} from 'react';
import {Plus, Trash2, TrendingUp, TrendingDown, Edit2} from 'lucide-react';
import {transactionsAPI, categoriesAPI} from '../api/api';
import {format} from 'date-fns';
import AddTransaction from './AddTransaction';

export default function Transactions({defaultType}) {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [editingTransaction, setEditingTransaction] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (defaultType) {
            setShowAddModal(true);
        }
    }, [defaultType]);

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
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } catch (error) {
            console.error('Erro ao excluir transação:', error);
            alert('Erro ao excluir transação');
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Deseja excluir ${selectedIds.length} transações selecionadas?`)) return;

        try {
            await Promise.all(selectedIds.map(id => transactionsAPI.delete(id)));
            setTransactions(transactions.filter(t => !selectedIds.includes(t.id)));
            setSelectedIds([]);
        } catch (error) {
            console.error('Erro ao excluir transações:', error);
            alert('Erro ao excluir transações');
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === transactions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(transactions.map(t => t.id));
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleTransactionAdded = () => {
        setShowAddModal(false);
        setEditingTransaction(null);
        loadData();
    };

    const handleEdit = (transaction) => {
        setEditingTransaction(transaction);
        setShowAddModal(true);
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Transações</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie seus gastos e receitas</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary flex items-center space-x-2"
                >
                    <Plus className="w-5 h-5"/>
                    <span>Nova Transação</span>
                </button>
            </div>

            {selectedIds.length > 0 && (
                <div className="card bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                            {selectedIds.length} transação(ões) selecionada(s)
                        </p>
                        <button
                            onClick={handleDeleteSelected}
                            className="btn btn-danger flex items-center space-x-2"
                        >
                            <Trash2 className="w-4 h-4"/>
                            <span>Excluir Selecionadas</span>
                        </button>
                    </div>
                </div>
            )}

            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === transactions.length && transactions.length > 0}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-primary-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-primary-500"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Data
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Descrição
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Categoria
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Valor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Ações
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {transactions.length > 0 ? (
                            transactions.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(transaction.id)}
                                            onChange={() => handleSelectOne(transaction.id)}
                                            className="w-4 h-4 text-primary-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-primary-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {format(new Date(transaction.date), 'dd/MM/yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {transaction.description}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                        {transaction.category_name}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            {transaction.type === 'IN' ? (
                                                <TrendingUp className="w-4 h-4 text-primary-600 dark:text-primary-400"/>
                                            ) : (
                                                <TrendingDown className="w-4 h-4 text-danger-600 dark:text-danger-400"/>
                                            )}
                                            <span className={`text-sm font-semibold ${
                                                transaction.type === 'IN' ? 'text-primary-600 dark:text-primary-400' : 'text-danger-600 dark:text-danger-400'
                                            }`}>
                          R$ {Number(transaction.amount).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEdit(transaction)}
                                                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-5 h-5"/>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(transaction.id)}
                                                className="text-danger-600 dark:text-danger-400 hover:text-danger-700 dark:hover:text-danger-300 transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                    Nenhuma transação encontrada. Clique em "Nova Transação" para começar.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAddModal && (
                <AddTransaction
                    categories={categories}
                    transaction={editingTransaction}
                    defaultType={defaultType}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingTransaction(null);
                    }}
                    onTransactionAdded={handleTransactionAdded}
                />
            )}
        </div>
    );
}