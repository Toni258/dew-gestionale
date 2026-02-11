import { getJson } from './apiClient';

export function getAvailableFoodsForMenu({ type, season_type, meal_type }) {
    const qs = new URLSearchParams({ type, season_type, meal_type });
    return getJson(`/api/foods/available-for-menu?${qs.toString()}`);
    // atteso: { data: [...] }
}

export function getCheeses() {
    return getJson('/api/foods/cheeses');
    // atteso: { data: [...] }
}
