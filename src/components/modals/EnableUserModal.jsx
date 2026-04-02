import Modal from '../ui/Modal';
import Button from '../ui/Button';
import AlertBox from '../ui/AlertBox';

export default function EnableUserModal({ show, user, onClose, onConfirm }) {
    if (!show || !user) return null;

    return (
        <Modal onClose={onClose} contentClassName="w-[450px] max-w-[90vw]">
            <div className="bg-white rounded-xl p-8 flex flex-col">
                <div className="flex flex-col gap-1">
                    <span className="text-brand-text text-2xl font-semibold">
                        Riabilita utente
                    </span>

                    <span className="text-lg font-semibold">
                        Utente:{' '}
                        <span className="text-brand-primary">
                            {user.name} {user.surname}
                        </span>
                    </span>
                </div>

                <div className="w-full flex justify-center mt-6">
                    <AlertBox variant="info" title="Conferma operazione">
                        L’utente tornerà nello stato <strong>Attivo</strong> e
                        potrà nuovamente accedere al gestionale.
                    </AlertBox>
                </div>

                <div className="flex mt-8 gap-6">
                    <Button
                        type="button"
                        size="md"
                        variant="primary"
                        className="rounded-lg"
                        onClick={() => onConfirm(user)}
                    >
                        Riabilita
                    </Button>

                    <Button
                        type="button"
                        size="md"
                        variant="secondary"
                        className="rounded-lg"
                        onClick={onClose}
                    >
                        Annulla
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
