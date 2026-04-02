// Modal used for macronutrients legend.
import Modal from '../ui/Modal';

const MACRONUTRIENT_ROWS = [
    {
        key: 'proteins',
        label: 'Proteine',
        iconSrc: '/icons/steak.png',
        description:
            'Indicano la quantità di proteine mostrata accanto all\'icona.',
    },
    {
        key: 'carbs',
        label: 'Carboidrati',
        iconSrc: '/icons/bread.png',
        description:
            'Indicano la quantità di carboidrati mostrata accanto all\'icona.',
    },
    {
        key: 'fats',
        label: 'Grassi',
        iconSrc: '/icons/butter.png',
        description:
            'Indicano la quantità di grassi mostrata accanto all\'icona.',
    },
];

export default function MacronutrientsInfoModal({ open, onClose }) {
    if (!open) return null;

    return (
        <Modal onClose={onClose}>
            <div className="bg-white rounded-xl p-8 w-[620px] max-w-[94vw]">
                <div className="flex items-center justify-between mb-4 gap-4">
                    <h2 className="text-brand-text text-xl font-bold">
                        Legenda icone macronutrienti
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

                <div className="mb-4 text-sm leading-6 text-brand-textSecondary">
                    Le tre icone servono a distinguere subito i valori dei
                    macronutrienti. In tutte le schermate del gestionale i valori
                    mostrati accanto a queste icone sono espressi in grammi.
                </div>

                <div className="rounded-lg border border-brand-divider overflow-hidden">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-brand-text text-white">
                            <tr>
                                <th className="px-4 py-2 text-left">Icona</th>
                                <th className="px-4 py-2 text-left">
                                    Nutriente
                                </th>
                                <th className="px-4 py-2 text-left">
                                    Significato
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {MACRONUTRIENT_ROWS.map((row) => (
                                <tr
                                    key={row.key}
                                    className="border-t border-brand-divider"
                                >
                                    <td className="px-4 py-3">
                                        <img
                                            src={row.iconSrc}
                                            alt={row.label}
                                            title={row.label}
                                            className="h-5 w-5 select-none"
                                            draggable={false}
                                        />
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-brand-text whitespace-nowrap">
                                        {row.label}
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
