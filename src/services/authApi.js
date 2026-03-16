// Frontend service helpers for auth api.
import { getJson, postJson } from './apiClient';

// Helper function used by login.
export function login(email, password) {
    return postJson('/api/auth/login', { email, password });
}

// Helper function used by me.
export function me() {
    return getJson('/api/auth/me');
}

// Helper function used by logout.
export function logout() {
    return postJson('/api/auth/logout', {});
}

// Helper function used by change password.
export function changePassword(currentPassword, newPassword) {
    return postJson('/api/auth/change-password', {
        currentPassword,
        newPassword,
    });
}

// Helper function used by request password reset.
export function requestPasswordReset(email) {
    return postJson('/api/auth/request-password-reset', {
        email,
    });
}