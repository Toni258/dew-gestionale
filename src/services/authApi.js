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
