// Loads dashboard data and handles the one-time password reset modal opening.
import { useCallback, useEffect, useState } from 'react';
import { withLoader } from '../services/withLoader';
import { getDashboardData } from '../services/dashboardApi';

const PASSWORD_RESET_MODAL_STORAGE_KEY =
    'password-reset-requests-modal-shown';

// Manages the state and side effects for dashboard data.
export function useDashboardData(isSuperUser) {
    // Main state used by the page
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPasswordResetRequestsModal, setShowPasswordResetRequestsModal] =
        useState(false);
    // Memoized handler used by the page

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const result = await withLoader(
                'Caricamento dashboard…',
                async () => getDashboardData(),
                'nonBlocking',
            );

            setData(result);

            if (
                isSuperUser &&
                Array.isArray(result?.password_reset_requests) &&
                result.password_reset_requests.length > 0 &&
                !sessionStorage.getItem(PASSWORD_RESET_MODAL_STORAGE_KEY)
            ) {
                setShowPasswordResetRequestsModal(true);
                sessionStorage.setItem(PASSWORD_RESET_MODAL_STORAGE_KEY, '1');
            }
        } catch (error) {
            setData(null);
            setError(error?.message || 'Impossibile caricare la dashboard.');
        } finally {
            setLoading(false);
        }
    }, [isSuperUser]);
    // Load data when the component opens

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return {
        data,
        loading,
        error,
        fetchDashboard,
        showPasswordResetRequestsModal,
        setShowPasswordResetRequestsModal,
    };
}