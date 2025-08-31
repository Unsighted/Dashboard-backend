import express from 'express';
import { getConnection } from '../config/db.js';

const router = express.Router();

// Obtener todos los servicios
router.get('/', async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const query = 'SELECT * FROM clients ORDER BY idclients DESC';
    const clients = await conn.query(query);

    // Convertir la cadena de beneficios en un array para el frontend
    const clientsArray = clients.map(client => {
      try {
        return {
          ...client,
          // Asegurarse de que los beneficios sean un array
          idClients: parseInt(client.idclients, 10),
          name: client.name || '',
          phone: client.phone || '',
          email: client.email || '',
          address: client.address || ''
        };
      } catch (e) {
        console.error(`Error al parsear beneficios para el cliente ID ${client.idclients}:`, e);
        // Si hay un error en el JSON, devolver un array vacío para evitar que el frontend falle
        return {
          ...client,
          
        };
      }
    });

    res.json(clientsArray);
  } catch (error) {
    console.error('Error al obtener los servicios:', error);
    next(error);
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

// Crear un nuevo servicio
router.post('/', async (req, res, next) => {
  let conn;

  try {
    const { name, phone, email, address} = req.body;

    // Validación de campos
    if (!name || !phone || !email || !address) {
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    conn = await getConnection();

    const query = `
      INSERT INTO clients
      (name, phone, email, address) 
      VALUES (?, ?, ?, ?)
    `;
    
    const result = await conn.query(query, [
      name,
      phone,
      email,
      address
    ]);

    // Creamos el objeto para la respuesta, asegurando los tipos de datos correctos.
    const newClient = {
      name,
      phone,
      email,
      address
    };

    res.status(201).json({
      message: 'Cliente creado exitosamente',
      client: newClient
    });

  } catch (error) {
    console.error('Error al crear el cliente:', error);
    next(error);
  } finally {
    if (conn) conn.release();
  }
});

// Actualizar un servicio existente
router.put('/:id', async (req, res, next) => {
  let conn;
  const { id } = req.params;

  try {
    const { name, phone, email, address } = req.body;

    if (!name || !phone || !email || !address) {
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    conn = await getConnection();

    // Obtener el servicio actual para saber el nombre del archivo de imagen antiguo
    const existingClientRows = await conn.query('SELECT * FROM clients WHERE idclients = ?', [id]);

    if (existingClientRows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }

    const query = `
      UPDATE clients SET
      name = ?, phone = ?, email = ?, address = ?
      WHERE idclients = ?
    `;

    await conn.query(query, [
      name,
      phone,
      email,
      address,
      id
    ]);

    const updatedClient = {
      idclients: parseInt(id, 10), name, phone, email, address
    };

    res.json({ message: 'Cliente actualizado exitosamente', client: updatedClient });

  } catch (error) {
    console.error(`Error al actualizar el cliente con ID ${id.idclients}:`, error);
    next(error);
  } finally {
    if (conn) conn.release();
  }
});

// Eliminar un cliente
router.delete('/:id', async (req, res, next) => {
  let conn;
  const { id } = req.params;

  try {
    conn = await getConnection();

    // Verificar si el cliente existe
    const existingClientRows = await conn.query('SELECT * FROM clients WHERE idclients = ?', [id]);
    if (existingClientRows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }

    // Eliminar el cliente
    await conn.query('DELETE FROM clients WHERE idclients = ?', [id]);

    res.json({ message: 'Cliente eliminado exitosamente.' });
  } catch (error) {
    console.error(`Error al eliminar el cliente con ID ${id}:`, error);
    next(error);
  } finally {
    if (conn) conn.release();
  }
});


export const clientsRoutes = router;