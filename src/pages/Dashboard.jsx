// Main operational dashboard.
// Most visual blocks live in dedicated components so this page can focus on data and actions.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppLayout from '../components/layout/AppLayout';
import AlertBox from '../components/ui/AlertBox';
import Card from '../components/ui/Card';
import ArchiveMenuModal from '../components/modals/ArchiveMenuModal';
import PasswordResetRequestsModal from '../components/modals/PasswordResetRequestsModal';
import {
    ChecklistItem,
    PriorityAlertCard,
    QuickStatusCard,
    SectionTitle,
    SuspendedDishRow,
} from '../components/dashboard/DashboardSectionBlocks';

import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { withLoaderNotify } from '../services/withLoaderNotify';
import { archiveMenu } from '../services/menusApi';

export default function Dashboard() {
    const navigate = useNavigate();
    const { isSuperUser } = useAuth();

    const {
        data,
        loading,
        error,
        fetchDashboard,
        showPasswordResetRequestsModal,
        setShowPasswordResetRequestsModal,
    } = useDashboardData(isSuperUser);
    // Main state used by the page

    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [menuToArchive, setMenuToArchive] = useState(null);
    const [archiving, setArchiving] = useState(false);

    const currentMenu = data?.menus?.current ?? null;
    const nextMenu = data?.menus?.next ?? null;
    const lastEndedMenu = data?.menus?.last_ended_unarchived ?? null;
    const alerts = data?.alerts ?? [];
    const checklist = data?.checklist ?? [];
    const suspendedDishes = data?.suspended_dishes ?? [];
    // Derived data used by the UI

    const archiveCandidateBySeason = useMemo(() => {
        const map = new Map();

        if (lastEndedMenu?.season_type) {
            map.set(lastEndedMenu.season_type, lastEndedMenu);
        }

        return map;
    }, [lastEndedMenu]);

    // Helper function used by open archive for season.
    function openArchiveForSeason(seasonType) {
        const candidate = archiveCandidateBySeason.get(seasonType);

        if (!candidate) {
            navigate('/menu');
            return;
        }

        setMenuToArchive(candidate);
        setShowArchiveModal(true);
    }

    // Handles the logic for action.
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

    // Handles the logic for confirm archive.
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