import mysql from 'mysql2/promise';

if (process.env.DB_PASSWORD === undefined) {
  throw new Error('DB_PASSWORD must be set explicitly in backend/.env. Use an empty value only if the local XAMPP account has no password.');
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'barangay_security_db',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

export async function checkDatabaseConnection() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
