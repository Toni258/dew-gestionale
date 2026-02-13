import { memo } from 'react';

import { NavLink } from 'react-router-dom';
import { extractAllergenEmojis } from '../../utils/extractAllergens';
import { formatNumber } from '../../utils/format';
import { capitalize } from '../../utils/capitalize';
import StatusDot from './StatusDot';
import PageButton from '../ui/PageButton';
import Pagination from '../ui/Pagination';

export default memo(function DishesTable({
    rows,
    loading,
    total,
    page,
    totalPages,
    pageSize,
    onPageChange,
    onPageSizeChange,
    onDelete,
    onShowAllergensInfo,
}) {
    return (
        <div className="bg-white border border-brand-divider rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm table-auto">
                    <thead className="bg-brand-primary text-white">
                        <tr>
                            <th className="px-4 py-3 text-center">STATO</th>
                            <th className="px-4 py-3 text-left">NOME</th>
                            <th className="px-4 py-3 text-left">TIPO</th>
                            <th className="px-4 py-3 text-left">PESO (G)</th>
                            <th className="px-4 py-3 text-left">KCAL</th>
                            <th className="px-4 py-3 text-left">MACRO (G)</th>
                            <th className="px-4 py-3 text-left">
                                <div className="flex items-center gap-2">
                                    <span>ALLERGENI</span>
                                    <button
                                        type="button"
                                        onClick={onShowAllergensInfo}
                                    >
                                        <img
                                            src="/information bianco.png"
                                            className="w-4 h-4"
                                            alt="Legenda allergeni"
                                        />
                                    </button>
                                </div>
                            </th>
                            <th className="px-4 py-3 text-left">AZIONI</th>
                        </tr>
                    </thead>

                    <tbody>
                        {!loading && rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-4 py-4 text-brand-textSecondary"
                                >
                                    Nessun piatto trovato.
                                </td>
                            </tr>
                        )}

                        {rows.map((r) => (
                            <tr
                                key={r.id_food}
                                className="border-t border-brand-divider"
                            >
                                <td className="px-4 py-3 text-center">
                                    <StatusDot status={r.status} />
                                </td>

                                <td className="px-4 py-3">{r.name}</td>

                                <td className="px-4 py-3">
                                    <span className="bg-brand-primary/50 px-3 py-1 rounded-full">
                                        {capitalize(r.type)}
                                    </span>
                                </td>

                                <td className="px-4 py-3">
                                    {formatNumber(r.grammage_tot)}
                                </td>

                                <td className="px-4 py-3">
                                    {formatNumber(r.kcal_tot)}
                                </td>

                                <td className="px-4 py-3 whitespace-nowrap">
                                    🥩 {formatNumber(r.proteins)} | 🍞{' '}
                                    {formatNumber(r.carbs)} | 🧈{' '}
                                    {formatNumber(r.fats)}
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex gap-2 flex-wrap">
                                        {extractAllergenEmojis(
                                            r.allergy_notes,
                                        ).map((a) => (
                                            <span
                                                key={a.key}
                                                title={a.label}
                                                className="cursor-help select-none"
                                            >
                                                {a.emoji}
                                            </span>
                                        ))}
                                    </div>
                                </td>

                                <td className="px-4 py-3">
                                    <NavLink
                                        to={`/dishes/edit/${r.id_food}`}
                                        className="text-brand-primary font-semibold"
                                    >
                                        ✏
                                    </NavLink>

                                    {r.status === 'non_attivo' && (
                                        <button
                                            className="ml-3 text-red-500"
                                            onClick={() => onDelete(r)}
                                        >
                                            🗑
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* PAGINAZIONE */}
            <Pagination
                total={total}
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                loading={loading}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        </div>
    );
});
