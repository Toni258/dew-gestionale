/**
 * Generic bar card used by the "Statistiche Scelte" page.
 */
import Card from '../ui/Card';

export default function StatsBarsCard({
    title,
    sub = '',
    icon,
    iconSrc,
    iconAlt = '',
    rows,
    barMode = 'percent',
    emptyText = 'Nessun dato nel periodo selezionato.',
    metaRenderer,
}) {
    const maxValue =
        barMode === 'relative'
            ? Math.max(1, ...(rows || []).map((row) => Number(row.value ?? 0)))
            : 100;

    return (
        <Card className="rounded-[24px] border border-white/60 bg-white/85 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <div className="mb-5 flex items-start gap-2.5">
                {iconSrc ? (
                    <img
                        src={iconSrc}
                        alt={iconAlt || title}
                        draggable={false}
                        className="mt-0.5 h-5 w-5 shrink-0 object-contain"
                    />
                ) : (
                    <span className="text-lg leading-none">{icon}</span>
                )}

                <div className="w-full">
                    <div className="min-w-0 mb-5">
                        <div className="text-[15px] font-semibold text-brand-text">
                            {title}
                        </div>
                        {sub && (
                            <div className="mt-0.5 text-[12px] leading-5 text-brand-textSecondary">
                                {sub}
                            </div>
                        )}
                    </div>

                    {!rows || rows.length === 0 ? (
                        <div className="italic text-brand-textSecondary">
                            {emptyText}
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {rows.map((row, index) => {
                                const rawValue = Number(row.value ?? 0);
                                const width =
                                    barMode === 'percent'
                                        ? Math.max(0, Math.min(100, rawValue))
                                        : Math.max(
                                              0,
                                              Math.min(
                                                  100,
                                                  (rawValue / maxValue) * 100,
                                              ),
                                          );

                                return (
                                    <div
                                        key={`${row.label}-${index}`}
                                        className={`${index === 0 ? '' : 'border-t border-black/5 pt-4'} ${index === rows.length - 1 ? '' : 'pb-4'}`}
                                    >
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <div className="text-[14px] font-medium text-brand-text">
                                                {row.label}
                                            </div>
                                            <div className="shrink-0 text-[14px] font-semibold tracking-[-0.01em] text-brand-text">
                                                {row.valueLabel}
                                            </div>
                                        </div>

                                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[rgba(31,31,31,0.06)] shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]">
                                            <div
                                                className="h-full rounded-full bg-brand-primary shadow-[0_3px_10px_rgba(57,142,59,0.18)] transition-all duration-300"
                                                style={{ width: `${width}%` }}
                                            />
                                        </div>

                                        {metaRenderer && (
                                            <div className="mt-2 text-[12px] leading-5 text-brand-textSecondary">
                                                {metaRenderer(row)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
