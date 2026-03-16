// Main page for edit menu.
import AppLayout from '../../components/layout/AppLayout';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

import DeleteMenuModal from '../../components/modals/DeleteMenuModal';
import ModifyMenuModal from '../../components/modals/ModifyMenuModal';

import MenuHeaderCard from '../../components/menu/MenuHeaderCard';
import MenuGrid from '../../components/menu/MenuGrid';

import { withLoaderNotify } from '../../services/withLoaderNotify';

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

    const { menu, mealsByDay, loading, setMenu } =
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

    if (loading) return <p>Caricamento…</p>;
    if (!menu) return <p>Menù non trovato</p>;

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
                onConfirm={async (m) => {
                    const res = await withLoaderNotify({
                        message: 'Eliminazione menù…',
                        mode: 'blocking',
                        success: 'Menù eliminato correttamente',
                        errorTitle: 'Errore eliminazione menù',
                        errorMessage: 'Impossibile eliminare il menù.',
                        fn: async () => {
                            await deleteMenu(m.season_type);
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