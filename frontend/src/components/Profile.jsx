import {useEffect, useMemo, useState} from 'react';
import {Pencil, X, Save, Mail, Image as ImageIcon} from 'lucide-react';
import {authAPI, insightsAPI} from '../api/api';

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [closing, setClosing] = useState(false);

    const [profile, setProfile] = useState({
        id: null,
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        avatar_url: null,
    });

    const [form, setForm] = useState({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        avatar: null,
    });

    const [avatarPreview, setAvatarPreview] = useState(null);

    const [insights, setInsights] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const displayName = useMemo(() => {
        const full = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        return full || profile.username || 'Usuário';
    }, [profile.first_name, profile.last_name, profile.username]);

    const initials = useMemo(() => {
        const base = (displayName || profile.username || 'U').trim();
        return base[0]?.toUpperCase() || 'U';
    }, [displayName, profile.username]);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            setLoading(true);
            setError('');

            const [meRes, insightsRes] = await Promise.all([
                authAPI.me(),
                insightsAPI.get(),
            ]);

            setProfile(meRes.data);

            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({
                ...currentUser,
                id: meRes.data.id,
                username: meRes.data.username,
                email: meRes.data.email,
                avatar_url: meRes.data.avatar_url || null,
            }));
            window.dispatchEvent(new StorageEvent('storage', {key: 'user'}));

            setForm({
                username: meRes.data.username || '',
                first_name: meRes.data.first_name || '',
                last_name: meRes.data.last_name || '',
                email: meRes.data.email || '',
                avatar: null,
            });
            setAvatarPreview(null);

            setInsights(insightsRes.data.insights || []);
        } catch (e) {
            console.error(e);
            setError('Não foi possível carregar seu perfil.');
        } finally {
            setLoading(false);
        }
    };

    const openEdit = () => {
        setSuccess('');
        setError('');
        setClosing(false);
        setForm({
            username: profile.username || '',
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            email: profile.email || '',
            avatar: null,
        });
        setAvatarPreview(null);
        setIsEditOpen(true);
    };

    const requestCloseEdit = () => {
        if (saving || closing) return;
        setClosing(true);
        window.setTimeout(() => {
            setIsEditOpen(false);
            setAvatarPreview(null);
            setClosing(false);
        }, 170);
    };

    const validateImage = (file) => {
        if (!file) return null;
        const maxBytes = 25 * 1024 * 1024;
        if (file.size > maxBytes) {
            setError('A imagem deve ter no máximo 25MB.');
            return null;
        }
        return file;
    };

    const handleAvatarChange = (file) => {
        if (!file) {
            setForm((p) => ({...p, avatar: null}));
            setAvatarPreview(null);
            return;
        }
        const f = validateImage(file);
        if (!f) return;
        setError('');
        setForm((p) => ({...p, avatar: f}));
        setAvatarPreview(URL.createObjectURL(f));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setSuccess('');
            setError('');

            const res = await authAPI.updateMe({
                username: form.username,
                first_name: form.first_name,
                last_name: form.last_name,
                email: form.email,
                avatar: form.avatar || undefined,
            });

            setProfile(res.data);
            setIsEditOpen(false);
            setSuccess('Perfil atualizado com sucesso.');

            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({
                ...currentUser,
                username: res.data.username,
                email: res.data.email,
                avatar_url: res.data.avatar_url || null,
            }));
            window.dispatchEvent(new StorageEvent('storage', {key: 'user'}));

            setAvatarPreview(null);

        } catch (e) {
            const data = e?.response?.data;
            if (data && typeof data === 'object') {
                const firstField = Object.keys(data)[0];
                const msg = Array.isArray(data[firstField]) ? data[firstField][0] : data[firstField];
                setError(String(msg || 'Erro ao salvar alterações.'));
            } else {
                setError('Erro ao salvar alterações.');
            }
        } finally {
            setSaving(false);
        }
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
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{profile.username}</h1>
            </div>

            {error && (
                <div className="p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-900/40 rounded-lg text-danger-700 dark:text-danger-300 text-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-900/40 rounded-lg text-primary-700 dark:text-primary-300 text-sm">
                    {success}
                </div>
            )}

            <div className="card p-0 overflow-hidden">
                <div className="px-6 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div className="flex items-end gap-4">
                            <div className="w-20 h-20 rounded-full bg-white dark:bg-gray-800 p-1 shadow-soft">
                                <div className="w-full h-full rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover"/>
                                    ) : (
                                        <span className="text-primary-700 dark:text-primary-300 font-bold text-2xl">{initials}</span>
                                    )}
                                </div>
                            </div>

                            <div className="pb-1">
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{displayName}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                    <Mail className="w-4 h-4"/>
                                    <span>{profile.email}</span>
                                </p>
                            </div>
                        </div>

                        <div className="sm:self-end mt-2 sm:mt-0">
                            <button
                                type="button"
                                onClick={openEdit}
                                className="btn btn-secondary flex items-center gap-2"
                            >
                                <Pencil className="w-4 h-4"/>
                                <span>Editar perfil</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Receitas (período)</p>
                            <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">Veja no Dashboard</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Despesas (período)</p>
                            <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">Veja no Dashboard</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Saldo (período)</p>
                            <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">Veja no Dashboard</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Insights</h2>
                <div className="space-y-3">
                    {insights.length > 0 ? (
                        insights.map((insight, idx) => (
                            <div
                                key={idx}
                                className="p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg"
                            >
                                <p className="text-sm text-gray-700 dark:text-gray-300">{insight}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Continue registrando suas transações para receber insights personalizados.
                        </p>
                    )}
                </div>
            </div>

            {isEditOpen && (
                <div className={`fixed inset-0 z-50 ${closing ? 'modal-out' : ''}`}>
                    <div className="absolute inset-0 bg-black/50 modal-overlay" onClick={requestCloseEdit}/>
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="w-full max-w-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl modal-panel max-h-[90vh] overflow-y-auto hide-scrollbar">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Editar perfil</h3>
                                <button
                                    type="button"
                                    onClick={requestCloseEdit}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    disabled={saving}
                                >
                                    <X className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                                </button>
                            </div>

                            <div className="px-6 py-5 space-y-4">
                                <div>
                                    <label className="label">Foto de perfil</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                                            {avatarPreview ? (
                                                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover"/>
                                            ) : profile.avatar_url ? (
                                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover"/>
                                            ) : (
                                                <ImageIcon className="w-6 h-6 text-gray-500"/>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleAvatarChange(e.target.files?.[0])}
                                                className="block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-200 file:text-gray-800 dark:file:bg-gray-700 dark:file:text-gray-100 hover:file:bg-gray-300 dark:hover:file:bg-gray-600 transition-colors"
                                                disabled={saving}
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Máximo 25MB</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="label">Username</label>
                                    <input
                                        className="input"
                                        value={form.username}
                                        onChange={(e) => setForm((p) => ({...p, username: e.target.value}))}
                                        disabled={saving}
                                    />
                                </div>

                                <div>
                                    <label className="label">Nome</label>
                                    <input
                                        className="input"
                                        value={form.first_name}
                                        onChange={(e) => setForm((p) => ({...p, first_name: e.target.value}))}
                                        disabled={saving}
                                    />
                                </div>

                                <div>
                                    <label className="label">Sobrenome</label>
                                    <input
                                        className="input"
                                        value={form.last_name}
                                        onChange={(e) => setForm((p) => ({...p, last_name: e.target.value}))}
                                        disabled={saving}
                                    />
                                </div>

                                <div>
                                    <label className="label">Email</label>
                                    <input
                                        type="email"
                                        className="input"
                                        value={form.email}
                                        onChange={(e) => setForm((p) => ({...p, email: e.target.value}))}
                                        disabled={saving}
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2 sticky bottom-0 bg-white dark:bg-gray-800">
                                <button
                                    type="button"
                                    onClick={requestCloseEdit}
                                    className="btn btn-secondary"
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="btn btn-primary flex items-center gap-2"
                                    disabled={saving}
                                >
                                    <Save className="w-4 h-4"/>
                                    <span>{saving ? 'Salvando...' : 'Salvar'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
