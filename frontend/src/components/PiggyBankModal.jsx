import {useEffect, useState} from 'react';
import {X, Save} from 'lucide-react';
import {piggyBanksAPI} from '../api/api';
import {format} from 'date-fns';

export default function PiggyBankModal({piggyBank, onClose, onSaved}) {
    const [closing, setClosing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        name: '',
        description: '',
        rate_type: 'YEARLY',
        rate_value: '0.00',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        is_active: true,
    });

    useEffect(() => {
        if (!piggyBank) return;
        setForm({
            name: piggyBank.name || '',
            description: piggyBank.description || '',
            rate_type: piggyBank.rate_type || 'YEARLY',
            rate_value: String(piggyBank.rate_value ?? '0.00'),
            start_date: piggyBank.start_date || format(new Date(), 'yyyy-MM-dd'),
            is_active: piggyBank.is_active !== false,
        });
    }, [piggyBank]);

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
            const payload = {
                name: form.name.trim(),
                description: form.description.trim(),
                rate_type: form.rate_type,
                rate_value: parseFloat(form.rate_value),
                start_date: form.start_date,
                is_active: !!form.is_active,
            };

            if (piggyBank?.id) {
                await piggyBanksAPI.update(piggyBank.id, payload);
            } else {
                await piggyBanksAPI.create(payload);
            }

            onSaved?.();
        } catch (e2) {
            const data = e2?.response?.data;
            if (data && typeof data === 'object') {
                const k = Object.keys(data)[0];
                const msg = Array.isArray(data[k]) ? data[k][0] : data[k];
                setError(String(msg || 'Erro ao salvar cofrinho.'));
            } else {
                setError('Erro ao salvar cofrinho.');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-50 ${closing ? 'modal-out' : ''}`}>
            <div className="absolute inset-0 bg-black/50 modal-overlay" onClick={requestClose}/>
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl modal-panel max-h-[90vh] overflow-y-auto hide-scrollbar">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {piggyBank ? 'Editar Cofrinho' : 'Novo Cofrinho'}
                        </h3>
                        <button
                            type="button"
                            onClick={requestClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            disabled={saving}
                        >
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
                            <label className="label">Nome</label>
                            <input
                                className="input"
                                value={form.name}
                                onChange={(e) => setForm((p) => ({...p, name: e.target.value}))}
                                maxLength={120}
                                required
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label className="label">Descrição</label>
                            <input
                                className="input"
                                value={form.description}
                                onChange={(e) => setForm((p) => ({...p, description: e.target.value}))}
                                maxLength={255}
                                disabled={saving}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Tipo de taxa</label>
                                <select
                                    className="input"
                                    value={form.rate_type}
                                    onChange={(e) => setForm((p) => ({...p, rate_type: e.target.value}))}
                                    disabled={saving}
                                >
                                    <option value="MONTHLY">Mensal</option>
                                    <option value="YEARLY">Anual</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Taxa (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="input"
                                    value={form.rate_value}
                                    onChange={(e) => setForm((p) => ({...p, rate_value: e.target.value}))}
                                    required
                                    disabled={saving}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Início</label>
                            <input
                                type="date"
                                className="input"
                                value={form.start_date}
                                onChange={(e) => setForm((p) => ({...p, start_date: e.target.value}))}
                                required
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
