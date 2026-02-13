import { memo } from 'react';
import PageButton from './PageButton';

export default memo(function Pagination({
    total = 0,
    page = 1,
    totalPages = 1,
    pageSize = 10,
    pageSizeOptions = [10, 15, 20, 30, 40, 50],
    loading = false,
    onPageChange,
    onPageSizeChange,
    className = '',
}) {
    const safeTotalPages = Math.max(1, Number(totalPages) || 1);
    const safePage = Math.min(safeTotalPages, Math.max(1, Number(page) || 1));

    const canPrev = safePage > 1 && !loading;
    const canNext = safePage < safeTotalPages && !loading;

    const goTo = (p) => {
        if (!onPageChange) return;
        const next = Math.min(safeTotalPages, Math.max(1, p));
        onPageChange(next);
    };

    const middlePages = Array.from(
        { length: safeTotalPages },
        (_, i) => i + 1,
    ).filter(
        (p) => p !== 1 && p !== safeTotalPages && Math.abs(p - safePage) <= 1,
    );

    return (
        <div
            className={`px-4 py-3 border-t border-brand-divider grid grid-cols-3 items-center ${className}`}
        >
            {/* RISULTATI */}
            <div className="text-sm text-brand-textSecondary">
                Risultati:{' '}
                <span className="font-semibold text-brand-text">{total}</span>
            </div>

            {/* CAROSELLO PAGINE */}
            <div className="flex justify-center items-center gap-2">
                {/* PREV */}
                <button
                    type="button"
                    disabled={!canPrev}
                    onClick={() => goTo(safePage - 1)}
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
                <PageButton pageNum={1} current={safePage} onClick={goTo} />

                {/* ... prima */}
                {safePage > 3 && (
                    <span className="px-2 text-brand-textSecondary select-none">
                        …
                    </span>
                )}

                {/* PAGINE CENTRALI */}
                {middlePages.map((p) => (
                    <PageButton
                        key={p}
                        pageNum={p}
                        current={safePage}
                        onClick={goTo}
                    />
                ))}

                {/* ... dopo */}
                {safePage < safeTotalPages - 2 && (
                    <span className="px-2 text-brand-textSecondary select-none">
                        …
                    </span>
                )}

                {/* ULTIMA PAGINA */}
                {safeTotalPages > 1 && (
                    <PageButton
                        pageNum={safeTotalPages}
                        current={safePage}
                        onClick={goTo}
                    />
                )}

                {/* NEXT */}
                <button
                    type="button"
                    disabled={!canNext}
                    onClick={() => goTo(safePage + 1)}
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

            {/* PAGE SIZE */}
            <div className="flex justify-end items-center gap-2 text-sm">
                <span className="text-brand-textSecondary">Mostra</span>

                <select
                    value={pageSize}
                    onChange={onPageSizeChange}
                    className="
                        border border-brand-divider
                        rounded-full px-2 py-1
                        bg-white text-brand-text
                        focus:outline-none focus:ring-2 focus:ring-brand-primary
                        cursor-pointer
                    "
                >
                    {pageSizeOptions.map((n) => (
                        <option key={n} value={n}>
                            {n}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
});
