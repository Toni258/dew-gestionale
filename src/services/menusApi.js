import { delJson, getJson, postJson, putJson } from './apiClient';

export function getMenus() {
    return getJson('/api/menus');
}

export function checkMenuNameExists(name) {
    const qs = new URLSearchParams({ name: (name ?? '').trim() });
    return getJson(`/api/menus/exists?${qs.toString()}`);
}

export function checkMenuDatesOverlap(
    start_date,
    end_date,
    { excludeName = '', excludeArchMenuId = '' } = {},
) {
    const qs = new URLSearchParams({ start_date, end_date });
    if (excludeName) qs.set('excludeName', excludeName);
    if (excludeArchMenuId) qs.set('excludeArchMenuId', excludeArchMenuId);
    return getJson(`/api/menus/dates-overlap?${qs.toString()}`);
}

export function createMenu(payload) {
    return postJson('/api/menus', payload);
}

export function getMenuBySeasonType(seasonType) {
    return getJson(`/api/menus/${encodeURIComponent(seasonType)}`);
}

export function getMenuMealsStatus(seasonType) {
    return getJson(`/api/menus/${encodeURIComponent(seasonType)}/meals-status`);
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
}

export function getArchivedMenus() {
    return getJson('/api/archived-menus');
}

export function getArchivedMenuByID(id_arch_menu) {
    return getJson(
        `/api/archived-menus/view/${encodeURIComponent(id_arch_menu)}`,
    );
}

export function getArchivedMenuMealsStatus(id_arch_menu) {
    return getJson(
        `/api/archived-menus/${encodeURIComponent(id_arch_menu)}/meals-status`,
    );
}

export function getArchivedMenuFixedDishes(id_arch_menu) {
    return getJson(
        `/api/archived-menus/${encodeURIComponent(id_arch_menu)}/fixed-dishes`,
    );
}

export function getArchivedFixedCheesesRotation(id_arch_menu) {
    return getJson(
        `/api/archived-menus/${encodeURIComponent(id_arch_menu)}/fixed-cheeses-rotation`,
    );
}

export function getArchivedMenuMealComposition(
    id_arch_menu,
    dayIndex,
    mealType,
) {
    return getJson(
        `/api/archived-menus/${encodeURIComponent(
            id_arch_menu,
        )}/meals/${dayIndex}/${mealType}`,
    );
}

export function archiveMenu(seasonType) {
    return postJson(`/api/menus/${encodeURIComponent(seasonType)}/archive`, {});
}
