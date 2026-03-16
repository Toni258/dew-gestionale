// Frontend service helpers for reports api.
import { getJson } from './apiClient';

// Converts the input into query string.
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

// Returns the data used by consumi menus.
export function getConsumiMenus() {
    return getJson('/api/reports/consumi/menus');
}

// Returns the data used by consumi report.
export function getConsumiReport(params = {}) {
    return getJson(`/api/reports/consumi?${toQueryString(params)}`);
}

// Returns the data used by scelte menus.
export function getScelteMenus() {
    return getJson('/api/reports/scelte/menus');
}

// Returns the data used by scelte report.
export function getScelteReport(params = {}) {
    return getJson(`/api/reports/scelte?${toQueryString(params)}`);
}