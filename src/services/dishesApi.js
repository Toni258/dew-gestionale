// Frontend service helpers for dishes api.
import { delJson, getJson, postForm, postJson, putForm } from './apiClient';

// Returns the data used by dishes.
export function getDishes(params = {}) {
    const qs = new URLSearchParams();

    if (params.search) qs.set('search', params.search);
    if (params.stato) qs.set('stato', params.stato);
    if (params.tipologia) qs.set('tipologia', params.tipologia);
    if (params.page != null) qs.set('page', String(params.page));
    if (params.pageSize != null) qs.set('pageSize', String(params.pageSize));

    (params.allergeni || []).forEach((allergene) => {
        if (allergene) qs.append('allergeni', allergene);
    });

    return getJson(`/api/dishes?${qs.toString()}`);
}

// Returns the data used by dish by id.
export function getDishById(dishId) {
    return getJson(`/api/dishes/${dishId}`);
}

// Checks the current value for dish name exists.
export function checkDishNameExists(name, { excludeId } = {}) {
    const qs = new URLSearchParams({ name });
    if (excludeId) qs.set('excludeId', String(excludeId));
    return getJson(`/api/dishes/exists?${qs.toString()}`);
}

// Creates the data for dish.
export function createDish(formData) {
    return postForm('/api/dishes', formData);
}

// Updates the data for dish.
export function updateDish(dishId, formData) {
    return putForm(`/api/dishes/${dishId}`, formData);
}

// Returns the data used by delete dish preview.
export function getDishDeletePreview(dishId) {
    return getJson(`/api/dishes/${dishId}/delete-preview`);
}

// Deletes the data for dish.
export function deleteDish(dishId) {
    return delJson(`/api/dishes/${dishId}`);
}

// Helper function used by unsuspend dish.
export function unsuspendDish(dishId) {
    return postJson(`/api/dishes/${dishId}/unsuspend`, {});
}

// Helper function used by suspend dish dry run.
export function suspendDishDryRun(dishId, payload) {
    return postJson(`/api/dishes/${dishId}/suspend`, {
        ...payload,
        mode: 'dry-run',
    });
}

// Helper function used by suspend dish apply.
export function suspendDishApply(dishId, payload) {
    return postJson(`/api/dishes/${dishId}/suspend`, {
        ...payload,
        mode: 'apply',
    });
}
