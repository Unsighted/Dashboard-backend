import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { login as loginApi } from '../api/auth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await loginApi({ email, password });
            login(response.token, response.user);

            if (response.user.role === 'admin') {
                navigate('/admin');
            } else if (response.user.role === 'usuario') {
                navigate('/user');
            } else {
                navigate('/login');
            }
        } catch (err) {
            setError('Error al iniciar sesión. Verifique sus credenciales.');
            console.error(err);
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit}>
                <h2>Iniciar Sesión</h2>
                {error && <p className="error">{error}</p>}
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        type="email" id="email" value={email}
                        onChange={(e) => setEmail(e.target.value)} required
                    />
                </div>
                <div>
                    <label htmlFor="password">Contraseña</label>
                    <input
                        type="password" id="password" value={password}
                        onChange={(e) => setPassword(e.target.value)} required
                    />
                </div>
                <button type="submit">Ingresar</button>
            </form>
        </div>
    );
}