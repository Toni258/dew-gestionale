import Modal from '../ui/Modal';

const ALLERGENS = [
    { label: 'Glutine', emoji: '🌾' },
    { label: 'Latte / Lattosio', emoji: '🥛' },
    { label: 'Uova', emoji: '🥚' },
    { label: 'Arachidi', emoji: '🥜' },
    { label: 'Frutta a guscio', emoji: '🌰' },
    { label: 'Pesce', emoji: '🐟' },
    { label: 'Crostacei', emoji: '🦐' },
    { label: 'Molluschi', emoji: '🦑' },
    { label: 'Soia', emoji: '🌱' },
    { label: 'Sedano', emoji: '🥬' },
    { label: 'Senape', emoji: '🌿' },
    { label: 'Semi di sesamo', emoji: '⚫' },
    { label: 'Anidride solforosa e solfiti', emoji: '🍷' },
    { label: 'Lupini', emoji: '🌻' },
];

export default function AllergensModal({ open, onClose }) {
    if (!open) return null;

    return (
        <Modal onClose={onClose}>
            <div className="bg-white rounded-xl p-8 w-[420px]">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-brand-text text-xl font-bold">
                        Legenda allergeni
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 hover:opacity-70 transition"
                        aria-label="Chiudi"
                    >
                        <img
                            src="/cancel.png"
                            alt="Chiudi"
                            className="w-5 h-5"
                            draggable="false"
                        />
                    </button>
                </div>

                {/* Tabella */}
                <div className="rounded-lg border border-brand-divider overflow-hidden">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-brand-text text-white">
                            <tr>
                                <th className="px-4 py-2 text-left">
                                    Allergene
                                </th>
                                <th className="px-4 py-2 text-left">Emoji</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ALLERGENS.map((a) => (
                                <tr
                                    key={a.label}
                                    className="border-t border-brand-divider"
                                >
                                    <td className="px-4 py-2">{a.label}</td>
                                    <td className="px-4 py-2 text-lg">
                                        {a.emoji}
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
