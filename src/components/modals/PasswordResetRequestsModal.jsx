// Modal used for password reset requests.
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function PasswordResetRequestsModal({
    show,
    requests = [],
    onClose,
    onOpenUsers,
}) {
    if (!show || requests.length === 0) return null;

    return (
        <Modal onClose={onClose} contentClassName="w-[640px] max-w-[94vw]">
            <Card className="p-0 overflow-hidden">
                <div className="px-6 py-5 border-b border-brand-divider/60 bg-brand-error/5">
                    <div className="flex items-start gap-3">
                        <img
                            src="/warning rosso.png"
                            alt="Avviso urgente"
                            className="w-7 h-7 mt-1"
                            draggable={false}
                        />

                        <div>
                            <h2 className="text-2xl font-bold text-brand-error">
                                Richieste reset password
                            </h2>
                            <p className="text-sm text-brand-textSecondary mt-1">
                                Ci sono utenti che hanno richiesto il ripristino
                                della password.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-5">
                    <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-1">
                        {requests.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-xl border border-brand-divider/70 bg-white px-4 py-3"
                            >
                                <div className="font-semibold text-brand-text">
                                    {item.name} {item.surname}
                                </div>
                                <div className="text-sm text-brand-textSecondary">
                                    {item.email}
                                </div>
                                <div className="text-xs text-brand-textSecondary mt-1">
                                    Richiesta del: {item.requested_at_label}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="underline"
                            onClick={onClose}
                        >
                            Più tardi
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            size="md"
                            className="rounded-lg"
                            onClick={onOpenUsers}
                        >
                            Apri gestione utenti
                        </Button>
                    </div>
                </div>
            </Card>
        </Modal>
    );
}