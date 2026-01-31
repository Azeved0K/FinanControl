import {X} from 'lucide-react';

export default function RequireCategoryModal({onClose, onConfirm, type}) {
    const label = type === 'IN' ? 'receita' : 'despesa';

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50 modal-overlay" onClick={onClose}/>
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl modal-panel">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Crie uma categoria primeiro</h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                        </button>
                    </div>

                    <div className="px-6 py-5">
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                            Antes de criar uma transação de {label}, você precisa cadastrar pelo menos uma categoria de {label}.
                        </p>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                        <button type="button" onClick={onConfirm} className="btn btn-primary">Criar categoria</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
