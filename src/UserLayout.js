import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function UserLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="user-layout">
            <nav className="sidebar">
                <h2>Nails App</h2>
                <ul>
                    <li><Link to="/user/turnos">Turnos</Link></li>
                </ul>
                <button onClick={handleLogout}>Cerrar Sesión</button>
            </nav>
            <main className="content"><Outlet /></main>
        </div>
    );
}