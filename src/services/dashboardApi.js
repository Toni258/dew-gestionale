import { getJson } from './apiClient';

export function getDashboardData() {
    return getJson('/api/dashboard');
}
