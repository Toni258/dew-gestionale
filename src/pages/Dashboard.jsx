import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppLayout from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import AlertBox from '../components/ui/AlertBox';
import ArchiveMenuModal from '../components/modals/ArchiveMenuModal';

import { withLoader } from '../services/withLoader';
import { withLoaderNotify } from '../services/withLoaderNotify';
import { getDashboardData } from '../services/dashboardApi';
import { archiveMenu } from '../services/menusApi';

import { useAuth } from '../context/AuthContext';
import PasswordResetRequestsModal from '../components/modals/PasswordResetRequestsModal';

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

function formatDaysLabel(days) {
    if (days === null || days === undefined) return '—';
    if (days === 0) return 'oggi';
    if (days === 1) return 'domani';
    if (days > 1) return `tra ${days} giorni`;
    if (days === -1) return 'ieri';
    return `${Math.abs(days)} giorni fa`;
}

function PriorityAlertCard({ alert, onAction }) {
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

function StatusPill({ label, tone = 'info' }) {
    return (
        <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${STATUS_TONES[tone] || STATUS_TONES.info}`}
        >
            {label}
        </span>
    );
}

function SectionTitle({ title, subtitle }) {
    return (
        <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-2xl font-semibold text-brand-text">{title}</h2>
            {subtitle && (
                <p className="text-sm text-brand-textSecondary">{subtitle}</p>
            )}
        </div>
    );
}

function QuickStatusCard({ title, menu, emptyTitle, emptyMessage, onAction }) {
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
                    <StatusPill
                        label={menu.state_label}
                        tone={menu.state_tone}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-2xl font-semibold text-brand-primary capitalize">
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

function ChecklistItem({ item, onAction }) {
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

function SuspendedDishRow({ dish, onAction }) {
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
                        <span className="font-medium text-brand-text">
                            Tipo:
                        </span>{' '}
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

export default function Dashboard() {
    const navigate = useNavigate();

    const { isSuperUser } = useAuth();
    const [showPasswordResetRequestsModal, setShowPasswordResetRequestsModal] =
        useState(false);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [menuToArchive, setMenuToArchive] = useState(null);
    const [archiving, setArchiving] = useState(false);

    const currentMenu = data?.menus?.current ?? null;
    const nextMenu = data?.menus?.next ?? null;
    const lastEndedMenu = data?.menus?.last_ended_unarchived ?? null;
    const alerts = data?.alerts ?? [];
    const checklist = data?.checklist ?? [];
    const suspendedDishes = data?.suspended_dishes ?? [];

    const archiveCandidateBySeason = useMemo(() => {
        const map = new Map();
        if (lastEndedMenu?.season_type) {
            map.set(lastEndedMenu.season_type, lastEndedMenu);
        }
        return map;
    }, [lastEndedMenu]);

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const result = await withLoader(
                'Caricamento dashboard…',
                async () => getDashboardData(),
                'nonBlocking',
            );
            setData(result);

            if (
                isSuperUser &&
                Array.isArray(result?.password_reset_requests) &&
                result.password_reset_requests.length > 0 &&
                !sessionStorage.getItem('password-reset-requests-modal-shown')
            ) {
                setShowPasswordResetRequestsModal(true);
                sessionStorage.setItem(
                    'password-reset-requests-modal-shown',
                    '1',
                );
            }
        } catch (err) {
            console.error(err);
            setData(null);
            setError(err?.message || 'Impossibile caricare la dashboard.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    function openArchiveForSeason(seasonType) {
        const candidate = archiveCandidateBySeason.get(seasonType);

        if (!candidate) {
            navigate('/menu');
            return;
        }

        setMenuToArchive(candidate);
        setShowArchiveModal(true);
    }

    function handleAction(action) {
        if (!action) return;

        if (action.type === 'navigate' && action.target) {
            navigate(action.target);
            return;
        }

        if (action.type === 'archive-menu' && action.season_type) {
            openArchiveForSeason(action.season_type);
        }
    }

    async function handleConfirmArchive(menu) {
        setArchiving(true);

        const result = await withLoaderNotify({
            message: 'Archiviazione menù…',
            mode: 'blocking',
            success: 'Menù archiviato correttamente',
            errorTitle: 'Errore archiviazione menù',
            errorMessage: 'Impossibile archiviare il menù.',
            fn: async () => {
                await archiveMenu(menu.season_type);
                return true;
            },
        });

        setArchiving(false);

        if (!result.ok) return;

        setShowArchiveModal(false);
        setMenuToArchive(null);
        await fetchDashboard();
    }

    return (
        <AppLayout title="DASHBOARD">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 pb-10">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-semibold text-brand-text">
                        Dashboard operativa
                    </h1>
                    <p className="text-base text-brand-textSecondary">
                        Pagina utile per prevenire errori, controllare lo stato
                        dei menù e guidare le prossime azioni.
                    </p>
                </div>

                {error && (
                    <AlertBox
                        variant="error"
                        title="Errore caricamento dashboard"
                    >
                        {error}
                    </AlertBox>
                )}

                <section>
                    <SectionTitle
                        title="Avvisi prioritari"
                        subtitle="Le criticità più importanti vengono mostrate qui in alto."
                    />

                    {loading ? (
                        <Card>
                            <p className="text-brand-textSecondary">
                                Caricamento avvisi…
                            </p>
                        </Card>
                    ) : alerts.length === 0 ? (
                        <Card className="border border-brand-divider/70">
                            <p className="text-brand-textSecondary">
                                Nessun avviso prioritario al momento.
                            </p>
                        </Card>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {alerts.map((alert) => (
                                <PriorityAlertCard
                                    key={alert.id}
                                    alert={alert}
                                    onAction={handleAction}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <section>
                    <SectionTitle
                        title="Stato rapido dei menù"
                        subtitle="Tre card compatte per capire subito cosa sta succedendo adesso, cosa sta per arrivare e cosa richiede archiviazione."
                    />

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                        <QuickStatusCard
                            title="Menù attuale"
                            menu={currentMenu}
                            emptyTitle="Nessun menù attivo"
                            emptyMessage="Non risulta alcun menù in corso alla data odierna."
                            onAction={handleAction}
                        />

                        <QuickStatusCard
                            title="Prossimo menù"
                            menu={nextMenu}
                            emptyTitle="Nessun menù futuro"
                            emptyMessage="Dopo il menù corrente non è ancora stato programmato un nuovo menù futuro."
                            onAction={handleAction}
                        />

                        <QuickStatusCard
                            title="Ultimo menù concluso"
                            menu={lastEndedMenu}
                            emptyTitle="Nessun menù da archiviare"
                            emptyMessage="Al momento non risulta alcun menù concluso."
                            onAction={handleAction}
                        />
                    </div>
                </section>

                <section>
                    <SectionTitle
                        title="Checklist operativa"
                        subtitle="To-do intelligenti derivati dallo stato reale del sistema, utili per guidare l’operatore nelle prossime azioni."
                    />

                    <Card className="border border-brand-divider/70 !p-5">
                        {loading ? (
                            <p className="text-brand-textSecondary">
                                Caricamento checklist…
                            </p>
                        ) : checklist.length === 0 ? (
                            <p className="text-brand-textSecondary">
                                Nessuna azione operativa urgente da mostrare.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {checklist.map((item) => (
                                    <ChecklistItem
                                        key={item.id}
                                        item={item}
                                        onAction={handleAction}
                                    />
                                ))}
                            </div>
                        )}
                    </Card>
                </section>

                <section>
                    <SectionTitle
                        title="Piatti sospesi"
                        subtitle="Elenco sintetico dei piatti attualmente sospesi, con periodo di validità, motivo e un’indicazione sul possibile sostituto quando è ricostruibile."
                    />

                    <Card className="border border-brand-divider/70 !p-5">
                        {loading ? (
                            <p className="text-brand-textSecondary">
                                Caricamento piatti sospesi…
                            </p>
                        ) : suspendedDishes.length === 0 ? (
                            <p className="text-brand-textSecondary">
                                Non ci sono piatti sospesi in questo momento.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {suspendedDishes.map((dish) => (
                                    <SuspendedDishRow
                                        key={dish.id_avail}
                                        dish={dish}
                                        onAction={handleAction}
                                    />
                                ))}
                            </div>
                        )}
                    </Card>
                </section>
            </div>

            <ArchiveMenuModal
                show={showArchiveModal}
                menu={menuToArchive}
                loading={archiving}
                onClose={() => {
                    if (archiving) return;
                    setShowArchiveModal(false);
                    setMenuToArchive(null);
                }}
                onConfirm={handleConfirmArchive}
            />

            <PasswordResetRequestsModal
                show={showPasswordResetRequestsModal}
                requests={data?.password_reset_requests ?? []}
                onClose={() => setShowPasswordResetRequestsModal(false)}
                onOpenUsers={() => {
                    setShowPasswordResetRequestsModal(false);
                    navigate('/user-manager/gestionale');
                }}
            />
        </AppLayout>
    );
}
