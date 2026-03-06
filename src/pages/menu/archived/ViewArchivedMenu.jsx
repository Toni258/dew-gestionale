import AppLayout from '../../../components/layout/AppLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';

import ArchivedMenuHeaderCard from '../../../components/menu/ArchivedMenuHeaderCard';
import MenuGrid from '../../../components/menu/MenuGrid';

import { withLoaderNotify } from '../../../services/withLoaderNotify';

import { useViewArchivedMenu } from '../../../hooks/menus/useEditMenu';

export default function ViewArchivedMenu() {
    const { id_arch_menu } = useParams();
    const navigate = useNavigate();

    const decoded_id_arch_menu = useMemo(
        () => decodeURIComponent(id_arch_menu ?? ''),
        [id_arch_menu],
    );

    const { menu, mealsByDay, loading, setMenu } =
        useViewArchivedMenu(decoded_id_arch_menu);

    if (loading) return <p>Caricamento…</p>;
    if (!menu) return <p>Menù non trovato</p>;

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
