import {useEffect, useState} from 'react';
import {X} from 'lucide-react';
import {transactionsAPI} from '../api/api';

export default function BalanceHistoryModal({onClose}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [days, setDays] = useState(30);
    const [history, setHistory] = useState([]);
    const [closing, setClosing] = useState(false);

    const requestClose = () => {
        if (closing) return;
        setClosing(true);
        window.setTimeout(() => onClose?.(), 170);
    };

    const load = async (d) => {
        try {
            setLoading(true);
            setError('');
            const res = await transactionsAPI.getDailyBalance(d);
            const list = res.data.history || [];
            setHistory([...list].reverse());
        } catch (e) {
            console.error(e);
            setError('Não foi possível carregar o histórico de saldos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(days);
    }, []);

    return (
        <div className={`fixed inset-0 z-50 ${closing ? 'modal-out' : ''}`}>
            <div className="absolute inset-0 bg-black/50 modal-overlay" onClick={requestClose}/>
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl modal-panel">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Histórico de saldos</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Saldo acumulado ao fim do dia (23:00)</p>
                        </div>
                        <button
                            type="button"
                            onClick={requestClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                        </button>
                    </div>

                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Período</span>
                            <div className="flex items-center gap-2">
                                {[7, 30, 90].map((d) => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => {
                                            setDays(d);
                                            load(d);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                            days === d
                                                ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-600 text-primary-700 dark:text-primary-300'
                                                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {d}d
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-6">
                        {error && (
                            <div className="p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg text-danger-700 dark:text-danger-400 text-sm">
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"/>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="py-10 text-center text-gray-500 dark:text-gray-400 text-sm">
                                Nenhum dado para o período.
                            </div>
                        ) : (
                            <div className="max-h-[50vh] overflow-y-auto pr-1">
                                <div className="space-y-2">
                                    {history.map((row) => (
                                        <div
                                            key={row.date_iso}
                                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{row.date}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">23:00</p>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                R$ {Number(row.balance).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
