import express from 'express';
import bcrypt from 'bcrypt';
import { getConnection } from '../config/db.js';
import { authMiddleware } from './authRoutes.js';

const router = express.Router();

// Obtener todos los usuarios (protegido)
router.get('/', authMiddleware, async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const users = await conn.query('SELECT id, name, email, role FROM users ORDER BY id DESC');
    res.json(users);
  } catch (e) {
    next(e);
  } finally {
    if (conn) conn.release();
  }
});

// Crear usuario (protegido)
router.post('/', authMiddleware, async (req, res, next) => {
  let conn;
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    conn = await getConnection();
    const exists = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) return res.status(409).json({ message: 'El email ya está registrado.' });
    const hash = await bcrypt.hash(password, 12);
    await conn.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hash, role || 'user']);
    res.status(201).json({ message: 'Usuario creado exitosamente.' });
  } catch (e) {
    next(e);
  } finally {
    if (conn) conn.release();
  }
});

// Actualizar usuario (protegido)
router.put('/:id', authMiddleware, async (req, res, next) => {
  let conn;
  const { id } = req.params;
  try {
    const { name, email, password, role } = req.body;
    conn = await getConnection();
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await conn.query('UPDATE users SET name=?, email=?, password=?, role=? WHERE id=?', [name, email, hash, role, id]);
    } else {
      await conn.query('UPDATE users SET name=?, email=?, role=? WHERE id=?', [name, email, role, id]);
    }
    res.json({ message: 'Usuario actualizado exitosamente.' });
  } catch (e) {
    next(e);
  } finally {
    if (conn) conn.release();
  }
});

// Eliminar usuario (protegido)
router.delete('/:id', authMiddleware, async (req, res, next) => {
  let conn;
  const { id } = req.params;
  try {
    conn = await getConnection();
    await conn.query('DELETE FROM users WHERE id=?', [id]);
    res.json({ message: 'Usuario eliminado exitosamente.' });
  } catch (e) {
    next(e);
  } finally {
    if (conn) conn.release();
  }
});

export const usersRoutes = router;