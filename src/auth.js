const crypto = require('crypto');

const SESSION_HOURS = 8;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((part) => {
    const index = part.indexOf('=');
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }));
}

function verifyPassword(password) {
  if (typeof password !== 'string' || !process.env.ADMIN_PASSWORD_HASH) return false;
  const [algorithm, saltHex, expectedHex] = process.env.ADMIN_PASSWORD_HASH.split('$');
  if (algorithm !== 'scrypt' || !saltHex || !expectedHex) return false;
  try {
    const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64);
    const expected = Buffer.from(expectedHex, 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch { return false; }
}

async function createSession(ip, userAgent) {
  const { pool } = require('./database');
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  await pool.execute(
    'INSERT INTO admin_sessions (token_hash, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?)',
    [hashToken(token), expiresAt, ip || null, String(userAgent || '').slice(0, 500) || null]
  );
  return token;
}

async function authenticate(req) {
  const { pool } = require('./database');
  const token = parseCookies(req).admin_token;
  if (!token || token.length > 100) return null;
  const [rows] = await pool.execute(
    'SELECT token_hash, expires_at FROM admin_sessions WHERE token_hash = ? AND expires_at > NOW() LIMIT 1',
    [hashToken(token)]
  );
  return rows[0] || null;
}

async function revokeSession(req) {
  const { pool } = require('./database');
  const token = parseCookies(req).admin_token;
  if (token && token.length <= 100) await pool.execute('DELETE FROM admin_sessions WHERE token_hash = ?', [hashToken(token)]);
}

function makePasswordHash(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

module.exports = { verifyPassword, createSession, authenticate, revokeSession, makePasswordHash };
