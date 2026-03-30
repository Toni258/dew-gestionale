import { memo } from 'react';

import { NavLink } from 'react-router-dom';
import { extractAllergenEmojis } from '../../utils/extractAllergens';
import { formatNumber } from '../../utils/format';
import { capitalize } from '../../utils/capitalize';
import StatusDot from './StatusDot';
import Pagination from '../ui/Pagination';

// Table used to show dishes with their main data and available actions.
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
    onShowStatusInfo,
    onShowAllergensInfo,
}) {
    return (
        <div className="bg-white border border-brand-divider rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full table-auto text-sm">
                    {/* Table header */}
                    <thead className="bg-brand-primary text-white">
                        <tr>
                            <th className="px-3 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <span>STATO</span>
                                    <button
                                        type="button"
                                        onClick={onShowStatusInfo}
                                        aria-label="Legenda stato piatto"
                                    >
                                        <img
                                            src="/icons/information bianco.png"
                                            className="w-4 h-4"
                                            alt="Legenda stato piatto"
                                        />
                                    </button>
                                </div>
                            </th>
                            <th className="px-3 py-3 text-left">NOME</th>
                            <th className="px-3 py-3 text-left">TIPO</th>
                            <th className="px-3 py-3 text-left">PESO (G)</th>
                            <th className="px-3 py-3 text-left">KCAL</th>
                            <th className="px-3 py-3 text-left">MACRO (G)</th>
                            <th className="px-3 py-3 text-left">
                                <div className="flex items-center gap-2">
                                    <span>ALLERGENI</span>
                                    {/* Opens the allergens legend modal */}
                                    <button
                                        type="button"
                                        onClick={onShowAllergensInfo}
                                        aria-label="Legenda allergeni"
                                    >
                                        <img
                                            src="/icons/information bianco.png"
                                            className="w-4 h-4"
                                            alt="Legenda allergeni"
                                        />
                                    </button>
                                </div>
                            </th>
                            <th className="px-3 py-3 text-left">AZIONI</th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* Empty state shown when there are no results */}
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

                        {/* Table rows */}
                        {rows.map((r) => (
                            <tr
                                key={r.id_food}
                                className="border-t border-brand-divider"
                            >
                                {/* Dish status */}
                                <td className="px-3 py-2.5 text-center">
                                    <StatusDot status={r.status} />
                                </td>

                                {/* Dish name */}
                                <td className="px-3 py-2.5">{r.name}</td>

                                {/* Dish type badge */}
                                <td className="px-3 py-2.5">
                                    <span className="inline-flex rounded-md bg-[rgba(57,142,59,0.10)] px-2.5 py-1 text-xs font-semibold tabular-nums text-brand-primary capitalize">
                                        {capitalize(r.type)}
                                    </span>
                                </td>

                                {/* Total grammage */}
                                <td className="px-3 py-2.5">
                                    {formatNumber(r.grammage_tot)}
                                </td>

                                {/* Total calories */}
                                <td className="px-3 py-2.5">
                                    {formatNumber(r.kcal_tot)}
                                </td>

                                {/* Main macronutrients */}
                                <td className="px-3 py-2.5 flex w-full align-left">
                                    <span className="flex-[1]">
                                        🥩 {formatNumber(r.proteins)}
                                    </span>
                                    <span className="flex-[1]">
                                        🍞 {formatNumber(r.carbs)}
                                    </span>
                                    <span className="flex-[1]">
                                        🧈 {formatNumber(r.fats)}
                                    </span>
                                </td>

                                {/* Allergens shown as emojis */}
                                <td className="px-3 py-2.5">
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

                                {/* Row actions */}
                                <td className="px-3 py-2.5">
                                    <NavLink
                                        to={`/dishes/edit/${r.id_food}`}
                                        className="text-brand-primary font-semibold"
                                    >
                                        ✏
                                    </NavLink>

                                    {/* Delete is available only for inactive dishes */}
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

            {/* Pagination controls */}
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
