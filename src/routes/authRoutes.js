import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { getConnection } from '../config/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';

// Login
router.post('/', async (req, res, next) => {
  let conn;
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email y contraseña requeridos.' });
  try {
    conn = await getConnection();
    const users = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users.length) return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    // console.log(valid);
    
    
    if (!valid) return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    next(e);
  } finally {
    if (conn) conn.release();
  }
});

// Middleware de autenticación
export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Token requerido.' });
  const token = auth.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado.' });
  }
}

export const authRoutes = router;