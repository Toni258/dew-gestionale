// Frontend service helpers for menus api.
import { delJson, getJson, postJson, putJson } from './apiClient';

// Returns the data used by menus.
export function getMenus() {
    return getJson('/api/menus');
}

// Checks the current value for menu name exists.
export function checkMenuNameExists(name) {
    const qs = new URLSearchParams({ name: (name ?? '').trim() });
    return getJson(`/api/menus/exists?${qs.toString()}`);
}

// Checks the current value for menu dates overlap.
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

// Creates the data for menu.
export function createMenu(payload) {
    return postJson('/api/menus', payload);
}

// Returns the data used by menu by season type.
export function getMenuBySeasonType(seasonType) {
    return getJson(`/api/menus/${encodeURIComponent(seasonType)}`);
}

// Returns the data used by menu meals status.
export function getMenuMealsStatus(seasonType) {
    return getJson(`/api/menus/${encodeURIComponent(seasonType)}/meals-status`);
}

// Updates the data for menu.
export function updateMenu(seasonType, payload) {
    return putJson(`/api/menus/${encodeURIComponent(seasonType)}`, payload);
}

// Deletes the data for menu.
export function deleteMenu(seasonType) {
    return delJson(`/api/menus/${encodeURIComponent(seasonType)}`);
}

// Returns the data used by menu meal composition.
export function getMenuMealComposition(seasonType, dayIndex, mealType) {
    return getJson(
        `/api/menus/${encodeURIComponent(
            seasonType,
        )}/meals/${dayIndex}/${mealType}`,
    );
}

// Helper function used by upsert menu meal composition.
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

// Returns the data used by menu fixed dishes.
export function getMenuFixedDishes(seasonType) {
    return getJson(`/api/menus/${encodeURIComponent(seasonType)}/fixed-dishes`);
}

// Helper function used by upsert menu fixed dishes.
export function upsertMenuFixedDishes(seasonType, payload) {
    return putJson(
        `/api/menus/${encodeURIComponent(seasonType)}/fixed-dishes`,
        payload,
    );
}

// Returns the data used by fixed cheeses rotation.
export function getFixedCheesesRotation(seasonType) {
    return getJson(
        `/api/menus/${encodeURIComponent(seasonType)}/fixed-cheeses-rotation`,
    );
}

// Returns the data used by archived menus.
export function getArchivedMenus() {
    return getJson('/api/archived-menus');
}

// Returns the data used by archived menu by id.
export function getArchivedMenuByID(id_arch_menu) {
    return getJson(
        `/api/archived-menus/view/${encodeURIComponent(id_arch_menu)}`,
    );
}

// Returns the data used by archived menu meals status.
export function getArchivedMenuMealsStatus(id_arch_menu) {
    return getJson(
        `/api/archived-menus/${encodeURIComponent(id_arch_menu)}/meals-status`,
    );
}

// Returns the data used by archived menu fixed dishes.
export function getArchivedMenuFixedDishes(id_arch_menu) {
    return getJson(
        `/api/archived-menus/${encodeURIComponent(id_arch_menu)}/fixed-dishes`,
    );
}

// Returns the data used by archived fixed cheeses rotation.
export function getArchivedFixedCheesesRotation(id_arch_menu) {
    return getJson(
        `/api/archived-menus/${encodeURIComponent(id_arch_menu)}/fixed-cheeses-rotation`,
    );
}

// Returns the data used by archived menu meal composition.
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

// Helper function used by archive menu.
export function archiveMenu(seasonType) {
    return postJson(`/api/menus/${encodeURIComponent(seasonType)}/archive`, {});
}