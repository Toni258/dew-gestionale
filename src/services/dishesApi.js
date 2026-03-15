import { delJson, getJson, postForm, postJson, putForm } from './apiClient';

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

export function getDishById(dishId) {
    return getJson(`/api/dishes/${dishId}`);
}

export function checkDishNameExists(name, { excludeId } = {}) {
    const qs = new URLSearchParams({ name });
    if (excludeId) qs.set('excludeId', String(excludeId));
    return getJson(`/api/dishes/exists?${qs.toString()}`);
}

export function createDish(formData) {
    return postForm('/api/dishes', formData);
}

export function updateDish(dishId, formData) {
    return putForm(`/api/dishes/${dishId}`, formData);
}

export function deleteDish(dishId) {
    return delJson(`/api/dishes/${dishId}`);
}

export function unsuspendDish(dishId) {
    return postJson(`/api/dishes/${dishId}/unsuspend`, {});
}

export function suspendDishDryRun(dishId, payload) {
    return postJson(`/api/dishes/${dishId}/suspend`, {
        ...payload,
        mode: 'dry-run',
    });
}

export function suspendDishApply(dishId, payload) {
    return postJson(`/api/dishes/${dishId}/suspend`, {
        ...payload,
        mode: 'apply',
    });
}
