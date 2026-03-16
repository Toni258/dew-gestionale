// Presentational blocks used by the dashboard page.
// They keep the page focused on data loading and user actions.
import Card from '../ui/Card';
import Button from '../ui/Button';

const ALERT_STYLES = {
    error: {
        container: 'border-brand-error bg-brand-error/5',
        badge: 'bg-brand-error/12 text-brand-error border-brand-error/20',
        icon: '/warning rosso.png',
        label: 'Urgente',
        buttonVariant: 'danger',
    },
    warning: {
        container: 'border-brand-warning bg-brand-warning/10',
        badge: 'bg-brand-warning/15 text-brand-warning border-brand-warning/20',
        icon: '/warning giallo.png',
        label: 'Attenzione',
        buttonVariant: 'warning',
    },
    info: {
        container: 'border-brand-secondary/40 bg-brand-secondary/5',
        badge: 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20',
        icon: '/information blue.png',
        label: 'Info',
        buttonVariant: 'secondary',
    },
};

const STATUS_TONES = {
    error: 'bg-brand-error/12 text-brand-error border-brand-error/20',
    warning: 'bg-brand-warning/15 text-brand-warning border-brand-warning/20',
    info: 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20',
    success: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
};

// Formats the value used by days label.
function formatDaysLabel(days) {
    if (days === null || days === undefined) return '—';
    if (days === 0) return 'oggi';
    if (days === 1) return 'domani';
    if (days > 1) return `tra ${days} giorni`;
    if (days === -1) return 'ieri';
    return `${Math.abs(days)} giorni fa`;
}

// Component used for dashboard section blocks.
function StatusPill({ label, tone = 'info' }) {
    return (
        <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${STATUS_TONES[tone] || STATUS_TONES.info}`}
        >
            {label}
        </span>
    );
}

// Component used for dashboard section blocks.
export function SectionTitle({ title, subtitle }) {
    return (
        <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-2xl font-semibold text-brand-text">{title}</h2>
            {subtitle && (
                <p className="text-sm text-brand-textSecondary">{subtitle}</p>
            )}
        </div>
    );
}

// Component used for dashboard section blocks.
export function PriorityAlertCard({ alert, onAction }) {
    const styles = ALERT_STYLES[alert.severity] || ALERT_STYLES.info;

    return (
        <Card className={`border ${styles.container} !p-5`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-3">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-textField">
                        <img
                            src={styles.icon}
                            alt={styles.label}
                            className="h-5 w-5 select-none"
                            draggable={false}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${styles.badge}`}
                            >
                                {styles.label}
                            </span>

                            <span className="text-lg font-semibold text-brand-text">
                                {alert.title}
                            </span>
                        </div>

                        <p className="text-sm leading-6 text-brand-textSecondary">
                            {alert.message}
                        </p>
                    </div>
                </div>

                {alert.action?.label && (
                    <div className="flex shrink-0 lg:pl-4">
                        <Button
                            size="sm"
                            variant={styles.buttonVariant}
                            className="min-w-[140px]"
                            onClick={() => onAction(alert.action)}
                        >
                            {alert.action.label}
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
}

// Component used for dashboard section blocks.
export function QuickStatusCard({
    title,
    menu,
    emptyTitle,
    emptyMessage,
    onAction,
}) {
    if (!menu) {
        return (
            <Card className="border border-brand-divider/70 !p-5">
                <div className="flex h-full flex-col gap-3">
                    <span className="text-lg font-semibold text-brand-text">
                        {title}
                    </span>
                    <span className="text-base font-semibold text-brand-textSecondary">
                        {emptyTitle}
                    </span>
                    <p className="text-sm leading-6 text-brand-textSecondary">
                        {emptyMessage}
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="border border-brand-divider/70 !p-5">
            <div className="flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                    <span className="text-lg font-semibold text-brand-text">
                        {title}
                    </span>
                    <StatusPill label={menu.state_label} tone={menu.state_tone} />
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-2xl font-semibold capitalize text-brand-primary">
                        {menu.season_type}
                    </span>
                    <span className="text-sm text-brand-textSecondary">
                        {menu.period_label}
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm text-brand-text md:grid-cols-2">
                    <div className="rounded-xl bg-white/70 p-3 shadow-textField">
                        <div className="text-xs uppercase tracking-[0.08em] text-brand-textSecondary">
                            Compilazione
                        </div>
                        <div className="mt-1 text-lg font-semibold text-brand-primary">
                            {menu.meals_compiled}/{menu.meals_total}
                        </div>
                        <div className="text-xs text-brand-textSecondary">
                            {menu.completion_pct}% dei pasti completati
                        </div>
                    </div>

                    <div className="rounded-xl bg-white/70 p-3 shadow-textField">
                        <div className="text-xs uppercase tracking-[0.08em] text-brand-textSecondary">
                            Piatti fissi
                        </div>
                        <div className="mt-1 text-lg font-semibold text-brand-primary">
                            {menu.fixed_slots_filled}/{menu.fixed_slots_total}
                        </div>
                        <div className="text-xs text-brand-textSecondary">
                            {menu.fixed_missing_slots > 0
                                ? `${menu.fixed_missing_slots} scelte mancanti`
                                : 'Completi'}
                        </div>
                    </div>
                </div>

                <div className="rounded-xl bg-brand-secondary/5 p-3 text-sm text-brand-text">
                    {menu.is_current ? (
                        <>
                            <div className="font-semibold text-brand-text">
                                Scadenza
                            </div>
                            <div className="mt-1 text-brand-textSecondary">
                                Il menù attuale termina{' '}
                                {formatDaysLabel(menu.days_until_end)}.
                            </div>
                        </>
                    ) : menu.is_ended ? (
                        <>
                            <div className="font-semibold text-brand-text">
                                Chiusura
                            </div>
                            <div className="mt-1 text-brand-textSecondary">
                                Menù concluso{' '}
                                {formatDaysLabel(menu.days_until_end)}.
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="font-semibold text-brand-text">
                                Avvio
                            </div>
                            <div className="mt-1 text-brand-textSecondary">
                                Il prossimo menù parte{' '}
                                {formatDaysLabel(menu.days_until_start)}.
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-auto flex flex-wrap gap-3 pt-2">
                    {!menu.is_ended && (
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={() =>
                                onAction({
                                    type: 'navigate',
                                    target: menu.routes.menu,
                                })
                            }
                        >
                            Apri menù
                        </Button>
                    )}

                    {menu.fixed_missing_slots > 0 && !menu.is_ended && (
                        <Button
                            size="sm"
                            variant="warning"
                            onClick={() =>
                                onAction({
                                    type: 'navigate',
                                    target: menu.routes.fixed_dishes,
                                })
                            }
                        >
                            Piatti fissi
                        </Button>
                    )}

                    {menu.is_ended && (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                                onAction({
                                    type: 'archive-menu',
                                    season_type: menu.season_type,
                                })
                            }
                        >
                            Archivia
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}

// Component used for dashboard section blocks.
export function ChecklistItem({ item, onAction }) {
    const severityDotClass =
        item.severity === 'error'
            ? 'bg-brand-error'
            : item.severity === 'warning'
              ? 'bg-brand-warning'
              : 'bg-brand-secondary';

    return (
        <div className="flex flex-col gap-4 rounded-xl border border-brand-divider/70 bg-white/80 p-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-3">
                <div
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${severityDotClass}`}
                />
                <div className="flex flex-col gap-1">
                    <span className="text-base font-semibold text-brand-text">
                        {item.title}
                    </span>
                    <p className="text-sm leading-6 text-brand-textSecondary">
                        {item.message}
                    </p>
                </div>
            </div>

            {item.action?.label && (
                <Button
                    size="sm"
                    variant={
                        item.severity === 'error'
                            ? 'danger'
                            : item.severity === 'warning'
                              ? 'warning'
                              : 'secondary'
                    }
                    className="min-w-[150px]"
                    onClick={() => onAction(item.action)}
                >
                    {item.action.label}
                </Button>
            )}
        </div>
    );
}

// Component used for dashboard section blocks.
export function SuspendedDishRow({ dish, onAction }) {
    return (
        <div className="flex gap-4">
            <div className="w-1 self-stretch rounded-full bg-brand-secondary" />

            <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-semibold text-brand-text">
                            {dish.name}
                        </span>
                        <StatusPill
                            label={
                                dish.days_until_reactivation <= 7
                                    ? 'Riattivazione vicina'
                                    : 'Sospeso'
                            }
                            tone={
                                dish.days_until_reactivation <= 3
                                    ? 'warning'
                                    : 'info'
                            }
                        />
                    </div>

                    <div className="text-sm text-brand-textSecondary">
                        <span className="font-medium text-brand-text">Tipo:</span>{' '}
                        {dish.type_label} ·{' '}
                        <span className="font-medium text-brand-text">
                            Valido fino al:
                        </span>{' '}
                        {dish.valid_to_label || dish.valid_to}
                    </div>

                    <div className="text-sm text-brand-textSecondary">
                        <span className="font-medium text-brand-text">
                            Motivo:
                        </span>{' '}
                        {dish.reason?.trim() || 'Non specificato'}
                    </div>

                    <div className="text-sm text-brand-textSecondary">
                        {dish.replacement_name ? (
                            <>
                                Piatti sostitutivi:{' '}
                                <span className="font-semibold text-brand-primary">
                                    {dish.replacement_name}
                                </span>
                            </>
                        ) : (
                            'Nessun piatto sostitutivo trovato al momento.'
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-3">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onAction(dish.action)}
                    >
                        {dish.action?.label || 'Apri piatto'}
                    </Button>
                </div>
            </div>
        </div>
    );
}