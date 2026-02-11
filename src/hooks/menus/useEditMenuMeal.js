import { useEffect, useMemo, useState } from 'react';
import { getAvailableFoodsForMenu } from '../../services/foodsApi';
import {
    getMenuMealComposition,
    upsertMenuMealComposition,
} from '../../services/menusApi';

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

function makeInitialFoodIdsFromSelected(selected) {
    return {
        primo: selected.primo?.id_food ?? null,
        secondo: selected.secondo?.id_food ?? null,
        contorno: selected.contorno?.id_food ?? null,
        ultimo: selected.ultimo?.id_food ?? null,
    };
}

export function useEditMenuMeal({ seasonType, dayIndex, mealType }) {
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

    const hasAllFourSaved = useMemo(() => {
        const dishes = data?.dishes ?? [];
        const types = new Set(dishes.map((d) => d.type));
        return (
            types.has('primo') &&
            types.has('secondo') &&
            types.has('contorno') &&
            types.has('ultimo')
        );
    }, [data]);

    const allSelectedNow = useMemo(() => {
        return COURSE_TYPES.every((c) =>
            Boolean(selectedFoods[c.key]?.id_food),
        );
    }, [selectedFoods]);

    const hasChanges = useMemo(() => {
        return COURSE_TYPES.some((c) => {
            const now = selectedFoods[c.key]?.id_food ?? null;
            const init = initialFoodIds[c.key] ?? null;
            return now !== init;
        });
    }, [selectedFoods, initialFoodIds]);

    const pageLabel = hasAllFourSaved ? 'Modifica pasto' : 'Composizione pasto';
    const buttonLabel = hasAllFourSaved ? 'Salva modifica' : 'Aggiungi pasto';

    const disableSave =
        saving || !allSelectedNow || (hasAllFourSaved && !hasChanges);

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

    function setSelectedFood(courseKey, idFoodStr) {
        const idFood = Number(idFoodStr);
        const list = foodOptions?.[courseKey] ?? [];

        const fullFood =
            list.find((f) => Number(f.id_food) === Number(idFood)) ?? null;

        setSelectedFoods((prev) => ({
            ...prev,
            [courseKey]: fullFood,
        }));
    }

    async function save() {
        // validazione
        for (const c of COURSE_TYPES) {
            if (!selectedFoods[c.key]?.id_food) {
                alert(`Seleziona un piatto per: ${c.label}`);
                return { ok: false };
            }
        }

        if (hasAllFourSaved && !hasChanges) {
            alert('Nessuna modifica da salvare');
            return { ok: false };
        }

        const payload = {
            foods: {
                primo: selectedFoods.primo.id_food,
                secondo: selectedFoods.secondo.id_food,
                contorno: selectedFoods.contorno.id_food,
                ultimo: selectedFoods.ultimo.id_food,
            },
        };

        setSaving(true);
        try {
            await upsertMenuMealComposition(
                seasonType,
                dayIndex,
                mealType,
                payload,
            );

            alert(
                hasAllFourSaved
                    ? 'Modifiche salvate correttamente'
                    : 'Pasto aggiunto correttamente',
            );

            return { ok: true };
        } catch (e) {
            console.error(e);
            alert(e.message || 'Errore salvataggio');
            return { ok: false, error: e };
        } finally {
            setSaving(false);
        }
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
