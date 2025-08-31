import express from 'express';
import { authRoutes } from './routes/authRoutes.js';
import { usersRoutes } from './routes/usersRoutes.js';


const app = express();

app.use(express.json());

app.use('/api/auth/login', authRoutes);
app.use('/api/users', usersRoutes);


export default app;