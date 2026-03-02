import { getJson, postJson, putJson, delJson } from './apiClient';

export function checkEmailExists(email) {
    const qs = new URLSearchParams({ email: (email ?? '').trim() });
    return getJson(`/api/users/emailExists?${qs.toString()}`);
    // atteso: { exists: boolean }
}

export function createUserGestionale(payload) {
    return postJson('/api/users/create/gestionale', payload);
    // atteso: { ok: true, userId: number }
}
