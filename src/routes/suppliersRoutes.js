import express from 'express';
import { getConnection } from '../config/db.js';

const router = express.Router();

// Obtener todos los proveedores
router.get('/', async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const suppliers = await conn.query('SELECT * FROM suppliers ORDER BY id DESC');
    // Si tienes campos JSON (como contact), conviértelos aquí si es necesario
    res.json(suppliers);
  } catch (e) {
    next(e);
  } finally {
    if (conn) conn.release();
  }
});

// Crear proveedor
router.post('/', async (req, res, next) => {
  let conn;
  try {
    const {
      name,
      category,
      products,
      lastOrder,
      rating,
      contact,
      yearsWorking,
      paymentTerms,
      totalValue,
      status
    } = req.body;

    conn = await getConnection();
    await conn.query(
      `INSERT INTO suppliers 
        (name, category, products, lastOrder, rating, phone, email, address, yearsWorking, paymentTerms, totalValue, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        category,
        products,
        lastOrder,
        rating,
        contact?.phone || '',
        contact?.email || '',
        contact?.address || '',
        yearsWorking,
        paymentTerms,
        totalValue,
        status
      ]
    );
    res.status(201).json({ message: 'Proveedor creado exitosamente.' });
  } catch (e) {
    next(e);
  } finally {
    if (conn) conn.release();
  }
});

// Actualizar proveedor
router.put('/:id', async (req, res, next) => {
  let conn;
  try {
    const { id } = req.params;
    const {
      name,
      category,
      products,
      lastOrder,
      rating,
      contact,
      yearsWorking,
      paymentTerms,
      totalValue,
      status
    } = req.body;

    conn = await getConnection();
    await conn.query(
      `UPDATE suppliers SET 
        name=?, category=?, products=?, lastOrder=?, rating=?, phone=?, email=?, address=?, yearsWorking=?, paymentTerms=?, totalValue=?, status=?
      WHERE id=?`,
      [
        name,
        category,
        products,
        lastOrder,
        rating,
        contact?.phone || '',
        contact?.email || '',
        contact?.address || '',
        yearsWorking,
        paymentTerms,
        totalValue,
        status,
        id
      ]
    );
    res.json({ message: 'Proveedor actualizado exitosamente.' });
  } catch (e) {
    next(e);
  } finally {
    if (conn) conn.release();
  }
});

// Eliminar proveedor
router.delete('/:id', async (req, res, next) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await getConnection();
    await conn.query('DELETE FROM suppliers WHERE id=?', [id]);
    res.json({ message: 'Proveedor eliminado exitosamente.' });
  } catch (e) {
    next(e);
  } finally {
    if (conn) conn.release();
  }
});

export const suppliersRoutes = router;
