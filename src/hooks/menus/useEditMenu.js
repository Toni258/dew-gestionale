import { useEffect, useMemo, useState } from 'react';
import {
    getMenuBySeasonType,
    getMenuMealsStatus,
} from '../../services/menusApi';

export function useEditMenu(decodedSeasonType) {
    const [menu, setMenu] = useState(null);
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let alive = true;

        async function load() {
            setLoading(true);
            setError(null);

            try {
                const menuData = await getMenuBySeasonType(decodedSeasonType);
                const mealsData = await getMenuMealsStatus(decodedSeasonType);

                if (!alive) return;

                setMenu(menuData);
                setMeals(mealsData?.data ?? mealsData ?? []);
            } catch (err) {
                console.error(err);
                if (!alive) return;
                setMenu(null);
                setMeals([]);
                setError(err);
            } finally {
                if (alive) setLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, [decodedSeasonType]);

    const mealsByDay = useMemo(() => {
        const map = {};
        for (const m of meals) {
            const d = Number(m.day_index);
            if (!map[d]) map[d] = { pranzo: null, cena: null };
            map[d][m.type] = m;
        }
        return map;
    }, [meals]);

    return { menu, meals, mealsByDay, loading, error, setMenu };
}
