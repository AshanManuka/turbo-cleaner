const mysql = require('mysql2/promise');
const fs = require('fs');

const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Missing database configuration: ${missing.join(', ')}`);

function sslConfig() {
  if (process.env.DB_SSL !== 'true') return undefined;
  if (!process.env.DB_SSL_CA) throw new Error('DB_SSL_CA is required when DB_SSL=true');
  return { ca: fs.readFileSync(process.env.DB_SSL_CA, 'utf8'), rejectUnauthorized: true };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE) || 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  ssl: sslConfig(),
});

async function initializeDatabase() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS submissions (
    id CHAR(36) PRIMARY KEY,
    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('unread', 'read') NOT NULL DEFAULT 'unread',
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    email VARCHAR(254) NULL,
    service VARCHAR(120) NOT NULL,
    address VARCHAR(500) NOT NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    INDEX idx_submissions_received_at (received_at),
    INDEX idx_submissions_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await pool.execute(`CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash CHAR(64) PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    INDEX idx_admin_sessions_expires_at (expires_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await pool.execute('DELETE FROM admin_sessions WHERE expires_at <= NOW()');
}

module.exports = { pool, initializeDatabase };
