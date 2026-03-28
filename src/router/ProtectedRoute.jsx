// Routing component for protected.
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roles = [] }) {
    const { loading, isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (loading) return null; // oppure spinner

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ reason: 'auth_required', from: location.pathname }}
            />
        );
    }

    if (roles.length > 0 && !roles.includes(user?.role)) {
        return (
            <Navigate
                to="/forbidden"
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    return <Outlet />;
}
