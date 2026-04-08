// Custom hook used to manage archived fixed dishes menu.
import { useEffect, useMemo, useState } from 'react';
import { CHEESE_IDS } from '../../../shared/constants.js';
import { getCheeses } from '../../services/foodsApi';
import { isNotFoundError } from '../../services/apiClient';
import {
    getArchivedMenuFixedDishes,
    getArchivedFixedCheesesRotation,
} from '../../services/menusApi';

import { COURSE_ROWS } from '../../components/menu/fixedDishes/constants';
import {
    makeEmptySelected,
    makeEmptyCheeseRotation,
} from '../../components/menu/fixedDishes/helpers';

// Manages the state and side effects for archived fixed dishes menu.
export function useArchivedFixedDishesMenu(idArchMenuRaw) {
    const idArchMenu = useMemo(() => String(idArchMenuRaw ?? ''), [idArchMenuRaw]);
    // Main state used by the page

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);

    const [selectedFoods, setSelectedFoods] = useState(makeEmptySelected);
    const [cheeseOptions, setCheeseOptions] = useState([]);
    const [cheeseRotation, setCheeseRotation] = useState(makeEmptyCheeseRotation);
    // Load data when the component opens

    useEffect(() => {
        let alive = true;

        // Loads the current data.
        async function load() {
            setLoading(true);
            setError(null);
            setNotFound(false);

            try {
                const [fixedJson, cheesesJson, rotJson] = await Promise.all([
                    getArchivedMenuFixedDishes(idArchMenu),
                    getCheeses(),
                    getArchivedFixedCheesesRotation(idArchMenu),
                ]);

                const fixed = fixedJson?.data ?? [];
                const cheeses = cheesesJson?.data ?? [];
                const rot = rotJson?.data ?? { pranzo: [], cena: [] };

                const nextSelected = makeEmptySelected();

                // piazzo fixed dishes negli slot
                for (const dish of fixed) {
                    const meal = dish.pasto; // 'pranzo'|'cena'
                    const course = dish.portata;

                    if (!nextSelected[meal]) continue;
                    if (!nextSelected[meal][course]) continue;
                    if (meal === 'pranzo' && course === 'speciale') continue;

                    const isCheese = CHEESE_IDS.includes(Number(dish.id_food));
                    if (isCheese) continue;

                    const arr = nextSelected[meal][course];
                    const firstNull = arr.findIndex((entry) => entry === null);
                    if (firstNull !== -1) {
                        nextSelected[meal][course][firstNull] = dish;
                    }
                }

                if (!alive) return;

                setCheeseOptions(cheeses);
                setCheeseRotation({
                    pranzo: (rot.pranzo ?? []).map((entry) => entry ?? null),
                    cena: (rot.cena ?? []).map((entry) => entry ?? null),
                });
                setSelectedFoods(nextSelected);
            } catch (err) {
                console.error(err);
                if (!alive) return;
                setCheeseOptions([]);
                setCheeseRotation(makeEmptyCheeseRotation());
                setSelectedFoods(makeEmptySelected());
                setError(err);
                setNotFound(isNotFoundError(err));
            } finally {
                if (alive) setLoading(false);
            }
        }

        if (idArchMenu) load();
        else {
            setLoading(false);
            setSelectedFoods(makeEmptySelected());
            setCheeseOptions([]);
            setCheeseRotation(makeEmptyCheeseRotation());
        }

        return () => {
            alive = false;
        };
    }, [idArchMenu]);
    // Derived data used by the UI

    const rows = useMemo(() => {
        return COURSE_ROWS.map((row) => ({
            ...row,
            pranzoSelected: selectedFoods.pranzo[row.key],
            cenaSelected: selectedFoods.cena[row.key],
        }));
    }, [selectedFoods]);

    return {
        loading,
        error,
        notFound,
        rows,
        selectedFoods,
        cheeseOptions,
        cheeseRotation,
    };
}
