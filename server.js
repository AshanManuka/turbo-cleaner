/*
  Simple Node.js HTTP server that:
  - serves static files from this folder
  - saves form submissions to submissions.json
  - sends email notifications on form submit

  Run:
    node server.js

  Visit:
    http://<droplet-ip>:3000/          (landing page)
*/

require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');
const { getTransporter, verifyTransporter } = require('./transporter');

const PORT = process.env.PORT || 3001;
const PUBLIC_DIR = path.resolve(__dirname);
const DATA_FILE = path.join(PUBLIC_DIR, 'submissions.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Pesh@18SriLanka';

// Email config
const BUSINESS_EMAIL = 'info@turboglowcleaning.com.au';
const DEFAULT_FROM = `TurboGlow Cleaning <${BUSINESS_EMAIL}>`;

verifyTransporter();

function safeJoin(base, target) {
  const targetPath = '.' + path.normalize('/' + target);
  return path.join(base, targetPath);
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
  };
  return map[ext] || 'application/octet-stream';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }
  return list;
}

function isAuthenticated(req) {
  const cookies = parseCookies(req);
  return cookies.admin_session === ADMIN_PASSWORD;
}

function readSubmissions() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeSubmissions(list) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write submissions', err);
  }
}

function sendJSON(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
  });
  res.end(JSON.stringify(data));
}

function sendFile(res, filePath, extraHeaders = {}) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
      });
      res.end('404: Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': getMimeType(filePath), ...extraHeaders });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url, 'http://localhost');
  } catch (err) {
    res.writeHead(400, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    });
    res.end('400: Bad request');
    return;
  }
  const noIndexHeader = { 'X-Robots-Tag': 'noindex, nofollow, noarchive' };

  // Public API
  if (url.pathname === '/api/quote' && req.method === 'POST') {
    try {
      const bodyRaw = await readBody(req);
      const payload = JSON.parse(bodyRaw || '{}');

      const submissions = readSubmissions();
      const newSubmission = {
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
        receivedAt: new Date().toISOString(),
        ip: req.socket.remoteAddress,
        status: 'unread',
        ...payload,
      };
      submissions.unshift(newSubmission);
      writeSubmissions(submissions);

      sendJSON(res, 200, { success: true });
    } catch (err) {
      sendJSON(res, 500, { success: false, error: String(err) });
    }
    return;
  }

  // Auth API
  if (url.pathname === '/api/login' && req.method === 'POST') {
    try {
      const bodyRaw = await readBody(req);
      const payload = JSON.parse(bodyRaw || '{}');
      if (payload.password === ADMIN_PASSWORD) {
        res.writeHead(200, {
          'Set-Cookie': `admin_session=${ADMIN_PASSWORD}; Path=/; HttpOnly; Max-Age=2592000`,
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ success: true }));
      } else {
        sendJSON(res, 401, { success: false, error: 'Invalid password' });
      }
    } catch (err) {
      sendJSON(res, 500, { success: false, error: String(err) });
    }
    return;
  }

  // Protected APIs
  if (url.pathname.startsWith('/api/submissions')) {
    if (!isAuthenticated(req)) {
      sendJSON(res, 401, { success: false, error: 'Unauthorized' });
      return;
    }

    if (url.pathname === '/api/submissions' && req.method === 'GET') {
      const submissions = readSubmissions();
      sendJSON(res, 200, submissions);
      return;
    }

    if (url.pathname === '/api/submissions/toggle' && req.method === 'POST') {
      try {
        const bodyRaw = await readBody(req);
        const { id } = JSON.parse(bodyRaw || '{}');
        const submissions = readSubmissions();
        const index = submissions.findIndex((s) => s.id === id);
        if (index !== -1) {
          submissions[index].status = submissions[index].status === 'read' ? 'unread' : 'read';
          writeSubmissions(submissions);
          sendJSON(res, 200, { success: true, status: submissions[index].status });
        } else {
          sendJSON(res, 404, { success: false, error: 'Not found' });
        }
      } catch (err) {
        sendJSON(res, 500, { success: false, error: String(err) });
      }
      return;
    }

    if (url.pathname === '/api/submissions' && req.method === 'DELETE') {
      writeSubmissions([]);
      sendJSON(res, 200, { success: true });
      return;
    }
  }

  // Serve static files
  if (url.pathname === '/index.html') {
    res.writeHead(301, { Location: '/' });
    res.end();
    return;
  }

  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = safeJoin(PUBLIC_DIR, filePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    });
    res.end('403: Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const isNoIndex =
      url.pathname === '/submissions.html' ||
      url.pathname === '/submissions.json' ||
      url.pathname.startsWith('/api/');
    
    // Redirect to login if trying to access submissions.html and not authenticated
    if (url.pathname === '/submissions.html' && !isAuthenticated(req)) {
      res.writeHead(302, { Location: '/login.html' });
      res.end();
      return;
    }

    sendFile(res, filePath, isNoIndex ? noIndexHeader : {});
  } else {
    res.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    });
    res.end('404: Not found');
  }
});


server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
