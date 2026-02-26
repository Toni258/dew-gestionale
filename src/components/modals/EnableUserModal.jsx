import Modal from '../ui/Modal';

export default function EnableUserModal({ show, user, onClose, onConfirm }) {
    if (!show || !user) return null;

    return (
        <Modal onClose={onClose}>
            <div className="bg-white rounded-xl p-8 w-[520px] flex flex-col items-center text-center">
                <h2 className="text-brand-text text-xl font-semibold mb-2">
                    Riabilitare questo utente?
                </h2>

                <p className="text-brand-primary text-lg font-bold mb-3">
                    {user.name} {user.surname}
                </p>

                <p className="text-sm text-brand-textSecondary mb-6">
                    L’utente tornerà nello stato <strong>Attivo</strong> e potrà
                    nuovamente accedere al gestionale.
                </p>

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
                        onClick={() => onConfirm(user)}
                        className="bg-brand-primary text-white px-6 py-2 rounded-xl font-semibold hover:opacity-80 transition"
                    >
                        Riabilita
                    </button>
                </div>
            </div>
        </Modal>
    );
}
