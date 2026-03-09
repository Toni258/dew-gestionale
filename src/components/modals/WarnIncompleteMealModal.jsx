import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function WarnIncompleteMealModal({
    show,
    missingCourses = [],
    saving = false,
    onClose,
    onConfirm,
}) {
    if (!show) return null;

    return (
        <Modal onClose={onClose} contentClassName="w-[680px] max-w-[90vw]">
            <div className="bg-white rounded-xl p-8 min-w-[500px] flex flex-col">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <img
                            src="/warning giallo.png"
                            className="w-6 h-6"
                            alt="Avvertenza"
                        />
                        <span className="text-brand-text text-2xl font-semibold">
                            Attenzione
                        </span>
                    </div>

                    <span className="text-base text-brand-textSecondary">
                        Non hai inserito queste portate:{' '}
                        <span className="font-semibold text-brand-primary capitalize">
                            {missingCourses.join(', ')}.
                        </span>
                        <br />
                        Vuoi salvare comunque il pasto?
                    </span>
                </div>

                <div className="flex mt-8 gap-6">
                    <Button
                        type="button"
                        size="md"
                        variant="primary"
                        className="rounded-lg"
                        onClick={onConfirm}
                        disabled={saving}
                    >
                        {saving ? 'Salvataggio...' : 'Salva comunque'}
                    </Button>

                    <Button
                        type="button"
                        size="md"
                        variant="secondary"
                        className="rounded-lg"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Torna indietro
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
