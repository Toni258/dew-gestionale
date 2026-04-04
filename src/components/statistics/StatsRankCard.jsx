// Ranking card used by the "Statistiche Scelte" page.
import Card from '../ui/Card';
import {
    fmtInt,
    fmtPct,
    formatCourseLabel,
} from '../../utils/statistics/reportFormatters';

export default function StatsRankCard({
    title,
    icon,
    iconSrc,
    iconAlt = '',
    rows,
    mode = 'top',
}) {
    const rowBgClass =
        mode === 'top'
            ? 'bg-[rgba(57,142,59,0.07)] border-[rgba(57,142,59,0.10)]'
            : mode === 'bottom'
              ? 'bg-[rgba(224,72,72,0.07)] border-[rgba(224,72,72,0.10)]'
              : 'bg-[rgba(79,79,79,0.05)] border-[rgba(79,79,79,0.10)]';

    const badgeBg =
        mode === 'top'
            ? 'bg-[rgba(57,142,59,0.6)]'
            : mode === 'bottom'
              ? 'bg-[rgba(224,72,72,0.6)]'
              : 'bg-[rgba(79,79,79,0.6)]';

    const valueTextClass =
        mode === 'top'
            ? 'text-brand-primary'
            : mode === 'bottom'
              ? 'text-brand-error'
              : 'text-brand-text';

    return (
        <Card className="rounded-[24px] border border-white/60 bg-white/85 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <div className="mb-5 flex items-center gap-2.5">
                {iconSrc ? (
                    <img
                        src={iconSrc}
                        alt={iconAlt || title}
                        draggable={false}
                        className="h-5 w-5 shrink-0 object-contain"
                    />
                ) : (
                    <span className="text-lg leading-none">{icon}</span>
                )}

                <div className="text-[15px] font-semibold text-brand-text">
                    {title}
                </div>
            </div>

            {!rows || rows.length === 0 ? (
                <div className="italic text-brand-textSecondary">
                    Nessun dato nel periodo selezionato.
                </div>
            ) : (
                <div className="flex flex-col gap-3.5">
                    {rows.map((row, index) => (
                        <div
                            key={`${row.food_id}-${index}`}
                            className={`flex items-center justify-between gap-4 rounded-[20px] border px-4 py-3 shadow-[0_4px_14px_rgba(15,23,42,0.04)] ${rowBgClass}`}
                        >
                            <div className="flex min-w-0 items-center gap-3.5">
                                <div
                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_16px_rgba(15,23,42,0.06)] ${badgeBg}`}
                                >
                                    <span className="text-md font-semibold leading-none text-brand-text">
                                        {index + 1}
                                    </span>
                                </div>

                                <div className="min-w-0">
                                    <div className="truncate text-[15px] font-semibold leading-5 text-brand-text">
                                        {row.name}
                                    </div>
                                    <div className="mt-0.5 text-[12px] leading-4 text-brand-textSecondary">
                                        {formatCourseLabel(row.type)}
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 text-right">
                                {mode === 'never' ? (
                                    <>
                                        <div
                                            className={`text-[17px] font-semibold leading-none tracking-[-0.02em] ${valueTextClass}`}
                                        >
                                            0 scelte
                                        </div>
                                        <div className="mt-1 text-[12px] leading-4 text-brand-textSecondary">
                                            {fmtInt(row.opportunity_count)}{' '}
                                            opportunità
                                        </div>
                                        <div className="mt-1 text-[11px] leading-4 text-brand-textSecondary/80">
                                            {fmtInt(row.availability_count)}{' '}
                                            apparizioni nel menù ·{' '}
                                            {fmtInt(row.patient_scope_count)}{' '}
                                            ospiti
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div
                                            className={`text-[19px] font-semibold leading-none tracking-[-0.02em] ${valueTextClass}`}
                                        >
                                            {fmtPct(row.selection_rate_pct, 1)}
                                        </div>
                                        <div className="mt-1 text-[12px] leading-4 text-brand-textSecondary">
                                            {fmtInt(row.chosen_count)} scelte ·{' '}
                                            {fmtInt(row.opportunity_count)}{' '}
                                            opportunità
                                        </div>
                                        <div className="mt-1 text-[11px] leading-4 text-brand-textSecondary/80">
                                            {fmtInt(row.availability_count)}{' '}
                                            apparizioni nel menù ·{' '}
                                            {fmtInt(row.patient_scope_count)}{' '}
                                            ospiti
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
