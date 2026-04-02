import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import AlertBox from '../ui/AlertBox';

export default function SuspendUserModal({ show, user, onClose, onConfirm }) {
    const [confirmText, setConfirmText] = useState('');

    useEffect(() => {
        if (!show || !user) setConfirmText('');
    }, [show, user]);

    if (!show || !user) return null;

    const isValid = confirmText === 'SOSPENDI';

    return (
        <Modal onClose={onClose} contentClassName="w-[450px] max-w-[90vw]">
            <div className="bg-white rounded-xl p-8 flex flex-col">
                <div className="flex flex-col gap-1">
                    <span className="text-brand-text text-2xl font-semibold">
                        Sospendi utente
                    </span>

                    <span className="text-lg font-semibold">
                        Utente:{' '}
                        <span className="text-brand-primary">
                            {user.name} {user.surname}
                        </span>
                    </span>
                </div>

                <div className="w-full flex justify-center mt-6">
                    <AlertBox variant="warning" title="Attenzione">
                        L’utente verrà sospeso e non potrà più accedere al
                        gestionale fino a una successiva riabilitazione.
                    </AlertBox>
                </div>

                <div className="mt-6 w-full">
                    <label className="mb-2 block text-sm font-medium text-brand-text">
                        Per confermare, scrivi <strong>SOSPENDI</strong>
                    </label>

                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="SOSPENDI"
                        className="h-[45px] w-full rounded-lg border border-brand-divider px-3 outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>

                <div className="flex mt-8 gap-6">
                    <Button
                        type="button"
                        size="md"
                        variant="danger"
                        className="rounded-lg"
                        onClick={() => onConfirm(user)}
                        disabled={!isValid}
                    >
                        Sospendi
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
