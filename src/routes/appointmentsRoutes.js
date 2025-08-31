import express from 'express';
import { getConnection } from '../config/db.js';

const router = express.Router();

// Middleware para parsear JSON en el cuerpo de las solicitudes
router.use(express.json());


router.get('/', async (req, res) => {
  
  let conn;

  try {
    conn = await getConnection();
    console.log('Database connection established');

    const $query = `
      SELECT * FROM appointments
    `;

    const rows = await conn.query($query);
    res.status(200).json(rows);

  } catch (error) {
    console.error('', error);
  } finally {
    if (conn) conn.release();
  }
});

router.post('/', async (req, res) => {
  let conn;
  const { clientName, service, date, time, duration, price, phone, email } = req.body;

  if (!clientName || !service || !date || !time || !duration || !price || !phone || !email) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    conn = await getConnection();
    console.log('Database connection established');

    const $query = `
      INSERT INTO appointments (clientName, service, date, time, duration, price, phone, email, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    let create = await conn.query($query, [clientName, service, date, time, duration, price, phone, email, 'Pendiente']);

    if (create.affectedRows > 0) {
      res.status(201).json({ message: 'Cita creada exitosamente.' });
    } else {
      res.status(500).json({ error: 'Error al crear la cita.' });
    }

  } catch (error) {
    console.error('Error al crear la cita:', error);
    res.status(500).json({ error: 'Error al crear la cita.' });
  } finally {
    if (conn) conn.release();
  }
});


router.put('/:id', async (req, res) => {
  let conn;

  const { clientName, service, date, time, duration, price, phone, email, status } = req.body;
  const { id } = req.params;


  if (!clientName || !service || !date || !time || !duration || !price || !phone || !email || !status) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    conn = await getConnection();

    console.log('Database connection established');

    const dateObject = new Date(date);
    const formattedDate = dateObject.toISOString().split('T')[0];

    const $query = `
      UPDATE appointments
      SET clientName = ?, service = ?, date = ?, time = ?, duration = ?, price = ?, phone = ?, email = ?, status = ?
      WHERE id_appointment = ?
    `;

    let update = await conn.query($query, [clientName, service, formattedDate, time, duration, price, phone, email, status, id]);

    if (update.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Cita no encontrada.' });
    }

    if (update.affectedRows > 0) {
      return res.status(200).json({ status: 'success', message: 'Cita actualizada exitosamente.' });
    } else {
      return res.status(500).json({ status: 'error', message: 'Error al actualizar la cita.' });
    }

  } catch (error) {
    console.error('', error);
    res.status(500).json({ status: 'error', message: 'Error interno del servidor al obtener datos.' });
  } finally {
    if (conn) conn.release();
  }
});

router.patch('/:id/status', async (req, res) => {
  let conn;
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'El campo de estado es obligatorio.' });
  }

  const validStatuses = ['Confirmado', 'Pendiente', 'Cancelado', 'Completado'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Valor de estado no válido.' });
  }

  try {
    conn = await getConnection();

    const $query = `
      UPDATE appointments
      SET status = ?
      WHERE id_appointment = ?
    `;

    const update = await conn.query($query, [status, id]);

    if (update.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Cita no encontrada.' });
    }

    res.status(200).json({ status: 'success', message: 'Estado de la cita actualizado exitosamente.' });
  } catch (error) {
    console.error('Error al actualizar el estado de la cita:', error);
    res.status(500).json({ status: 'error', message: 'Error interno del servidor al actualizar el estado.' });
  } finally {
    if (conn) conn.release();
  }
});

// Eliminar una cita
router.delete('/:id', async (req, res, next) => {
  let conn;
  const { id } = req.params;

  try {
    conn = await getConnection();

    // Verificar si la cita existe
    const existingAppointment = await conn.query('SELECT * FROM appointments WHERE id_appointment = ?', [id]);
    if (existingAppointment.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada.' });
    }

    // Eliminar la cita
    await conn.query('DELETE FROM appointments WHERE id_appointment = ?', [id]);

    res.json({ message: 'Cita eliminada exitosamente.' });
  } catch (error) {
    console.error(`Error al eliminar la cita con ID ${id}:`, error);
    next(error);
  } finally {
    if (conn) conn.release();
  }
});

export const appointmentsRoutes = router;