import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

export default function DeleteUserModal({ user, onClose, onConfirm }) {
    const [confirmText, setConfirmText] = useState('');

    useEffect(() => {
        if (!user) setConfirmText('');
    }, [user]);

    if (!user) return null;

    const isValid = confirmText === 'ELIMINA';

    return (
        <Modal onClose={onClose}>
            <div className="bg-white rounded-xl p-8 w-[500px] flex flex-col items-center text-center">
                <h2 className="text-brand-text text-xl font-semibold mb-2">
                    Conferma eliminazione dell'utente:
                </h2>

                <p className="text-brand-primary text-lg font-bold mb-4">
                    <span>
                        {user.name} {user.surname}
                    </span>
                </p>

                <p className="text-brand-textSecondary text-sm mb-4">
                    Questa operazione è <strong>irreversibile</strong>.
                </p>

                <p className="text-sm mb-2">
                    Per confermare, scrivi <strong>ELIMINA</strong>
                </p>

                <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="
                        border border-brand-divider rounded-md
                        px-3 py-2 text-center mb-6
                        focus:outline-none focus:ring-2 focus:ring-red-500
                    "
                    placeholder="ELIMINA"
                />

                <div className="flex justify-center gap-8">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-brand-sidebar text-black px-6 py-2 rounded-xl font-semibold"
                    >
                        Annulla
                    </button>

                    <button
                        type="button"
                        disabled={!isValid}
                        onClick={() => onConfirm(user)}
                        className={`
                            px-6 py-2 rounded-xl font-semibold text-white
                            transition
                            ${
                                isValid
                                    ? 'bg-red-600 hover:opacity-80'
                                    : 'bg-red-300 cursor-not-allowed'
                            }
                        `}
                    >
                        Elimina
                    </button>
                </div>
            </div>
        </Modal>
    );
}
