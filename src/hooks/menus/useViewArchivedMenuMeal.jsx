// Custom hook used to manage view archived menu meal.
import { useEffect, useMemo, useState } from 'react';
import { isNotFoundError } from '../../services/apiClient';
import { getArchivedMenuMealComposition } from '../../services/menusApi';

const COURSE_TYPES = [
    { key: 'primo', label: 'Primo' },
    { key: 'secondo', label: 'Secondo' },
    { key: 'contorno', label: 'Contorno' },
    { key: 'ultimo', label: 'Ultimo' },
];

// Empty fallback values used before data is loaded
const EMPTY_SELECTED = {
    primo: null,
    secondo: null,
    contorno: null,
    ultimo: null,
};

// Manages the state and side effects for view archived menu meal.
export function useViewArchivedMenuMeal({ id_arch_menu, dayIndex, mealType }) {
    // Main state used by the page
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);

    const [selectedFoods, setSelectedFoods] = useState(EMPTY_SELECTED);
    // Load data when the component opens

    useEffect(() => {
        let alive = true;

        // Loads the current data.
        async function load() {
            setLoading(true);
            setError(null);
            setNotFound(false);

            try {
                const json = await getArchivedMenuMealComposition(
                    id_arch_menu,
                    dayIndex,
                    mealType,
                );

                if (!alive) return;

                setData(json);

                const nextSelected = { ...EMPTY_SELECTED };
                (json?.dishes ?? []).forEach((dish) => {
                    nextSelected[dish.type] = dish;
                });

                setSelectedFoods(nextSelected);
            } catch (err) {
                console.error(err);
                if (!alive) return;
                setData(null);
                setSelectedFoods({ ...EMPTY_SELECTED });
                setError(err);
                setNotFound(isNotFoundError(err));
            } finally {
                if (alive) setLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, [id_arch_menu, dayIndex, mealType]);
    // Derived data used by the UI

    const totals = useMemo(() => {
        return Object.values(selectedFoods).reduce(
            (acc, food) => {
                if (!food) return acc;
                acc.weight += Number(food.grammage_tot || 0);
                acc.kcal += Number(food.kcal_tot || 0);
                acc.proteins += Number(food.proteins || 0);
                acc.carbs += Number(food.carbs || 0);
                acc.fats += Number(food.fats || 0);
                return acc;
            },
            { weight: 0, kcal: 0, proteins: 0, carbs: 0, fats: 0 },
        );
    }, [selectedFoods]);

    return {
        COURSE_TYPES,
        data,
        loading,
        error,
        notFound,
        selectedFoods,
        totals,
        pageLabel: 'Visualizzazione pasto',
    };
}
