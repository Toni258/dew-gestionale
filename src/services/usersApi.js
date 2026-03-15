import { delJson, getJson, postJson } from './apiClient';

function buildUsersQuery(params = {}) {
    const qs = new URLSearchParams();

    if (params.search) qs.set('search', params.search);
    if (params.ruolo) qs.set('ruolo', params.ruolo);
    if (params.status) qs.set('status', params.status);
    if (params.page != null) qs.set('page', String(params.page));
    if (params.pageSize != null) qs.set('pageSize', String(params.pageSize));

    return qs.toString();
}

export function getMobileAppUsers(params = {}) {
    return getJson(`/api/users/mobile?${buildUsersQuery(params)}`);
}

export function getGestionaleUsers(params = {}) {
    return getJson(`/api/users/gestionale?${buildUsersQuery(params)}`);
}

export function checkEmailExists(email) {
    const qs = new URLSearchParams({ email: (email ?? '').trim() });
    return getJson(`/api/users/emailExists?${qs.toString()}`);
}

export function createUserGestionale(payload) {
    return postJson('/api/users/create/gestionale', payload);
}

export function updateGestionaleUserInfo(userId, payload) {
    return postJson(`/api/users/${userId}/update-info/gestionale`, payload);
}

export function updateMobileAppUserInfo(userId, payload) {
    return postJson(`/api/users/${userId}/update-info/app`, payload);
}

export function resetGestionaleUserPassword(userId, newPassword) {
    return postJson(`/api/users/${userId}/reset-password`, {
        newPassword,
    });
}

export function suspendGestionaleUser(userId) {
    return postJson(`/api/users/${userId}/suspend`, {});
}

export function unsuspendGestionaleUser(userId) {
    return postJson(`/api/users/${userId}/unsuspend`, {});
}

export function deleteGestionaleUser(userId) {
    return postJson(`/api/users/${userId}/delete/gestionale`, {});
}

export function disableMobileAppUser(userId) {
    return postJson(`/api/users/${userId}/disable/app`, {});
}

export function deleteMobileAppUser(userId) {
    return postJson(`/api/users/${userId}/delete/app`, {});
}
