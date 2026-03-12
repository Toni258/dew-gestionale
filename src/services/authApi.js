import { getJson, postJson } from './apiClient';

export function login(email, password) {
    return postJson('/api/auth/login', { email, password });
}

export function me() {
    return getJson('/api/auth/me');
}

export function logout() {
    return postJson('/api/auth/logout', {});
}

export function changePassword(currentPassword, newPassword) {
    return postJson('/api/auth/change-password', {
        currentPassword,
        newPassword,
    });
}

export function requestPasswordReset(email) {
    return postJson('/api/auth/request-password-reset', {
        email,
    });
}
