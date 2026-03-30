import Modal from '../ui/Modal';
import StatusDot from '../dishes/StatusDot';

const STATUS_INFO_ROWS = [
    {
        key: 'non_attivo',
        label: 'Rosso',
        status: 'non_attivo',
        description:
            'Il piatto, ad oggi, non è usato nel menù corrente.',
    },
    {
        key: 'sospeso',
        label: 'Giallo',
        status: 'sospeso',
        description:
            'Il piatto è sospeso temporaneamente. Lo stato diventa giallo solo se la sospensione è attiva oggi, cioè se la data odierna è compresa tra inizio e fine sospensione. Il piatto può risultare sospeso anche se non è usato da nessun menù.',
    },
    {
        key: 'attivo',
        label: 'Verde',
        status: 'attivo',
        description:
            'Il piatto è presente nel menù corrente, quindi è in uso.',
    },
];

export default function DishStatusInfoModal({ open, onClose }) {
    if (!open) return null;

    return (
        <Modal onClose={onClose} contentClassName="w-[560px] max-w-[90vw]">
            <div className="bg-white rounded-xl p-6 sm:p-8">
                <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 className="text-brand-text text-xl font-bold">
                        Legenda stato piatto
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 transition hover:opacity-70"
                        aria-label="Chiudi"
                    >
                        <img
                            src="/icons/cancel.png"
                            alt="Chiudi"
                            className="w-5 h-5"
                            draggable="false"
                        />
                    </button>
                </div>

                <div className="rounded-lg border border-brand-divider overflow-hidden">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-brand-text text-white">
                            <tr>
                                <th className="px-4 py-2 text-left">Stato</th>
                                <th className="px-4 py-2 text-left">
                                    Significato
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {STATUS_INFO_ROWS.map((row) => (
                                <tr
                                    key={row.key}
                                    className="border-t border-brand-divider align-top"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3 whitespace-nowrap">
                                            <StatusDot status={row.status} />
                                            <span className="font-semibold text-brand-text">
                                                {row.label}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-brand-textSecondary">
                                        {row.description}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Modal>
    );
}
