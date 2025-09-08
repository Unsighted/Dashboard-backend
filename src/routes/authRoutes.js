import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { getConnection } from '../config/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';
const JWT_SECRET_REFRESH = process.env.JWT_SECRET_REFRESH || 'megasupersecreto';

// Login
router.post('/login', async (req, res, next) => {
  let conn;
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email y contraseña requeridos.' });
  try {
    conn = await getConnection();
    const users = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users.length) return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    
    if (!valid) return res.status(401).json({
      message: 'Usuario o contraseña incorrectos.'
    });

    const token = jwt.sign({id: user.id, email: user.email, name: user.name, role: user.role
    }, JWT_SECRET, {
      expiresIn: '15m' // Token de acceso de corta duración
    });

    // Generar el Refresh Token (expira más tarde)
    const refreshToken = jwt.sign({id: user.id}, JWT_SECRET_REFRESH, {
        expiresIn: '7d' 
    });

    // Guardar el refresh token en la base de datos para el usuario
    // Esto permite invalidarlo si es necesario (ej. logout, cambio de contraseña)
    await conn.query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);

    res.json({token, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role }});
  } catch (e) {
    next(e);
  } finally {
    if (conn) conn.release();
  }
});

// Refresh Token
router.post('/refresh', async (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ message: 'No se proporcionó refresh token.' });
    }

    let conn;
    try {
        conn = await getConnection();
        
        // Verificar el refresh token
        const decoded = jwt.verify(refreshToken, JWT_SECRET_REFRESH);
        
        // Buscar el usuario y verificar que el refresh token coincida con el de la BD
        const users = await conn.query('SELECT * FROM users WHERE id = ? AND refresh_token = ?', [decoded.id, refreshToken]);
        
        if (!users.length) {
            return res.status(403).json({ message: 'Refresh token no válido o revocado.' });
        }

        const user = users[0];

        // Generar un nuevo access token
        const newAccessToken = jwt.sign(
            { id: user.id, email: user.email, name: user.name, role: user.role },
            JWT_SECRET,
            { expiresIn: '15m' } // Token de acceso de corta duración
        );

        res.json({ token: newAccessToken });

    } catch (error) {
        // Si el token es inválido (expirado, malformado, etc.)
        return res.status(403).json({ message: 'Refresh token no válido o expirado.' });
    } finally {
        if (conn) conn.release();
    }
});

// Logout
router.post('/logout', async (req, res, next) => {
    const { userId } = req.body; // El frontend debería enviar el ID del usuario
    if (!userId) {
        return res.status(400).json({ message: 'ID de usuario requerido.' });
    }

    let conn;
    try {
        conn = await getConnection();
        // Invalidar el refresh token en la base de datos
        await conn.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [userId]);
        res.status(200).json({ message: 'Sesión cerrada exitosamente.' });
    } catch (error) {
        next(error);
    } finally {
        if (conn) conn.release();
    }
});

export const authRoutes = router;