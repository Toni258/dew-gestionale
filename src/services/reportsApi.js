import { getJson } from './apiClient';

function toQueryString(params = {}) {
    const qs = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return;
        }

        qs.set(key, String(value));
    });

    return qs.toString();
}

export function getConsumiMenus() {
    return getJson('/api/reports/consumi/menus');
}

export function getConsumiReport(params = {}) {
    return getJson(`/api/reports/consumi?${toQueryString(params)}`);
}

export function getScelteMenus() {
    return getJson('/api/reports/scelte/menus');
}

export function getScelteReport(params = {}) {
    return getJson(`/api/reports/scelte?${toQueryString(params)}`);
}
