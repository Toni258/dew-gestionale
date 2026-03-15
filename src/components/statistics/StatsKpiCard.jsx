/**
 * Compact KPI card shared by report pages.
 */
import Card from '../ui/Card';

export default function StatsKpiCard({ icon, iconBg, value, label, sub }) {
    return (
        <Card className="p-5">
            <div className="flex items-start gap-3">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}
                >
                    <span className="text-lg">{icon}</span>
                </div>
                <div className="min-w-0">
                    <div className="break-words text-2xl font-bold capitalize text-brand-text">
                        {value}
                    </div>
                    <div className="text-sm text-brand-textSecondary">
                        {label}
                    </div>
                    {sub && (
                        <div className="mt-1 text-xs text-brand-textSecondary opacity-80">
                            {sub}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
