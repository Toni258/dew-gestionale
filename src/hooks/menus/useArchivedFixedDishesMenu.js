import { useEffect, useMemo, useState } from 'react';
import { getCheeses } from '../../services/foodsApi';
import {
    getArchivedMenuFixedDishes,
    getArchivedFixedCheesesRotation,
} from '../../services/menusApi';

import { COURSE_ROWS } from '../../components/menu/fixedDishes/constants';
import {
    makeEmptySelected,
    makeEmptyCheeseRotation,
} from '../../components/menu/fixedDishes/helpers';

export function useArchivedFixedDishesMenu(idArchMenuRaw) {
    const idArchMenu = useMemo(
        () => String(idArchMenuRaw ?? ''),
        [idArchMenuRaw],
    );

    const [loading, setLoading] = useState(true);

    const [selectedFoods, setSelectedFoods] = useState(makeEmptySelected);
    const [cheeseOptions, setCheeseOptions] = useState([]);
    const [cheeseRotation, setCheeseRotation] = useState(
        makeEmptyCheeseRotation,
    );

    useEffect(() => {
        let alive = true;

        async function loadAll() {
            setLoading(true);
            try {
                const [fixedJson, cheesesJson, rotJson] = await Promise.all([
                    getArchivedMenuFixedDishes(idArchMenu),
                    getCheeses(), // opzionale: se vuoi mostrare anche “lista formaggi” altrove
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

                    const isCheese = [195, 196, 197].includes(
                        Number(dish.id_food),
                    );
                    if (isCheese) continue;

                    const arr = nextSelected[meal][course];
                    const firstNull = arr.findIndex((x) => x === null);
                    if (firstNull !== -1) {
                        // dish qui è “aggregato” (ripetizioni). A noi basta id_food + name ecc.
                        nextSelected[meal][course][firstNull] = dish;
                    }
                }

                if (!alive) return;

                setCheeseOptions(cheeses);
                setCheeseRotation({
                    pranzo: (rot.pranzo ?? []).map((x) => x ?? null),
                    cena: (rot.cena ?? []).map((x) => x ?? null),
                });
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
    }, [idArchMenu]);

    return {
        loading,
        selectedFoods,
        cheeseOptions,
        cheeseRotation,
    };
}
