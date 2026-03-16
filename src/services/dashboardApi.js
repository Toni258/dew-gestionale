// Frontend service helpers for dashboard api.
import { getJson } from './apiClient';

// Returns the data used by dashboard data.
export function getDashboardData() {
    return getJson('/api/dashboard');
}