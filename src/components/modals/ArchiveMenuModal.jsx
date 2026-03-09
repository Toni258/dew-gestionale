import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function ArchiveMenuModal({
    show,
    menu,
    onClose,
    onConfirm,
    loading = false,
}) {
    const [confirmText, setConfirmText] = useState('');

    useEffect(() => {
        if (!show) setConfirmText('');
    }, [show]);

    if (!show || !menu) return null;

    const isValid = confirmText === 'ARCHIVIA';

    return (
        <Modal onClose={onClose} contentClassName="w-[480px] max-w-[90vw]">
            <div className="bg-white rounded-xl p-8 min-w-[500px] flex flex-col">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <img
                            src="/warning rosso.png"
                            className="w-6 h-6"
                            alt="Avvertenza"
                        />
                        <span className="text-brand-text text-2xl font-semibold">
                            Conferma archiviazione
                        </span>
                    </div>

                    <span className="text-base text-brand-textSecondary">
                        Stai per archiviare il menù{' '}
                        <span className="font-semibold text-brand-primary capitalize">
                            {menu.season_type}
                        </span>
                        .
                        <br />
                        Questa operazione sposterà il menù concluso nello
                        storico.
                    </span>

                    <span className="text-base text-brand-textSecondary">
                        Per confermare, scrivi{' '}
                        <span className="font-semibold text-brand-primary">
                            ARCHIVIA
                        </span>
                        .
                    </span>
                </div>

                <div className="mt-6">
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="
                            input-default
                            w-[240px]
                            rounded-lg
                            text-center
                        "
                        placeholder="ARCHIVIA"
                        disabled={loading}
                    />
                </div>

                <div className="flex mt-8 gap-6">
                    <Button
                        type="button"
                        size="md"
                        variant="primary"
                        className="rounded-lg px-10"
                        disabled={!isValid || loading}
                        onClick={() => onConfirm(menu)}
                    >
                        {loading ? 'Archiviazione...' : 'Archivia'}
                    </Button>

                    <Button
                        type="button"
                        size="md"
                        variant="secondary"
                        className="rounded-lg"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Torna indietro
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
