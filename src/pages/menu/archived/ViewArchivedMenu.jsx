// Main page for view archived menu.
import AppLayout from '../../../components/layout/AppLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

import ArchivedMenuHeaderCard from '../../../components/menu/ArchivedMenuHeaderCard';
import MenuGrid from '../../../components/menu/MenuGrid';
import AlertBox from '../../../components/ui/AlertBox';
import Button from '../../../components/ui/Button';
import ResourceNotFoundState from '../../../components/ui/ResourceNotFoundState';

import { isNotFoundError } from '../../../services/apiClient';
import { useViewArchivedMenu } from '../../../hooks/menus/useEditMenu';

export default function ViewArchivedMenu() {
    const { id_arch_menu } = useParams();
    const navigate = useNavigate();

    const decoded_id_arch_menu = useMemo(
        () => decodeURIComponent(id_arch_menu ?? ''),
        [id_arch_menu],
    );

    const { menu, mealsByDay, loading, error } =
        useViewArchivedMenu(decoded_id_arch_menu);

    if (loading) {
        return (
            <AppLayout title="GESTIONE MENÙ">
                <p>Caricamento…</p>
            </AppLayout>
        );
    }

    if (isNotFoundError(error) || (!menu && !error)) {
        return (
            <AppLayout title="GESTIONE MENÙ">
                <ResourceNotFoundState
                    title="Menù archiviato non trovato"
                    description="Il menù archiviato richiesto non esiste più oppure il collegamento non è valido."
                    requestedLabel="ID archivio richiesto"
                    requestedValue={decoded_id_arch_menu}
                    note="Il menù potrebbe essere stato rimosso dallo storico oppure il link potrebbe riferirsi a una risorsa non più disponibile."
                    secondaryLabel="Vai allo storico menù"
                    onSecondaryClick={() => navigate('/menu-archived/history')}
                />
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout title="GESTIONE MENÙ">
                <div className="w-full max-w-2xl mx-auto">
                    <AlertBox variant="error" title="Impossibile caricare il menù archiviato">
                        {error?.message || 'Si è verificato un errore inatteso durante il caricamento.'}
                    </AlertBox>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button
                            variant="secondary"
                            className="w-full sm:w-[220px]"
                            onClick={() => navigate('/menu-archived/history')}
                        >
                            Vai allo storico menù
                        </Button>

                        <Button
                            variant="primary"
                            className="w-full sm:w-[220px]"
                            onClick={() => navigate(-1)}
                        >
                            Torna indietro
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="GESTIONE MENÙ">
            <div className="w-full max-w-3xl mx-auto">
                <h1 className="text-3xl font-semibold">Composizione menù</h1>

                <ArchivedMenuHeaderCard
                    menu={menu}
                    onClickFixedDishes={() =>
                        navigate(
                            `/menu-archived/piatti-fissi/${decoded_id_arch_menu}`,
                        )
                    }
                />
            </div>

            <MenuGrid
                menu={menu}
                mealsByDay={mealsByDay}
                readOnly
                onOpenMeal={({ dayIndex, mealType }) =>
                    navigate(
                        `/menu-archived/view-archived/${id_arch_menu}/meal/${dayIndex}/${mealType}`,
                    )
                }
            />
        </AppLayout>
    );
}
