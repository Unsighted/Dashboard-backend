import express from 'express';
import { getConnection } from '../config/db.js';
import upload from '../middleware/upload.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Obtener __dirname para ES Modules, necesario para construir rutas de archivos.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Obtener todos los servicios
router.get('/', async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const query = 'SELECT * FROM services ORDER BY idservices DESC';
    const services = await conn.query(query);

    // Convertir la cadena de beneficios en un array para el frontend
    const servicesWithBenefitsArray = services.map(service => {
      try {
        return {
          ...service,
          // Asegurarse de que los beneficios sean un array
          idServices: parseInt(service.idservices, 10),
          benefits: JSON.parse(service.benefits || '[]'),
          price: parseFloat(service.price),
          original_price: parseFloat(service.original_price),
          duration: parseInt(service.duration, 10),
          rating: parseFloat(service.rating),
          reservations: parseInt(service.reservations, 10)
        };
      } catch (e) {
        console.error(`Error al parsear beneficios para el servicio ID ${service.idservices}:`, e);
        // Si hay un error en el JSON, devolver un array vacío para evitar que el frontend falle
        return {
          ...service,
          benefits: []
        };
      }
    });

    res.json(servicesWithBenefitsArray);
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
router.post('/', upload.single('image'), async (req, res, next) => {
  let conn;
  const imageFile = req.file;

  try {
    const { name, price, original_price, duration, category, benefits, availability } = req.body;

    // Validación de campos
    if (!name || !price || !original_price || !duration || !category || !benefits || !imageFile || !availability) {
      // Si se subió un archivo pero la validación falla, lo eliminamos.
      if (imageFile) {
        await fs.unlink(imageFile.path);
      }
      return res.status(400).json({ message: 'Todos los campos, incluida la imagen, son requeridos.' });
    }


    // Los beneficios probablemente vienen como un string JSON desde el FormData, o como un array.
    // Nos aseguramos de guardarlo como un string JSON.
    const benefitsString = typeof benefits === 'string' ? benefits : JSON.stringify(benefits);

    conn = await getConnection();

    const query = `
      INSERT INTO services 
      (name, price, original_price, duration, category, benefits, image, availability) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await conn.query(query, [
      name,
      parseFloat(price),
      parseFloat(original_price),
      parseInt(duration, 10),
      category,
      benefitsString,
      imageFile.filename, // Guardamos el nombre del archivo subido
      availability
    ]);

    // Creamos el objeto para la respuesta, asegurando los tipos de datos correctos.
    const newService = {
      name,
      price: parseFloat(price),
      original_price: parseFloat(original_price),
      duration: parseInt(duration, 10),
      category,
      benefits: JSON.parse(benefitsString), // Lo parseamos de nuevo para la respuesta.
      image: imageFile.filename,
      availability
    };

    res.status(201).json({
      message: 'Servicio creado exitosamente',
      service: newService
    });

  } catch (error) {
    console.error('Error al crear el servicio:', error);
    // Si se subió un archivo pero ocurrió un error en la BD, lo eliminamos.
    if (imageFile) {
      try {
        await fs.unlink(imageFile.path);
      } catch (unlinkError) {
        console.error('Error al eliminar el archivo después de un fallo en la BD:', unlinkError);
      }
    }
    next(error);
  } finally {
    if (conn) conn.release();
  }
});

// Actualizar un servicio existente
router.put('/:id', upload.single('image'), async (req, res, next) => {
  let conn;
  const { id } = req.params;
  const imageFile = req.file;

  try {
    const { name, price, original_price, duration, category, benefits, availability } = req.body;

    // Validación de campos (la imagen es opcional en la actualización)
    if (!name || !price || !original_price || !duration || !category || !benefits || !availability) {
      // Si se subió un archivo pero la validación falla, lo eliminamos.
      if (imageFile) {
        await fs.unlink(imageFile.path);
      }
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    conn = await getConnection();

    // Obtener el servicio actual para saber el nombre del archivo de imagen antiguo
    const existingServiceRows = await conn.query('SELECT image FROM services WHERE idservices = ?', [id]);

    if (existingServiceRows.length === 0) {
      if (imageFile) {
        await fs.unlink(imageFile.path);
      }
      return res.status(404).json({ message: 'Servicio no encontrado.' });
    }
    const oldImageFilename = existingServiceRows[0].image;

    // Preparar los datos para la actualización
    const benefitsString = typeof benefits === 'string' ? benefits : JSON.stringify(benefits);
    const imageName = imageFile ? imageFile.filename : oldImageFilename;

    const query = `
      UPDATE services SET
      name = ?, price = ?, original_price = ?, duration = ?, category = ?, 
      benefits = ?, image = ?, availability = ?
      WHERE idservices = ?
    `;

    await conn.query(query, [
      name,
      parseFloat(price),
      parseFloat(original_price),
      parseInt(duration, 10),
      category,
      benefitsString,
      imageName,
      availability,
      id
    ]);

    // Si se subió una nueva imagen y es diferente a la anterior, eliminar la antigua
    if (imageFile && oldImageFilename && oldImageFilename !== imageFile.filename) {
      const oldImagePath = path.join(__dirname, '..', 'uploads', oldImageFilename);
      try {
        await fs.unlink(oldImagePath);
      } catch (unlinkError) {
        // No fallar la solicitud, solo loguear el error.
        console.error(`Error al eliminar la imagen antigua ${oldImageFilename}:`, unlinkError);
      }
    }

    const updatedService = {
      idservices: parseInt(id, 10), name, price: parseFloat(price),
      original_price: parseFloat(original_price), duration: parseInt(duration, 10),
      category, benefits: JSON.parse(benefitsString), image: imageName, availability
    };

    res.json({ message: 'Servicio actualizado exitosamente', service: updatedService });

  } catch (error) {
    console.error(`Error al actualizar el servicio con ID ${id}:`, error);
    if (imageFile) {
      try {
        await fs.unlink(imageFile.path);
      } catch (unlinkError) {
        console.error('Error al eliminar el archivo después de un fallo en la BD:', unlinkError);
      }
    }
    next(error);
  } finally {
    if (conn) conn.release();
  }
});

// Servir una imagen específica
router.get('/image/:filename', (req, res) => {
  const { filename } = req.params;

  // La carpeta 'uploads' se asume que está en la raíz del proyecto backend, al mismo nivel que 'src'
  const imagePath = path.join(__dirname, '..', 'uploads', filename);

  res.sendFile(imagePath, (err) => {
    if (err) {
      console.error(`Error al intentar servir la imagen: ${filename}`, err);
      // Evita enviar una cabecera de respuesta si ya se envió una.
      if (!res.headersSent) {
        res.status(404).json({ message: 'Imagen no encontrada.' });
      }
    }
  });
});

// Eliminar un servicio
router.delete('/:id', async (req, res, next) => {
  let conn;
  const { id } = req.params;

  try {
    conn = await getConnection();

    // Verificar si el servicio existe
    const existingService = await conn.query('SELECT * FROM services WHERE idservices = ?', [id]);
    if (existingService.length === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado.' });
    }

    // Eliminar el servicio
    await conn.query('DELETE FROM services WHERE idservices = ?', [id]);

    res.json({ message: 'Servicio eliminado exitosamente.' });
  } catch (error) {
    console.error(`Error al eliminar el servicio con ID ${id}:`, error);
    next(error);
  } finally {
    if (conn) conn.release();
  }
});

export const servicesRoutes = router;