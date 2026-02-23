import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
    const { loading, isAuthenticated } = useAuth();
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

    return <Outlet />;
}
