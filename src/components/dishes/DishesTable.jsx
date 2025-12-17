import { memo } from 'react';

import { NavLink } from 'react-router-dom';
import PageButton from '../ui/PageButton';
import { extractAllergenEmojis } from '../../utils/extractAllergens';
import { formatNumber } from '../../utils/format';
import StatusDot from './StatusDot';

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
                                        {r.type}
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
                                            r.allergy_notes
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
            <div className="px-4 py-3 border-t border-brand-divider grid grid-cols-3 items-center">
                {/* RISULTATI */}
                <div className="text-sm text-brand-textSecondary">
                    Risultati:{' '}
                    <span className="font-semibold text-brand-text">
                        {total}
                    </span>
                </div>

                {/* CAROSELLO PAGINE */}
                <div className="flex justify-center items-center gap-2">
                    {/* PREV */}
                    <button
                        type="button"
                        disabled={page === 1 || loading}
                        onClick={() => onPageChange(page - 1)}
                        className="
                            p-2 rounded-full border border-brand-divider
                            disabled:opacity-40 disabled:cursor-not-allowed
                            hover:bg-black/5 transition
                        "
                        aria-label="Pagina precedente"
                    >
                        <img
                            src="/Chevron sinistra nero.png"
                            draggable="false"
                            alt="Precedente"
                            className="w-5 h-5 select-none"
                        />
                    </button>

                    {/* PAGINA 1 */}
                    <PageButton
                        pageNum={1}
                        current={page}
                        onClick={onPageChange}
                    />

                    {/* ... prima */}
                    {page > 3 && (
                        <span className="px-2 text-brand-textSecondary select-none">
                            …
                        </span>
                    )}

                    {/* PAGINE CENTRALI */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                            (p) =>
                                p !== 1 &&
                                p !== totalPages &&
                                Math.abs(p - page) <= 1
                        )
                        .map((p) => (
                            <PageButton
                                key={p}
                                pageNum={p}
                                current={page}
                                onClick={onPageChange}
                            />
                        ))}

                    {/* ... dopo */}
                    {page < totalPages - 2 && (
                        <span className="px-2 text-brand-textSecondary select-none">
                            …
                        </span>
                    )}

                    {/* ULTIMA PAGINA */}
                    {totalPages > 1 && (
                        <PageButton
                            pageNum={totalPages}
                            current={page}
                            onClick={onPageChange}
                        />
                    )}

                    {/* NEXT */}
                    <button
                        type="button"
                        disabled={page === totalPages || loading}
                        onClick={() => onPageChange(page + 1)}
                        className="
                                p-2 rounded-full border border-brand-divider
                                disabled:opacity-40 disabled:cursor-not-allowed
                                hover:bg-black/5 transition
                            "
                        aria-label="Pagina successiva"
                    >
                        <img
                            src="/Chevron destra nero.png"
                            draggable="false"
                            alt="Successiva"
                            className="w-5 h-5 select-none"
                        />
                    </button>
                </div>

                {/* PAGINE TOTALI */}
                <div className="flex justify-end items-center gap-2 text-sm">
                    <span className="text-brand-textSecondary">Mostra</span>

                    <select
                        value={pageSize}
                        onChange={onPageSizeChange}
                        className="
                                border border-brand-divider
                                rounded-full px-3 py-1
                                bg-white text-brand-text
                                focus:outline-none focus:ring-2 focus:ring-brand-primary
                                cursor-pointer
                            "
                    >
                        {[10, 15, 20, 30, 40, 50].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
});
