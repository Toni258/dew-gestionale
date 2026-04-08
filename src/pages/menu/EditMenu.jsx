// Main page for edit menu.
import AppLayout from '../../components/layout/AppLayout';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

import DeleteMenuModal from '../../components/modals/DeleteMenuModal';
import ModifyMenuModal from '../../components/modals/ModifyMenuModal';

import MenuHeaderCard from '../../components/menu/MenuHeaderCard';
import MenuGrid from '../../components/menu/MenuGrid';
import AlertBox from '../../components/ui/AlertBox';
import Button from '../../components/ui/Button';
import ResourceNotFoundState from '../../components/ui/ResourceNotFoundState';

import { withLoaderNotify } from '../../services/withLoaderNotify';
import { isNotFoundError } from '../../services/apiClient';

import { useEditMenu } from '../../hooks/menus/useEditMenu';
import { updateMenu, deleteMenu } from '../../services/menusApi';

export default function EditMenu() {
    const { seasonType } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const decodedSeasonType = useMemo(
        () => decodeURIComponent(seasonType ?? ''),
        [seasonType],
    );

    const { menu, mealsByDay, loading, error, setMenu } =
        useEditMenu(decodedSeasonType);
    // Main state used by the page

    const [menuToDelete, setMenuToDelete] = useState(null);
    const [modifyMenu, setModifyMenu] = useState(false);
    // Load data when the component opens

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const shouldOpenModifyMenu = params.get('openModifyMenu') === '1';

        if (!shouldOpenModifyMenu) return;
        if (!menu) return;

        setModifyMenu(true);

        const cleanParams = new URLSearchParams(location.search);
        cleanParams.delete('openModifyMenu');

        const cleanSearch = cleanParams.toString();
        navigate(
            {
                pathname: location.pathname,
                search: cleanSearch ? `?${cleanSearch}` : '',
            },
            { replace: true },
        );
    }, [location.pathname, location.search, menu, navigate]);

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
                    title="Menù non trovato"
                    description="Il menù richiesto non esiste più oppure il collegamento non è valido."
                    requestedLabel="Menù richiesto"
                    requestedValue={decodedSeasonType}
                    note="Il menù potrebbe essere stato eliminato, rinominato oppure il link potrebbe essere stato copiato in modo incompleto."
                    secondaryLabel="Vai all'elenco menù"
                    onSecondaryClick={() => navigate('/menu')}
                />
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout title="GESTIONE MENÙ">
                <div className="w-full max-w-2xl mx-auto">
                    <AlertBox variant="error" title="Impossibile caricare il menù">
                        {error?.message || 'Si è verificato un errore inatteso durante il caricamento.'}
                    </AlertBox>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button
                            variant="secondary"
                            className="w-full sm:w-[220px]"
                            onClick={() => navigate('/menu')}
                        >
                            Vai all'elenco menù
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
            <div className="w-full max-w-7xl mx-auto">
                <h1 className="text-3xl font-semibold">Composizione menù</h1>

                <MenuHeaderCard
                    menu={menu}
                    onClickFixedDishes={() =>
                        navigate(`/menu/edit/${menu.season_type}/piatti_fissi`)
                    }
                    onClickEditMenu={() => setModifyMenu(true)}
                    onClickDeleteMenu={() => setMenuToDelete(menu)}
                />
            </div>

            <MenuGrid
                menu={menu}
                mealsByDay={mealsByDay}
                onOpenMeal={({ dayIndex, mealType }) =>
                    navigate(
                        `/menu/edit/${encodeURIComponent(
                            menu.season_type,
                        )}/meal/${dayIndex}/${mealType}`,
                    )
                }
            />

            <DeleteMenuModal
                menu={menuToDelete}
                onClose={() => setMenuToDelete(null)}
                onConfirm={async (menuItem) => {
                    const res = await withLoaderNotify({
                        message: 'Eliminazione menù…',
                        mode: 'blocking',
                        success: 'Menù eliminato correttamente',
                        errorTitle: 'Errore eliminazione menù',
                        errorMessage: 'Impossibile eliminare il menù.',
                        fn: async () => {
                            await deleteMenu(menuItem.season_type);
                            setMenuToDelete(null);
                            navigate('/menu');
                            return true;
                        },
                    });

                    if (!res.ok) return;
                }}
            />

            <ModifyMenuModal
                open={modifyMenu}
                menu={menu}
                onClose={() => setModifyMenu(false)}
                onConfirm={async (updatedValues) => {
                    const res = await withLoaderNotify({
                        message: 'Salvataggio modifiche…',
                        mode: 'blocking',
                        success: 'Menù modificato correttamente',
                        errorTitle: 'Errore modifica menù',
                        errorMessage: 'Impossibile modificare il menù.',
                        fn: async () => {
                            await updateMenu(menu.season_type, updatedValues);
                            setMenu((prev) => ({ ...prev, ...updatedValues }));
                            setModifyMenu(false);
                            return true;
                        },
                    });

                    if (!res.ok) return;
                }}
            />
        </AppLayout>
    );
}
