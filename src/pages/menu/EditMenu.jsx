import AppLayout from '../../components/layout/AppLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';

import DeleteMenuModal from '../../components/modals/DeleteMenuModal';
import ModifyMenuModal from '../../components/modals/ModifyMenuModal';

import MenuHeaderCard from '../../components/menu/MenuHeaderCard';
import MenuGrid from '../../components/menu/MenuGrid';

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
        <AppLayout title="GESTIONE MENÙ" username="Antonio">
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
                    try {
                        await deleteMenu(m.season_type);
                        alert('Menù eliminato correttamente');
                        setMenuToDelete(null);
                        navigate('/menu');
                    } catch (e) {
                        alert(e.message);
                    }
                }}
            />

            <ModifyMenuModal
                open={modifyMenu}
                menu={menu}
                onClose={() => setModifyMenu(false)}
                onConfirm={async (updatedValues) => {
                    try {
                        await updateMenu(menu.season_type, updatedValues);
                        setMenu((prev) => ({ ...prev, ...updatedValues }));
                        alert('Menù modificato correttamente');
                        setModifyMenu(false);
                    } catch (e) {
                        alert(e.message);
                    }
                }}
            />
        </AppLayout>
    );
}
