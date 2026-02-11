// Contiene tutta la logica: load (options + fixed + cheeses + rotation), regole duplicate, calcoli allFilled, e save().
import { useEffect, useMemo, useState, useCallback } from 'react';
import { getAvailableFoodsForMenu, getCheeses } from '../../services/foodsApi';
import {
    getMenuFixedDishes,
    upsertMenuFixedDishes,
    getFixedCheesesRotation,
} from '../../services/menusApi';

import { COURSE_ROWS } from '../../components/menu/fixedDishes/constants';
import {
    makeEmptySelected,
    makeEmptyCheeseRotation,
    ensureInOptions,
    getMissingFields,
    toIdsArray,
    isDuplicateInMeal,
} from '../../components/menu/fixedDishes/helpers';

export function useFixedDishesMenu(seasonTypeRaw) {
    const decodedSeasonType = useMemo(
        () => decodeURIComponent(seasonTypeRaw ?? ''),
        [seasonTypeRaw],
    );

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [selectedFoods, setSelectedFoods] = useState(makeEmptySelected);
    const [options, setOptions] = useState({
        pranzo: {
            primo: [],
            secondo: [],
            contorno: [],
            ultimo: [],
            coperto: [],
        },
        cena: {
            primo: [],
            secondo: [],
            contorno: [],
            ultimo: [],
            coperto: [],
            speciale: [],
        },
    });

    const [cheeseOptions, setCheeseOptions] = useState([]);
    const [cheeseRotation, setCheeseRotation] = useState(
        makeEmptyCheeseRotation,
    );

    const cheeseFilled = useMemo(() => {
        const p = cheeseRotation.pranzo.every((x) => x?.id_food);
        const c = cheeseRotation.cena.every((x) => x?.id_food);
        return p && c;
    }, [cheeseRotation]);

    const allFilled = useMemo(() => {
        return getMissingFields(selectedFoods).length === 0 && cheeseFilled;
    }, [selectedFoods, cheeseFilled]);

    // ---- setters “sicuri” (evitano duplicati) ----
    const setSelectedFood = useCallback(
        ({ meal, courseKey, idx, food }) => {
            const idFood = Number(food?.id_food ?? 0);
            if (
                Number.isInteger(idFood) &&
                idFood > 0 &&
                isDuplicateInMeal(selectedFoods, meal, idFood, {
                    meal,
                    courseKey,
                    idx,
                })
            ) {
                return { ok: false, reason: 'duplicate' };
            }

            setSelectedFoods((prev) => {
                const copy = structuredClone(prev);
                copy[meal][courseKey][idx] = food ?? null;
                return copy;
            });

            return { ok: true };
        },
        [selectedFoods],
    );

    const setCheeseRotationAt = useCallback(({ meal, idx, food }) => {
        setCheeseRotation((prev) => {
            const copy = structuredClone(prev);
            copy[meal][idx] = food ?? null;
            return copy;
        });
    }, []);

    // ---- load ----
    useEffect(() => {
        let alive = true;

        async function loadAll() {
            setLoading(true);
            try {
                // 1) load options per ogni riga/pasto
                const toLoad = [];

                for (const row of COURSE_ROWS) {
                    if (row.key === 'speciale') {
                        toLoad.push(
                            getAvailableFoodsForMenu({
                                type: 'speciale',
                                season_type: decodedSeasonType,
                                meal_type: 'cena',
                            }).then((json) => ({
                                meal: 'cena',
                                key: 'speciale',
                                data: json?.data ?? [],
                            })),
                        );
                        continue;
                    }

                    toLoad.push(
                        getAvailableFoodsForMenu({
                            type: row.key,
                            season_type: decodedSeasonType,
                            meal_type: 'pranzo',
                        }).then((json) => ({
                            meal: 'pranzo',
                            key: row.key,
                            data: json?.data ?? [],
                        })),
                    );

                    toLoad.push(
                        getAvailableFoodsForMenu({
                            type: row.key,
                            season_type: decodedSeasonType,
                            meal_type: 'cena',
                        }).then((json) => ({
                            meal: 'cena',
                            key: row.key,
                            data: json?.data ?? [],
                        })),
                    );
                }

                const loadedOptions = await Promise.all(toLoad);

                const nextOptions = {
                    pranzo: {
                        primo: [],
                        secondo: [],
                        contorno: [],
                        ultimo: [],
                        coperto: [],
                    },
                    cena: {
                        primo: [],
                        secondo: [],
                        contorno: [],
                        ultimo: [],
                        coperto: [],
                        speciale: [],
                    },
                };

                for (const item of loadedOptions) {
                    nextOptions[item.meal][item.key] = item.data;
                }

                // 2) fixed dishes
                const fixedJson = await getMenuFixedDishes(decodedSeasonType);
                const fixed = fixedJson?.data ?? [];
                const nextSelected = makeEmptySelected();

                // 3) cheeses + rotation
                const [cheesesJson, rotJson] = await Promise.all([
                    getCheeses(),
                    getFixedCheesesRotation(decodedSeasonType),
                ]);

                const cheeses = cheesesJson?.data ?? [];
                const rot = rotJson?.data ?? { pranzo: [], cena: [] };

                if (!alive) return;

                setCheeseOptions(cheeses);
                setCheeseRotation({
                    pranzo: (rot.pranzo ?? []).map((x) => x ?? null),
                    cena: (rot.cena ?? []).map((x) => x ?? null),
                });

                // 4) piazzo fixed dishes negli slot (escludo i formaggi hardcoded: se domani li togli, basta togliere questa regola)
                for (const dish of fixed) {
                    const meal = dish.pasto; // 'pranzo' | 'cena'
                    const course = dish.portata;

                    if (!nextSelected[meal]) continue;
                    if (!nextSelected[meal][course]) continue;
                    if (meal === 'pranzo' && course === 'speciale') continue;

                    const isCheese = [195, 196, 197].includes(
                        Number(dish.id_food),
                    );
                    if (isCheese) continue;

                    const arr = nextSelected[meal][course];
                    const firstNull = arr.findIndex((x) => x === null);
                    if (firstNull !== -1) arr[firstNull] = dish;
                }

                // 5) ensure selected ∈ options
                for (const meal of ['pranzo', 'cena']) {
                    const mealCourses = nextSelected[meal] ?? {};
                    for (const courseKey of Object.keys(mealCourses)) {
                        const arr = mealCourses[courseKey] ?? [];
                        for (const food of arr) {
                            if (!food) continue;
                            ensureInOptions(nextOptions, meal, courseKey, food);
                        }
                    }
                }

                if (!alive) return;
                setOptions(nextOptions);
                setSelectedFoods(nextSelected);
            } catch (e) {
                console.error(e);
            } finally {
                if (alive) setLoading(false);
            }
        }

        loadAll();
        return () => {
            alive = false;
        };
    }, [decodedSeasonType]);

    // ---- save ----
    const save = useCallback(async () => {
        const requiredRowsLunch = [
            'primo',
            'secondo',
            'contorno',
            'ultimo',
            'coperto',
        ];
        const requiredRowsDinner = [
            'primo',
            'secondo',
            'contorno',
            'ultimo',
            'coperto',
            'speciale',
        ];

        const hasEmpty = (meal, keys) => {
            for (const k of keys) {
                const arr = selectedFoods?.[meal]?.[k] ?? [];

                // secondo[2] non obbligatorio (rimpiazzato dai formaggi)
                if (k === 'secondo') {
                    const firstTwo = [arr[0], arr[1]];
                    if (firstTwo.some((x) => !x?.id_food)) return true;
                    continue;
                }

                if (arr.some((x) => !x?.id_food)) return true;
            }
            return false;
        };

        if (
            hasEmpty('pranzo', requiredRowsLunch) ||
            hasEmpty('cena', requiredRowsDinner) ||
            !cheeseFilled
        ) {
            return {
                ok: false,
                reason: 'validation',
                message:
                    'Compila tutti i campi (inclusi i formaggi a rotazione) prima di salvare.',
            };
        }

        const payload = {
            pranzo: {
                primo: toIdsArray(selectedFoods.pranzo.primo),
                secondo: toIdsArray(selectedFoods.pranzo.secondo),
                contorno: toIdsArray(selectedFoods.pranzo.contorno),
                ultimo: toIdsArray(selectedFoods.pranzo.ultimo),
                coperto: toIdsArray(selectedFoods.pranzo.coperto),
            },
            cena: {
                primo: toIdsArray(selectedFoods.cena.primo),
                secondo: toIdsArray(selectedFoods.cena.secondo),
                contorno: toIdsArray(selectedFoods.cena.contorno),
                ultimo: toIdsArray(selectedFoods.cena.ultimo),
                coperto: toIdsArray(selectedFoods.cena.coperto),
                speciale: toIdsArray(selectedFoods.cena.speciale),
            },
            formaggi_rotation: {
                pranzo: cheeseRotation.pranzo.map((x) =>
                    Number(x?.id_food ?? 0),
                ),
                cena: cheeseRotation.cena.map((x) => Number(x?.id_food ?? 0)),
            },
        };

        setSaving(true);
        try {
            await upsertMenuFixedDishes(decodedSeasonType, payload);
            return { ok: true };
        } catch (e) {
            console.error(e);
            return {
                ok: false,
                reason: 'api',
                message: e?.message || 'Errore salvataggio',
            };
        } finally {
            setSaving(false);
        }
    }, [decodedSeasonType, selectedFoods, cheeseRotation, cheeseFilled]);

    return {
        decodedSeasonType,

        loading,
        saving,

        selectedFoods,
        options,

        cheeseOptions,
        cheeseRotation,

        cheeseFilled,
        allFilled,

        setSelectedFood,
        setCheeseRotationAt,

        save,
    };
}
