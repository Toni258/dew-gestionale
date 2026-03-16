// Modal used for portion legend.
import Modal from '../ui/Modal';

const PORTION_ROWS = [
    {
        value: '0',
        description: 'Piatto non consumato, quindi completamente sprecato.',
    },
    {
        value: '0.5',
        description: 'È stata consumata circa metà porzione.',
    },
    {
        value: '1',
        description: 'Piatto consumato completamente.',
    },
    {
        value: '2',
        description:
            'Piatto consumato completamente e si suggerisce una porzione maggiore per la prossima volta.',
    },
];

export default function PortionLegendModal({ open, onClose }) {
    if (!open) return null;

    return (
        <Modal onClose={onClose}>
            <div className="bg-white rounded-xl p-8 w-[560px] max-w-[94vw]">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-brand-text text-xl font-bold">
                        Legenda porzione consumata
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 hover:opacity-70 transition"
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
                                <th className="px-4 py-2 text-left">Valore</th>
                                <th className="px-4 py-2 text-left">
                                    Significato
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {PORTION_ROWS.map((row) => (
                                <tr
                                    key={row.value}
                                    className="border-t border-brand-divider"
                                >
                                    <td className="px-4 py-3 font-semibold text-brand-primary whitespace-nowrap">
                                        {row.value}
                                    </td>
                                    <td className="px-4 py-3 text-brand-textSecondary">
                                        {row.description}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 text-sm text-brand-textSecondary">
                    Nota: nei calcoli dello spreco, i valori maggiori o uguali a
                    1 indicano assenza di spreco per quella portata.
                </div>
            </div>
        </Modal>
    );
}
