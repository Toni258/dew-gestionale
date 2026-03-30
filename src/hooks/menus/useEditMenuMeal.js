// Custom hook used to manage edit menu meal.
import { useEffect, useMemo, useState } from 'react';
import { getAvailableFoodsForMenu } from '../../services/foodsApi';
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
                    COURSE_TYPES.map((c) =>
                        getAvailableFoodsForMenu({
                            type: c.key,
                            season_type: seasonType,
                            meal_type: mealType,
                        }),
                    ),
                );

                const map = {};
                COURSE_TYPES.forEach((c, i) => {
                    map[c.key] = results[i]?.data ?? [];
                });

                if (alive) setFoodOptions(map);
            } catch (err) {
                console.error('Errore caricamento foods:', err);
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
            try {
                const json = await getMenuMealComposition(
                    seasonType,
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
                setInitialFoodIds(makeInitialFoodIdsFromSelected(nextSelected));
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
    }, [seasonType, dayIndex, mealType]);
    // Derived data used by the UI

    const hasSomethingSaved = useMemo(() => {
        const dishes = data?.dishes ?? [];
        const types = new Set(dishes.map((d) => d.type));
        return (
            types.has('primo') ||
            types.has('secondo') ||
            types.has('contorno') ||
            types.has('ultimo')
        );
    }, [data]);

    // Selezione completa (tutti i corsi hanno un piatto selezionato)
    // const allSelectedNow = useMemo(() => {
    // return COURSE_TYPES.every((c) =>
    // Boolean(selectedFoods[c.key]?.id_food),
    // );
    // }, [selectedFoods]);

    const hasChanges = useMemo(() => {
        return COURSE_TYPES.some((c) => {
            const now = selectedFoods[c.key]?.id_food ?? null;
            const init = initialFoodIds[c.key] ?? null;
            return now !== init;
        });
    }, [selectedFoods, initialFoodIds]);

    const pageLabel = hasSomethingSaved
        ? 'Modifica pasto'
        : 'Composizione pasto';
    const buttonLabel = hasSomethingSaved ? 'Salva modifica' : 'Aggiungi pasto';

    const disableSave = saving || !hasChanges;

    // Con controllo se tutti i piatti sono stati selezionati
    // const disableSave = saving || !allSelectedNow || (hasSomethingSaved && !hasChanges);

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

        const fullFood = list.find((f) => Number(f.id_food) === idFood) ?? null;

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
