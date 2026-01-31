import {useState} from 'react';
import {X, Save} from 'lucide-react';
import {piggyBankTransactionsAPI} from '../api/api';
import {format} from 'date-fns';

export default function PiggyBankTransactionModal({piggyBank, type, onClose, onSaved}) {
    const [closing, setClosing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        note: '',
    });

    const requestClose = () => {
        if (saving || closing) return;
        setClosing(true);
        window.setTimeout(() => onClose?.(), 170);
    };

    const submit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            setSaving(true);
            await piggyBankTransactionsAPI.create({
                piggy_bank: piggyBank.id,
                type,
                amount: parseFloat(form.amount),
                date: form.date,
                note: form.note,
            });
            onSaved?.();
        } catch (e2) {
            const data = e2?.response?.data;
            if (data && typeof data === 'object') {
                const k = Object.keys(data)[0];
                const msg = Array.isArray(data[k]) ? data[k][0] : data[k];
                setError(String(msg || 'Erro ao salvar movimentação.'));
            } else {
                setError('Erro ao salvar movimentação.');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-50 ${closing ? 'modal-out' : ''}`}>
            <div className="absolute inset-0 bg-black/50 modal-overlay" onClick={requestClose}/>
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl modal-panel">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {type === 'DEPOSIT' ? 'Depositar' : 'Sacar'}
                        </h3>
                        <button type="button" onClick={requestClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" disabled={saving}>
                            <X className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                        </button>
                    </div>

                    <form onSubmit={submit} className="px-6 py-5 space-y-4">
                        {error && (
                            <div className="p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-900/40 rounded-lg text-danger-700 dark:text-danger-300 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="label">Valor (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                className="input"
                                value={form.amount}
                                onChange={(e) => setForm((p) => ({...p, amount: e.target.value}))}
                                required
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label className="label">Data</label>
                            <input
                                type="date"
                                className="input"
                                value={form.date}
                                onChange={(e) => setForm((p) => ({...p, date: e.target.value}))}
                                required
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label className="label">Observação</label>
                            <input
                                className="input"
                                value={form.note}
                                onChange={(e) => setForm((p) => ({...p, note: e.target.value}))}
                                maxLength={255}
                                disabled={saving}
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button type="button" onClick={requestClose} className="btn btn-secondary" disabled={saving}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={saving}>
                                <Save className="w-4 h-4"/>
                                <span>{saving ? 'Salvando...' : 'Salvar'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
