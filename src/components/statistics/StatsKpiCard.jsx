/**
 * Compact KPI card shared by report pages.
 */
import Card from '../ui/Card';

export default function StatsKpiCard({
    icon,
    iconSrc,
    iconAlt = '',
    iconBg,
    value,
    label,
    sub,
}) {
    return (
        <Card className="rounded-[24px] border border-white/60 bg-white/85 px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <div className="flex items-start gap-4">
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_16px_rgba(15,23,42,0.06)] ${iconBg}`}
                >
                    {iconSrc ? (
                        <img
                            src={iconSrc}
                            alt={iconAlt || label}
                            draggable={false}
                            className="h-5 w-5 object-contain"
                        />
                    ) : (
                        <span className="text-lg leading-none">{icon}</span>
                    )}
                </div>

                <div className="min-w-0 mt-1">
                    <div className="break-words text-[28px] font-semibold leading-none tracking-[-0.03em] text-brand-text capitalize">
                        {value}
                    </div>

                    <div className="mt-2 text-[14px] font-medium leading-5 text-brand-text">
                        {label}
                    </div>

                    {sub && (
                        <div className="mt-1 text-[12px] leading-5 text-brand-textSecondary">
                            {sub}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
