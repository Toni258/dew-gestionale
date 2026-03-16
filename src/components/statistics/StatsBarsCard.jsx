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
        <Card>
            <div className="flex items-start gap-2">
                {iconSrc ? (
                    <img
                        src={iconSrc}
                        alt={iconAlt || title}
                        className="mt-0.5 h-5 w-5 object-contain shrink-0"
                    />
                ) : (
                    <span className="mt-0.5 text-lg">{icon}</span>
                )}

                <div className="w-full">
                    <div className="mb-4">
                        <div className="font-semibold text-brand-text">
                            {title}
                        </div>
                        {sub && (
                            <div className="text-xs text-brand-textSecondary">
                                {sub}
                            </div>
                        )}
                    </div>
                    {!rows || rows.length === 0 ? (
                        <div className="italic text-brand-textSecondary">
                            {emptyText}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
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
                                    <div key={`${row.label}-${index}`}>
                                        <div className="mb-1 flex items-center justify-between gap-3">
                                            <div className="font-medium text-brand-text">
                                                {row.label}
                                            </div>
                                            <div className="shrink-0 text-sm font-semibold text-brand-text">
                                                {row.valueLabel}
                                            </div>
                                        </div>

                                        <div className="h-3 w-full overflow-hidden rounded-full bg-brand-sidebar">
                                            <div
                                                className="h-full rounded-full bg-brand-primary transition-all duration-300"
                                                style={{ width: `${width}%` }}
                                            />
                                        </div>

                                        {metaRenderer && (
                                            <div className="mt-1 text-xs text-brand-textSecondary">
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

/*

return (
        <Card>
            <div className="mb-4 flex items-start gap-2">
                {iconSrc ? (
                    <img
                        src={iconSrc}
                        alt={iconAlt || title}
                        className="mt-0.5 h-5 w-5 object-contain shrink-0"
                    />
                ) : (
                    <span className="mt-0.5 text-lg">{icon}</span>
                )}

                <div>
                    <div className="font-semibold text-brand-text">{title}</div>
                    {sub && (
                        <div className="text-xs text-brand-textSecondary">
                            {sub}
                        </div>
                    )}
                </div>
            </div>

            {!rows || rows.length === 0 ? (
                <div className="italic text-brand-textSecondary">
                    {emptyText}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
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
                            <div key={`${row.label}-${index}`}>
                                <div className="mb-1 flex items-center justify-between gap-3">
                                    <div className="font-medium text-brand-text">
                                        {row.label}
                                    </div>
                                    <div className="shrink-0 text-sm font-semibold text-brand-text">
                                        {row.valueLabel}
                                    </div>
                                </div>

                                <div className="h-3 w-full overflow-hidden rounded-full bg-brand-sidebar">
                                    <div
                                        className="h-full rounded-full bg-brand-primary transition-all duration-300"
                                        style={{ width: `${width}%` }}
                                    />
                                </div>

                                {metaRenderer && (
                                    <div className="mt-1 text-xs text-brand-textSecondary">
                                        {metaRenderer(row)}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );

*/
