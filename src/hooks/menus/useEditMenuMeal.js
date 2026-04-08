// Custom hook used to manage edit menu meal.
import { useEffect, useMemo, useState } from 'react';
import { getAvailableFoodsForMenu } from '../../services/foodsApi';
import { isNotFoundError } from '../../services/apiClient';
import {
    getMenuMealComposition,
    upsertMenuMealComposition,
} from '../../services/menusApi';
import { notify } from '../../services/notify';
import { withLoaderNotify } from '../../services/withLoaderNotify';

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

// Helper function used by make initial food ids from selected.
function makeInitialFoodIdsFromSelected(selected) {
    return {
        primo: selected.primo?.id_food ?? null,
        secondo: selected.secondo?.id_food ?? null,
        contorno: selected.contorno?.id_food ?? null,
        ultimo: selected.ultimo?.id_food ?? null,
    };
}

// Manages the state and side effects for edit menu meal.
export function useEditMenuMeal({ seasonType, dayIndex, mealType }) {
    // Main state used by the page
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);

    const [foodOptions, setFoodOptions] = useState({
        primo: [],
        secondo: [],
        contorno: [],
        ultimo: [],
    });

    const [selectedFoods, setSelectedFoods] = useState(EMPTY_SELECTED);
    const [initialFoodIds, setInitialFoodIds] = useState(
        makeInitialFoodIdsFromSelected(EMPTY_SELECTED),
    );

    const [saving, setSaving] = useState(false);

    // 1) options (tutti i tipi)
    useEffect(() => {
        let alive = true;

        // Loads the data used by all foods.
        async function loadAllFoods() {
            try {
                const results = await Promise.all(
                    COURSE_TYPES.map((course) =>
                        getAvailableFoodsForMenu({
                            type: course.key,
                            season_type: seasonType,
                            meal_type: mealType,
                        }),
                    ),
                );

                const map = {};
                COURSE_TYPES.forEach((course, index) => {
                    map[course.key] = results[index]?.data ?? [];
                });

                if (alive) setFoodOptions(map);
            } catch (err) {
                console.error('Errore caricamento foods:', err);
                if (!alive || !isNotFoundError(err)) return;
                setError(err);
                setNotFound(true);
            }
        }

        loadAllFoods();
        return () => {
            alive = false;
        };
    }, [seasonType, mealType]);

    // 2) composizione corrente
    useEffect(() => {
        let alive = true;

        // Loads the current data.
        async function load() {
            setLoading(true);
            setError(null);
            setNotFound(false);

            try {
                const json = await getMenuMealComposition(
                    seasonType,
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
                setInitialFoodIds(makeInitialFoodIdsFromSelected(nextSelected));
            } catch (err) {
                console.error(err);
                if (!alive) return;
                setData(null);
                setSelectedFoods({ ...EMPTY_SELECTED });
                setInitialFoodIds(
                    makeInitialFoodIdsFromSelected(EMPTY_SELECTED),
                );
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
    }, [seasonType, dayIndex, mealType]);
    // Derived data used by the UI

    const hasSomethingSaved = useMemo(() => {
        const dishes = data?.dishes ?? [];
        const types = new Set(dishes.map((dish) => dish.type));
        return (
            types.has('primo') ||
            types.has('secondo') ||
            types.has('contorno') ||
            types.has('ultimo')
        );
    }, [data]);

    const hasChanges = useMemo(() => {
        return COURSE_TYPES.some((course) => {
            const currentId = selectedFoods[course.key]?.id_food ?? null;
            const initialId = initialFoodIds[course.key] ?? null;
            return currentId !== initialId;
        });
    }, [selectedFoods, initialFoodIds]);

    const pageLabel = hasSomethingSaved
        ? 'Modifica pasto'
        : 'Composizione pasto';
    const buttonLabel = hasSomethingSaved ? 'Salva modifica' : 'Aggiungi pasto';

    const disableSave = saving || !hasChanges;

    const totals = useMemo(() => {
        return COURSE_TYPES.reduce(
            (acc, course) => {
                const food = selectedFoods[course.key];
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

    // Helper function used by set selected food.
    function setSelectedFood(courseKey, idFoodStr) {
        if (!idFoodStr) {
            setSelectedFoods((prev) => ({
                ...prev,
                [courseKey]: null,
            }));
            return;
        }

        const idFood = Number(idFoodStr);
        const list = foodOptions?.[courseKey] ?? [];

        const fullFood = list.find((food) => Number(food.id_food) === idFood) ?? null;

        setSelectedFoods((prev) => ({
            ...prev,
            [courseKey]: fullFood,
        }));
    }

    // Helper function used by save.
    async function save() {
        if (hasSomethingSaved && !hasChanges) {
            notify.info('Nessuna modifica da salvare');
            return { ok: false };
        }

        const payload = {
            foods: {
                primo: selectedFoods.primo?.id_food ?? null,
                secondo: selectedFoods.secondo?.id_food ?? null,
                contorno: selectedFoods.contorno?.id_food ?? null,
                ultimo: selectedFoods.ultimo?.id_food ?? null,
            },
        };

        setSaving(true);

        const res = await withLoaderNotify({
            message: 'Salvataggio…',
            success: hasSomethingSaved
                ? 'Modifiche salvate correttamente'
                : 'Pasto aggiunto correttamente',
            fn: () =>
                upsertMenuMealComposition(
                    seasonType,
                    dayIndex,
                    mealType,
                    payload,
                ),
            errorTitle: 'Errore salvataggio',
            errorMessage: 'Impossibile salvare, riprova.',
        });

        setSaving(false);

        return res.ok ? { ok: true } : { ok: false, error: res.error };
    }

    return {
        COURSE_TYPES,
        data,
        loading,
        saving,
        error,
        notFound,

        foodOptions,
        selectedFoods,

        pageLabel,
        buttonLabel,
        disableSave,
        totals,

        setSelectedFood,
        save,
    };
}
