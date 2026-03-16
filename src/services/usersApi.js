// Frontend service helpers for users api.
import { delJson, getJson, postJson } from './apiClient';

// Builds the data needed for users query.
function buildUsersQuery(params = {}) {
    const qs = new URLSearchParams();

    if (params.search) qs.set('search', params.search);
    if (params.ruolo) qs.set('ruolo', params.ruolo);
    if (params.status) qs.set('status', params.status);
    if (params.page != null) qs.set('page', String(params.page));
    if (params.pageSize != null) qs.set('pageSize', String(params.pageSize));

    return qs.toString();
}

// Returns the data used by mobile app users.
export function getMobileAppUsers(params = {}) {
    return getJson(`/api/users/mobile?${buildUsersQuery(params)}`);
}

// Returns the data used by gestionale users.
export function getGestionaleUsers(params = {}) {
    return getJson(`/api/users/gestionale?${buildUsersQuery(params)}`);
}

// Checks the current value for email exists.
export function checkEmailExists(email) {
    const qs = new URLSearchParams({ email: (email ?? '').trim() });
    return getJson(`/api/users/emailExists?${qs.toString()}`);
}

// Creates the data for user gestionale.
export function createUserGestionale(payload) {
    return postJson('/api/users/create/gestionale', payload);
}

// Updates the data for gestionale user info.
export function updateGestionaleUserInfo(userId, payload) {
    return postJson(`/api/users/${userId}/update-info/gestionale`, payload);
}

// Updates the data for mobile app user info.
export function updateMobileAppUserInfo(userId, payload) {
    return postJson(`/api/users/${userId}/update-info/app`, payload);
}

// Helper function used by reset gestionale user password.
export function resetGestionaleUserPassword(userId, newPassword) {
    return postJson(`/api/users/${userId}/reset-password`, {
        newPassword,
    });
}

// Helper function used by suspend gestionale user.
export function suspendGestionaleUser(userId) {
    return postJson(`/api/users/${userId}/suspend`, {});
}

// Helper function used by unsuspend gestionale user.
export function unsuspendGestionaleUser(userId) {
    return postJson(`/api/users/${userId}/unsuspend`, {});
}

// Deletes the data for gestionale user.
export function deleteGestionaleUser(userId) {
    return postJson(`/api/users/${userId}/delete/gestionale`, {});
}

// Disables the data used by mobile app user.
export function disableMobileAppUser(userId) {
    return postJson(`/api/users/${userId}/disable/app`, {});
}

// Deletes the data for mobile app user.
export function deleteMobileAppUser(userId) {
    return postJson(`/api/users/${userId}/delete/app`, {});
}