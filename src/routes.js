import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth'; // Hook para acceder al contexto de autenticación

// Layouts
import AdminLayout from '../layouts/AdminLayout'; // Suponiendo que existe un layout para Admin
import UserLayout from '../layouts/UserLayout';

// Pages
import Login from '../pages/Login';
import AdminDashboard from '../pages/admin/AdminDashboard'; // Suponiendo que existe
import UserAppointments from '../pages/user/Appointments';

// Componente para proteger rutas
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { auth } = useAuth();

    if (!auth.token) {
        // Si no está logueado, redirige a login
        return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(auth.user.role)) {
        // Si está logueado pero no tiene el rol permitido, redirige a una página de no autorizado o a login
        return <Navigate to="/login" />;
    }

    return children;
};

export default function AppRouter() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />

                {/* Rutas de Usuario */}
                <Route
                    path="/user"
                    element={
                        <ProtectedRoute allowedRoles={['usuario']}>
                            <UserLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="turnos" />} />
                    <Route path="turnos" element={<UserAppointments />} />
                </Route>

                {/* Rutas de Admin (Ejemplo) */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<AdminDashboard />} />
                    {/* ... otras rutas de admin */}
                </Route>

                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}