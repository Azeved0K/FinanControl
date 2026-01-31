import {useEffect, useMemo, useState} from 'react';
import {X, TrendingUp, Plus, Minus} from 'lucide-react';
import {piggyBanksAPI} from '../api/api';
import PiggyBankModal from './PiggyBankModal.jsx';
import PiggyBankTransactionModal from './PiggyBankTransactionModal.jsx';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function PiggyBankDetailsModal({piggyBank, onClose, onChanged}) {
    const [closing, setClosing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [summary, setSummary] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [editOpen, setEditOpen] = useState(false);
    const [txOpen, setTxOpen] = useState(false);
    const [txType, setTxType] = useState('DEPOSIT');

    const requestClose = () => {
        if (closing) return;
        setClosing(true);
        window.setTimeout(() => onClose?.(), 170);
    };

    const load = async () => {
        try {
            setLoading(true);
            setError('');
            const [s, f] = await Promise.all([
                piggyBanksAPI.getSummary(piggyBank.id),
                piggyBanksAPI.getForecast(piggyBank.id, 30),
            ]);
            setSummary(s.data);
            setForecast(f.data);
        } catch (e) {
            console.error(e);
            setError('Não foi possível carregar o cofrinho.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [piggyBank?.id]);

    const chartData = useMemo(() => {
        const list = forecast?.history || [];
        return list.map((r) => ({date: r.date, balance: Number(r.balance)}));
    }, [forecast]);

    if (!piggyBank) return null;

    return (
        <div className={`fixed inset-0 z-50 ${closing ? 'modal-out' : ''}`}>
            <div className="absolute inset-0 bg-black/50 modal-overlay" onClick={requestClose}/>
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl modal-panel max-h-[90vh] overflow-y-auto hide-scrollbar">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{piggyBank.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Taxa: {Number(piggyBank.rate_value).toLocaleString('pt-BR', {minimumFractionDigits: 2})}% / {piggyBank.rate_type === 'MONTHLY' ? 'mês' : 'ano'}
                            </p>
                        </div>
                        <button type="button" onClick={requestClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <X className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                        </button>
                    </div>

                    <div className="px-6 py-5 space-y-6">
                        {error && (
                            <div className="p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-900/40 rounded-lg text-danger-700 dark:text-danger-300 text-sm">
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"/>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Principal</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                                            R$ {Number(summary?.principal || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Saldo atual (estimado)</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                                            R$ {Number(summary?.current_balance || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Em 30 dias (estimado)</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                                            R$ {Number(forecast?.end_balance || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTxType('DEPOSIT');
                                            setTxOpen(true);
                                        }}
                                        className="btn btn-primary flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4"/>
                                        <span>Depositar</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTxType('WITHDRAW');
                                            setTxOpen(true);
                                        }}
                                        className="btn btn-secondary flex items-center gap-2"
                                    >
                                        <Minus className="w-4 h-4"/>
                                        <span>Sacar</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditOpen(true)}
                                        className="btn btn-secondary"
                                    >
                                        Editar
                                    </button>
                                </div>

                                <div className="card p-0 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400"/>
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">Projeção (30 dias)</h4>
                                    </div>
                                    <div className="p-6">
                                        <ResponsiveContainer width="100%" height={280}>
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="piggyBalance" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.30}/>
                                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" className="dark:stroke-gray-700"/>
                                                <XAxis dataKey="date" stroke="#9ca3af" className="dark:stroke-gray-500" style={{fontSize: '12px'}}/>
                                                <YAxis stroke="#9ca3af" className="dark:stroke-gray-500" style={{fontSize: '12px'}}/>
                                                <Tooltip contentStyle={{backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#ffffff'}}/>
                                                <Area type="monotone" dataKey="balance" stroke="#22c55e" strokeWidth={2} fill="url(#piggyBalance)"/>
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="card">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Rendimento diário (30 dias)</h4>
                                    <div className="max-h-[40vh] overflow-y-auto hide-scrollbar space-y-2">
                                        {(forecast?.history || []).map((r) => (
                                            <div key={r.date_iso} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.date}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Rendeu: R$ {Number(r.interest).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                    R$ {Number(r.balance).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {editOpen && (
                <PiggyBankModal
                    piggyBank={piggyBank}
                    onClose={() => setEditOpen(false)}
                    onSaved={() => {
                        setEditOpen(false);
                        onChanged?.();
                        load();
                    }}
                />
            )}

            {txOpen && (
                <PiggyBankTransactionModal
                    piggyBank={piggyBank}
                    type={txType}
                    onClose={() => setTxOpen(false)}
                    onSaved={() => {
                        setTxOpen(false);
                        onChanged?.();
                        load();
                    }}
                />
            )}
        </div>
    );
}
