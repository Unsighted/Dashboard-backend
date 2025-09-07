import React, { useState, useEffect } from 'react';
import { getAppointments } from '../../api/appointments'; // Función para llamar a la API
import useAuth from '../../hooks/useAuth';

export default function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { auth } = useAuth();

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const data = await getAppointments(auth.token);
                setAppointments(data);
            } catch (err) {
                setError('No se pudieron cargar los turnos.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (auth.token) {
            fetchAppointments();
        }
    }, [auth.token]);

    if (loading) return <p>Cargando turnos...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div>
            <h1>Mis Turnos</h1>
            {appointments.length > 0 ? (
                <ul>{appointments.map(app => (<li key={app._id}>{new Date(app.date).toLocaleString()} - {app.service.name}</li>))}</ul>
            ) : (<p>No tienes turnos agendados.</p>)}
        </div>
    );
}