// Custom hook used to manage edit menu.
import { useEffect, useMemo, useState } from 'react';
import {
    getMenuBySeasonType,
    getMenuMealsStatus,
    getArchivedMenuByID,
    getArchivedMenuMealsStatus,
} from '../../services/menusApi';

// Manages the state and side effects for edit menu.
export function useEditMenu(decodedSeasonType) {
    // Main state used by the page
    const [menu, setMenu] = useState(null);
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Load data when the component opens

    useEffect(() => {
        let alive = true;

        // Loads the current data.
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
    // Derived data used by the UI

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

// Manages the state and side effects for view archived menu.
export function useViewArchivedMenu(decoded_id_arch_menu) {
    const [menu, setMenu] = useState(null);
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let alive = true;

        // Loads the current data.
        async function load() {
            setLoading(true);
            setError(null);

            try {
                const menuData =
                    await getArchivedMenuByID(decoded_id_arch_menu);
                const mealsData =
                    await getArchivedMenuMealsStatus(decoded_id_arch_menu);

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
    }, [decoded_id_arch_menu]);

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