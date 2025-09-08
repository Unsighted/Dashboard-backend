import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const secret = process.env.JWT_SECRET;

export const checkAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'No se proporcionó token, autorización denegada' });
    }

    try {
        const decoded = jwt.verify(token, secret);
        
        req.user = decoded; // Agrega el payload del token (id, role) a la request
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token no es válido' });
    }
};

export const checkRole = (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'No tienes permiso para acceder a este recurso' });
    }
    next();
};