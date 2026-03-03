import AppLayout from '../../components/layout/AppLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';

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

    const decodedSeasonType = useMemo(
        () => decodeURIComponent(seasonType ?? ''),
        [seasonType],
    );

    const { menu, mealsByDay, loading, setMenu } =
        useEditMenu(decodedSeasonType);

    const [menuToDelete, setMenuToDelete] = useState(null);
    const [modifyMenu, setModifyMenu] = useState(false);

    if (loading) return <p>Caricamento…</p>;
    if (!menu) return <p>Menù non trovato</p>;

    return (
        <AppLayout title="GESTIONE MENÙ">
            <h1 className="text-3xl font-semibold">Composizione menù</h1>

            <MenuHeaderCard
                menu={menu}
                onClickFixedDishes={() =>
                    navigate(`/menu/edit/${menu.season_type}/piatti_fissi`)
                }
                onClickEditMenu={() => setModifyMenu(true)}
                onClickDeleteMenu={() => setMenuToDelete(menu)}
            />

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
