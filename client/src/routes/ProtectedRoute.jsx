// client/src/routes/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({
    children,
    allowedRoles,
}) => {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                        Checking authentication...
                    </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    // Normalize allowedRoles
    const normalizedAllowedRoles = Array.isArray(allowedRoles)
        ? allowedRoles
            .filter((role) => typeof role === 'string')
            .map((role) => role.trim().toUpperCase())
            .filter(Boolean)
        : [];

    // If no role restrictions, allow access
    if (normalizedAllowedRoles.length === 0) {
        return children;
    }

    const userRole = typeof user?.role === 'string'
        ? user.role.trim().toUpperCase()
        : '';

    // ADMIN always has access to all routes
    const hasRequiredRole =
        userRole === 'ADMIN' ||
        normalizedAllowedRoles.includes(userRole);

    if (!hasRequiredRole) {
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }

    return children;
};

export default ProtectedRoute;