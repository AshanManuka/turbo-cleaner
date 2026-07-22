require('dotenv').config();

const crypto = require('crypto');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { pool, initializeDatabase } = require('./src/database');
const { verifyPassword, createSession, authenticate, revokeSession } = require('./src/auth');
const { allPaths, renderSeoPage } = require('./src/seoPages');
const seoPathSet = new Set(allPaths);

const PORT = Number(process.env.PORT) || 3001;
const PUBLIC_DIR = path.resolve(__dirname);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const MAX_BODY_BYTES = 20 * 1024;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const loginAttempts = new Map();

const PUBLIC_FILES = new Set([
  '/index.html', '/login.html', '/robots.txt', '/sitemap.xml',
  '/google3cf418453ff29223.html', '/img/logoImg.png', '/img/bgOne.png',
]);

function securityHeaders(extra = {}) {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; connect-src 'self' https://www.google-analytics.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    ...extra,
  };
}

function sendJSON(res, status, body, extra = {}) {
  res.writeHead(status, securityHeaders({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    ...extra,
  }));
  res.end(JSON.stringify(body));
}

function readJSON(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        const error = new Error('Request body is too large');
        error.status = 413;
        reject(error);
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { const error = new Error('Invalid JSON'); error.status = 400; reject(error); }
    });
    req.on('error', reject);
  });
}

function clientIp(req) {
  return req.socket.remoteAddress || 'unknown';
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; }
  catch { return false; }
}

function cleanString(value, max, required = false) {
  if (typeof value !== 'string') return required ? null : '';
  const cleaned = value.trim();
  if ((required && !cleaned) || cleaned.length > max) return null;
  return cleaned;
}

function validateQuote(body) {
  const quote = {
    name: cleanString(body.name, 120, true),
    phone: cleanString(body.phone, 40, true),
    email: cleanString(body.email, 254),
    service: cleanString(body.service, 120, true),
    address: cleanString(body.address, 500, true),
    details: cleanString(body.details, 5000),
  };
  if (Object.values(quote).some((value) => value === null)) return null;
  if (quote.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quote.email)) return null;
  return quote;
}

function rateLimited(ip) {
  const now = Date.now();
  const attempts = (loginAttempts.get(ip) || []).filter((time) => now - time < LOGIN_WINDOW_MS);
  loginAttempts.set(ip, attempts);
  return attempts.length >= LOGIN_MAX_ATTEMPTS;
}

function recordFailedLogin(ip) {
  const attempts = loginAttempts.get(ip) || [];
  attempts.push(Date.now());
  loginAttempts.set(ip, attempts);
}

function mimeType(filePath) {
  return ({ '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8' })[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function sendFile(res, filePath, noIndex = false) {
  fs.readFile(filePath, (error, data) => {
    if (error) return sendJSON(res, 404, { error: 'Not found' });
    res.writeHead(200, securityHeaders({
      'Content-Type': mimeType(filePath),
      ...(noIndex ? { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive' } : {}),
    }));
    res.end(data);
  });
}

function sendHTML(res, html) {
  res.writeHead(200, securityHeaders({ 'Content-Type': 'text/html; charset=utf-8' }));
  res.end(html);
}

async function requireAdmin(req, res) {
  const session = await authenticate(req);
  if (!session) sendJSON(res, 401, { success: false, error: 'Unauthorized' });
  return session;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'POST' && !sameOrigin(req)) {
      return sendJSON(res, 403, { success: false, error: 'Invalid request origin' });
    }

    if (url.pathname === '/api/quote' && req.method === 'POST') {
      const quote = validateQuote(await readJSON(req));
      if (!quote) return sendJSON(res, 400, { success: false, error: 'Invalid submission data' });
      const id = crypto.randomUUID();
      await pool.execute(
        `INSERT INTO submissions (id, name, phone, email, service, address, details, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, quote.name, quote.phone, quote.email || null, quote.service, quote.address, quote.details || null, clientIp(req)]
      );
      return sendJSON(res, 201, { success: true, id });
    }

    if (url.pathname === '/api/login' && req.method === 'POST') {
      const ip = clientIp(req);
      if (rateLimited(ip)) return sendJSON(res, 429, { success: false, error: 'Too many login attempts. Try again later.' });
      const { password } = await readJSON(req);
      if (!verifyPassword(password)) {
        recordFailedLogin(ip);
        return sendJSON(res, 401, { success: false, error: 'Invalid credentials' });
      }
      loginAttempts.delete(ip);
      const token = await createSession(ip, req.headers['user-agent']);
      const cookie = `admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${IS_PRODUCTION ? '; Secure' : ''}`;
      return sendJSON(res, 200, { success: true }, { 'Set-Cookie': cookie });
    }

    if (url.pathname === '/api/logout' && req.method === 'POST') {
      await revokeSession(req);
      return sendJSON(res, 200, { success: true }, {
        'Set-Cookie': `admin_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${IS_PRODUCTION ? '; Secure' : ''}`,
      });
    }

    if (url.pathname.startsWith('/api/submissions')) {
      if (!await requireAdmin(req, res)) return;

      if (url.pathname === '/api/submissions' && req.method === 'GET') {
        const [rows] = await pool.execute(
          `SELECT id, received_at AS receivedAt, status, name, phone, email, service, address, details
           FROM submissions ORDER BY received_at DESC LIMIT 1000`
        );
        return sendJSON(res, 200, rows);
      }

      if (url.pathname === '/api/submissions/toggle' && req.method === 'POST') {
        const { id } = await readJSON(req);
        if (typeof id !== 'string') return sendJSON(res, 400, { success: false, error: 'Invalid id' });
        const [result] = await pool.execute(
          `UPDATE submissions SET status = IF(status = 'read', 'unread', 'read') WHERE id = ?`, [id]
        );
        if (!result.affectedRows) return sendJSON(res, 404, { success: false, error: 'Not found' });
        const [[row]] = await pool.execute('SELECT status FROM submissions WHERE id = ?', [id]);
        return sendJSON(res, 200, { success: true, status: row.status });
      }

      if (url.pathname === '/api/submissions' && req.method === 'DELETE') {
        await pool.execute('DELETE FROM submissions');
        return sendJSON(res, 200, { success: true });
      }
      return sendJSON(res, 405, { error: 'Method not allowed' }, { Allow: 'GET, POST, DELETE' });
    }

    if (url.pathname === '/submissions.html') {
      if (!await authenticate(req)) {
        res.writeHead(302, securityHeaders({ Location: '/login.html', 'Cache-Control': 'no-store' }));
        return res.end();
      }
      return sendFile(res, path.join(PUBLIC_DIR, 'submissions.html'), true);
    }

    if (req.method === 'GET') {
      const seoPage = renderSeoPage(url.pathname);
      if (seoPage) return sendHTML(res, seoPage);
      if (!url.pathname.endsWith('/') && seoPathSet.has(`${url.pathname}/`)) {
        res.writeHead(301, securityHeaders({ Location: `${url.pathname}/${url.search}` }));
        return res.end();
      }
    }

    const publicPath = url.pathname === '/' ? '/index.html' : url.pathname;
    if (!PUBLIC_FILES.has(publicPath)) return sendJSON(res, 404, { error: 'Not found' });
    return sendFile(res, path.join(PUBLIC_DIR, publicPath.slice(1)), publicPath === '/login.html');
  } catch (error) {
    console.error(error);
    if (!res.headersSent) sendJSON(res, error.status || 500, { success: false, error: error.status ? error.message : 'Internal server error' });
  }
});

async function start() {
  await initializeDatabase();
  server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});

module.exports = { server, validateQuote };
