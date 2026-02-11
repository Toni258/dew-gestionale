// Caricamento dish + mapping in initialValues/originalDish/initialSuspension

import { useEffect, useState } from 'react';
import { getDishById } from '../services/dishesApi';

export function useDish(dishId) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dish, setDish] = useState(null);

    const [initialValues, setInitialValues] = useState(null);
    const [originalDish, setOriginalDish] = useState(null);
    const [initialSuspension, setInitialSuspension] = useState(null);
    const [existingImageUrl, setExistingImageUrl] = useState('');

    useEffect(() => {
        let alive = true;

        async function load() {
            setLoading(true);
            setError('');
            try {
                const data = await getDishById(dishId);

                const imgUrl = data.image_url
                    ? `/food-images/${data.image_url}`
                    : null;

                if (!alive) return;
                setDish(data);
                setExistingImageUrl(imgUrl);

                setInitialValues({
                    name: data.name ?? '',
                    type: data.type ?? '',
                    img: imgUrl,
                    grammage_tot: data.grammage_tot ?? '',
                    kcal_tot: data.kcal_tot ?? '',
                    proteins: data.proteins ?? '',
                    carbohydrates: data.carbs ?? '',
                    fats: data.fats ?? '',
                    allergy_notes: data.allergy_notes ?? [],

                    suspension_enabled: !!data.suspension,
                    suspension_id: data.suspension?.id_avail ?? '',
                    start_date: data.suspension?.valid_from ?? '',
                    end_date: data.suspension?.valid_to ?? '',
                    reason: data.suspension?.reason ?? '',
                });

                setInitialSuspension({
                    enabled: !!data.suspension,
                    valid_from: data.suspension?.valid_from ?? '',
                    valid_to: data.suspension?.valid_to ?? '',
                    reason: data.suspension?.reason ?? '',
                });

                setOriginalDish({
                    name: data.name ?? '',
                    type: data.type ?? '',
                    grammage_tot: data.grammage_tot ?? '',
                    kcal_tot: data.kcal_tot ?? '',
                    proteins: data.proteins ?? '',
                    carbohydrates: data.carbs ?? '',
                    fats: data.fats ?? '',
                    allergy_notes: data.allergy_notes ?? [],
                });
            } catch (e) {
                if (!alive) return;
                setError(e.message || 'Impossibile caricare il piatto');
            } finally {
                if (alive) setLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, [dishId]);

    return {
        loading,
        error,
        dish,
        initialValues,
        originalDish,
        initialSuspension,
        existingImageUrl,
    };
}
