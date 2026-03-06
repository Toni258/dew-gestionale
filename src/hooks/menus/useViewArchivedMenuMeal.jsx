import { useEffect, useMemo, useState } from 'react';
import { getArchivedMenuMealComposition } from '../../services/menusApi';

const COURSE_TYPES = [
    { key: 'primo', label: 'Primo' },
    { key: 'secondo', label: 'Secondo' },
    { key: 'contorno', label: 'Contorno' },
    { key: 'ultimo', label: 'Ultimo' },
];

const EMPTY_SELECTED = {
    primo: null,
    secondo: null,
    contorno: null,
    ultimo: null,
};

export function useViewArchivedMenuMeal({ id_arch_menu, dayIndex, mealType }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [selectedFoods, setSelectedFoods] = useState(EMPTY_SELECTED);

    useEffect(() => {
        let alive = true;

        async function load() {
            setLoading(true);
            try {
                const json = await getArchivedMenuMealComposition(
                    id_arch_menu,
                    dayIndex,
                    mealType,
                );

                if (!alive) return;

                setData(json);

                const nextSelected = { ...EMPTY_SELECTED };
                (json?.dishes ?? []).forEach((d) => {
                    nextSelected[d.type] = d;
                });

                setSelectedFoods(nextSelected);
            } catch (err) {
                console.error(err);
                if (alive) setData(null);
            } finally {
                if (alive) setLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, [id_arch_menu, dayIndex, mealType]);

    const totals = useMemo(() => {
        return Object.values(selectedFoods).reduce(
            (acc, f) => {
                if (!f) return acc;
                acc.weight += Number(f.grammage_tot || 0);
                acc.kcal += Number(f.kcal_tot || 0);
                acc.proteins += Number(f.proteins || 0);
                acc.carbs += Number(f.carbs || 0);
                acc.fats += Number(f.fats || 0);
                return acc;
            },
            { weight: 0, kcal: 0, proteins: 0, carbs: 0, fats: 0 },
        );
    }, [selectedFoods]);

    return {
        COURSE_TYPES,
        data,
        loading,
        selectedFoods,
        totals,
        pageLabel: 'Visualizzazione pasto',
    };
}
