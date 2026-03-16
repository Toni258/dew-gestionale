// Modal used for idle logout.
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function IdleLogoutModal({
    open,
    secondsLeft = 60,
    onStayLoggedIn,
}) {
    if (!open) return null;

    const progress = Math.max(0, Math.min(100, (secondsLeft / 60) * 100));

    return (
        <Modal
            onClose={onStayLoggedIn}
            closeOnBackdrop={false}
            contentClassName="w-[560px] max-w-[92vw]"
        >
            <div className="bg-white rounded-2xl p-8">
                <div className="flex items-start gap-3">
                    <img
                        src="/warning giallo.png"
                        alt="Avviso inattività"
                        className="w-6 h-6 mt-1"
                        draggable={false}
                    />

                    <div className="flex-1">
                        <h2 className="text-2xl font-semibold text-brand-text">
                            Sessione in scadenza
                        </h2>

                        <p className="mt-3 text-brand-textSecondary leading-relaxed">
                            Non è stata rilevata alcuna attività.
                            <br />
                            Se non esegui un’azione entro il prossimo minuto
                            verrai disconnesso automaticamente.
                        </p>

                        <div className="mt-6 rounded-2xl border border-brand-divider/60 bg-gradient-to-br from-white to-brand-secondary/5 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm font-semibold tracking-wide text-brand-textSecondary">
                                    Disconnessione automatica
                                </span>

                                <span className="text-xl font-bold text-brand-primary tabular-nums">
                                    {secondsLeft}s
                                </span>
                            </div>

                            <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-brand-divider/50 shadow-inner">
                                <div
                                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-warning via-amber-400 to-orange-500 transition-[width] duration-300 ease-linear"
                                    style={{ width: `${progress}%` }}
                                />
                                <div className="absolute inset-0 bg-white/20 pointer-events-none" />
                            </div>

                            <div className="mt-2 flex justify-between text-xs text-brand-textSecondary">
                                <span>1 min</span>
                                <span>0s</span>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <Button
                                type="button"
                                variant="primary"
                                size="md"
                                className="rounded-lg min-w-[180px]"
                                onClick={onStayLoggedIn}
                            >
                                Rimani connesso
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}