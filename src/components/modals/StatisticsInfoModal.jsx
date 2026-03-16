// Modal used for report legends and information points.
import Modal from '../ui/Modal';

export default function StatisticsInfoModal({
    open,
    onClose,
    title,
    description = '',
    rows = [],
    note = '',
    valueHeader = 'Voce',
    descriptionHeader = 'Significato',
}) {
    if (!open) return null;

    return (
        <Modal onClose={onClose}>
            <div className="bg-white rounded-xl p-8 w-[640px] max-w-[94vw]">
                <div className="flex items-center justify-between mb-4 gap-4">
                    <h2 className="text-brand-text text-xl font-bold">
                        {title}
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

                {description && (
                    <div className="mb-4 text-sm leading-6 text-brand-textSecondary">
                        {description}
                    </div>
                )}

                {rows.length > 0 && (
                    <div className="rounded-lg border border-brand-divider overflow-hidden">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-brand-text text-white">
                                <tr>
                                    <th className="px-4 py-2 text-left">
                                        {valueHeader}
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        {descriptionHeader}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr
                                        key={row.label}
                                        className="border-t border-brand-divider"
                                    >
                                        <td className="px-4 py-3 font-semibold text-brand-text whitespace-nowrap align-top">
                                            {row.label}
                                        </td>
                                        <td className="px-4 py-3 text-brand-textSecondary align-top">
                                            {row.description}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {note && (
                    <div className="mt-4 text-sm text-brand-textSecondary">
                        {note}
                    </div>
                )}
            </div>
        </Modal>
    );
}
