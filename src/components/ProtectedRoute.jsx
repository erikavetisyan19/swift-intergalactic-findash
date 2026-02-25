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
        return <Navigate to="/" replace />; // fallback
    }

    return children;
};
