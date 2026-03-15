/**
 * Ranking card used by the "Statistiche Scelte" page.
 */
import Card from '../ui/Card';
import {
    fmtInt,
    fmtPct,
    formatCourseLabel,
} from '../../utils/statistics/reportFormatters';

export default function StatsRankCard({ title, icon, rows, mode = 'top' }) {
    const badgeBg =
        mode === 'top'
            ? 'bg-brand-primary'
            : mode === 'bottom'
              ? 'bg-red-600'
              : 'bg-slate-600';

    const valueTextClass =
        mode === 'top'
            ? 'text-brand-primary'
            : mode === 'bottom'
              ? 'text-red-600'
              : 'text-slate-700';

    return (
        <Card>
            <div className="mb-4 flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <div className="font-semibold text-brand-text">{title}</div>
            </div>

            {!rows || rows.length === 0 ? (
                <div className="italic text-brand-textSecondary">
                    Nessun dato nel periodo selezionato.
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {rows.map((row, index) => (
                        <div
                            key={`${row.food_id}-${index}`}
                            className="flex items-center justify-between gap-3 rounded-xl bg-brand-sidebar px-4 py-3"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-white ${badgeBg}`}
                                >
                                    {index + 1}
                                </div>

                                <div className="min-w-0">
                                    <div className="truncate font-semibold text-brand-text">
                                        {row.name}
                                    </div>
                                    <div className="text-xs text-brand-textSecondary">
                                        {formatCourseLabel(row.type)}
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 text-right">
                                {mode === 'never' ? (
                                    <>
                                        <div
                                            className={`font-bold ${valueTextClass}`}
                                        >
                                            0 scelte
                                        </div>
                                        <div className="text-xs text-brand-textSecondary">
                                            {fmtInt(row.availability_count)}{' '}
                                            disponibilità
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div
                                            className={`font-bold ${valueTextClass}`}
                                        >
                                            {fmtPct(row.selection_rate_pct, 1)}
                                        </div>
                                        <div className="text-xs text-brand-textSecondary">
                                            {fmtInt(row.chosen_count)} scelte ·{' '}
                                            {fmtInt(row.availability_count)}{' '}
                                            disponibilità
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
