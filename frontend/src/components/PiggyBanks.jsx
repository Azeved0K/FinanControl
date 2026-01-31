import {useEffect, useMemo, useState} from 'react';
import {Plus, PiggyBank as PiggyIcon} from 'lucide-react';
import {piggyBanksAPI} from '../api/api';
import PiggyBankModal from './PiggyBankModal.jsx';
import PiggyBankDetailsModal from './PiggyBankDetailsModal.jsx';

export default function PiggyBanks() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [items, setItems] = useState([]);
    const [createOpen, setCreateOpen] = useState(false);
    const [selected, setSelected] = useState(null);

    const load = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await piggyBanksAPI.getAll();
            setItems(res.data.results || res.data || []);
        } catch (e) {
            console.error(e);
            setError('Não foi possível carregar seus cofrinhos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const activeItems = useMemo(() => items.filter((x) => x.is_active !== false), [items]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Cofrinhos</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">CDI/juros compostos com estimativa diária</p>
                </div>
                <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4"/>
                    <span>Novo cofrinho</span>
                </button>
            </div>

            {error && (
                <div className="p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-900/40 rounded-lg text-danger-700 dark:text-danger-300 text-sm">
                    {error}
                </div>
            )}

            {activeItems.length === 0 ? (
                <div className="card">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <PiggyIcon className="w-6 h-6 text-primary-600 dark:text-primary-400"/>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">Você ainda não tem cofrinhos</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Crie um cofrinho para acompanhar o rendimento diário.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {activeItems.map((pb) => (
                        <button
                            key={pb.id}
                            type="button"
                            onClick={() => setSelected(pb)}
                            className="card text-left hover:shadow-lg transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{pb.name}</p>
                                    {pb.description ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{pb.description}</p>
                                    ) : null}
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        Taxa: {Number(pb.rate_value).toLocaleString('pt-BR', {minimumFractionDigits: 2})}% / {pb.rate_type === 'MONTHLY' ? 'mês' : 'ano'}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                    <PiggyIcon className="w-6 h-6 text-gray-700 dark:text-gray-200"/>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {createOpen && (
                <PiggyBankModal
                    piggyBank={null}
                    onClose={() => setCreateOpen(false)}
                    onSaved={() => {
                        setCreateOpen(false);
                        load();
                    }}
                />
            )}

            {selected && (
                <PiggyBankDetailsModal
                    piggyBank={selected}
                    onClose={() => setSelected(null)}
                    onChanged={() => load()}
                />
            )}
        </div>
    );
}
