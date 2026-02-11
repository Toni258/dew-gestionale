import { getJson, postJson, putJson, delJson } from './apiClient';

export function checkMenuNameExists(name) {
    const qs = new URLSearchParams({ name: (name ?? '').trim() });
    return getJson(`/api/menus/exists?${qs.toString()}`);
    // atteso: { exists: boolean }
}

export function checkMenuDatesOverlap(start_date, end_date) {
    const qs = new URLSearchParams({ start_date, end_date });
    return getJson(`/api/menus/dates-overlap?${qs.toString()}`);
    // atteso: { overlap: boolean, season_type?: string }
}

export function createMenu(payload) {
    return postJson('/api/menus', payload);
}

export function getMenuBySeasonType(seasonType) {
    return getJson(`/api/menus/${encodeURIComponent(seasonType)}`);
}

export function getMenuMealsStatus(seasonType) {
    return getJson(`/api/menus/${encodeURIComponent(seasonType)}/meals-status`);
    // atteso: { data: [...] } oppure direttamente [...]
}

export function updateMenu(seasonType, payload) {
    return putJson(`/api/menus/${encodeURIComponent(seasonType)}`, payload);
}

export function deleteMenu(seasonType) {
    return delJson(`/api/menus/${encodeURIComponent(seasonType)}`);
}

export function getMenuMealComposition(seasonType, dayIndex, mealType) {
    return getJson(
        `/api/menus/${encodeURIComponent(
            seasonType,
        )}/meals/${dayIndex}/${mealType}`,
    );
}

export function upsertMenuMealComposition(
    seasonType,
    dayIndex,
    mealType,
    body,
) {
    return putJson(
        `/api/menus/${encodeURIComponent(
            seasonType,
        )}/meals/${dayIndex}/${mealType}`,
        body,
    );
}

export function getMenuFixedDishes(seasonType) {
    return getJson(`/api/menus/${encodeURIComponent(seasonType)}/fixed-dishes`);
    // atteso: { data: [...] }
}

export function upsertMenuFixedDishes(seasonType, payload) {
    return putJson(
        `/api/menus/${encodeURIComponent(seasonType)}/fixed-dishes`,
        payload,
    );
}

export function getFixedCheesesRotation(seasonType) {
    return getJson(
        `/api/menus/${encodeURIComponent(seasonType)}/fixed-cheeses-rotation`,
    );
    // atteso: { data: { pranzo:[...], cena:[...] } }
}
