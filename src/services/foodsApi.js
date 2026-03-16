// Frontend service helpers for foods api.
import { getJson } from './apiClient';

// Returns the data used by available foods for menu.
export function getAvailableFoodsForMenu({
    type,
    season_type,
    meal_type,
    search = '',
    date_from = '',
    date_to = '',
    exclude_id_food = '',
} = {}) {
    const qs = new URLSearchParams({ type, season_type, meal_type });
    if (search) qs.set('search', search);
    if (date_from) qs.set('date_from', date_from);
    if (date_to) qs.set('date_to', date_to);
    if (exclude_id_food !== '' && exclude_id_food != null) {
        qs.set('exclude_id_food', String(exclude_id_food));
    }
    return getJson(`/api/foods/available-for-menu?${qs.toString()}`);
}

// Returns the data used by cheeses.
export function getCheeses() {
    return getJson('/api/foods/cheeses');
}