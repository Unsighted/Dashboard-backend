import mariadb from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

const pool = mariadb.createPool({
  host: process.env.MARIADB_HOST,
  port: parseInt(process.env.MARIADB_PORT),
  user: process.env.MARIADB_USER,
  password: process.env.MARIADB_PASSWORD,
  database: process.env.MARIADB_DATABASE,
  connectionLimit: 5
});

export async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (err) {
    console.error("No se pudo obtener una conexión de la base de datos. Revisa tu configuración .env y si el servidor de la base de datos está funcionando.", err);
    throw err; // Relanzar el error para que sea manejado por la ruta
  }
}

export default pool; 