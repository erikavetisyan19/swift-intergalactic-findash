import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
    const { currentUser, userRole, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Loading access...</div>;
    }

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // If manager tries to access dashboard, redirect to payroll where they below
        if (userRole === 'manager') {
            return <Navigate to="/payroll" replace />;
        }

        // Prevent infinite loop if fallback hits the exact same restricted route
        if (location.pathname === '/' || location.pathname === '/login') {
            return (
                <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ marginBottom: '1rem' }}>Unauthorized Access</h2>
                        <p>Your current role ({userRole}) does not have permission to view this page.</p>
                    </div>
                </div>
            );
        }

        return <Navigate to="/" replace />; // fallback
    }

    return children;
};
