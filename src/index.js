import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { appointmentsRoutes } from './routes/appointmentsRoutes.js';
import { servicesRoutes } from './routes/servicesRoutes.js';
import { clientsRoutes } from './routes/clientsRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { usersRoutes } from './routes/usersRoutes.js';
import { suppliersRoutes } from './routes/suppliersRoutes.js';
import { logger } from './utils/logger.js';
import { checkAuth, checkRole } from './middleware/authMiddleware.js';
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Rutas públicas de autenticación
app.use('/api/auth', authRoutes);

// Middleware para proteger todas las rutas siguientes
app.use(checkAuth);

app.use('/api/appointments', checkRole(['user', 'admin']), appointmentsRoutes);
app.use('/api/services', checkRole(['user', 'admin']), servicesRoutes);
app.use('/api/clients', checkRole(['admin']), clientsRoutes);
app.use('/api/users', checkRole(['admin']), usersRoutes);
app.use('/api/suppliers', checkRole(['admin']), suppliersRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Algo salió mal!' });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto 🔥 ${port}`);
  logger.info(`🚀 Servidor escuchando en el puerto ${port}`);
  logger.info(`🔧 Modo: ${process.env.NODE_ENV || 'development'}`);
}); 