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

const http = require('http');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const PORT = process.env.PORT || 3001;
const PUBLIC_DIR = path.resolve(__dirname);
const DATA_FILE = path.join(PUBLIC_DIR, 'submissions.json');

// Email config
// Hardcoded defaults (can be overridden via environment variables).
const EMAIL_USER = process.env.EMAIL_USER || 'manukajayarathne.coma@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'jyut gwwb mdqo rwlp';
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL || 'peshala46@gmail.com';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = SMTP_PORT === 465;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  requireTLS: !SMTP_SECURE,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  connectionTimeout: 15_000,
  greetingTimeout: 15_000,
  socketTimeout: 20_000,
  // Production error shows Gmail resolving to IPv6 and failing (ENETUNREACH);
  // force IPv4 for the SMTP socket.
  family: 4,
});

transporter
  .verify()
  .then(() => console.log('Email transporter verified.'))
  .catch((err) => console.error('Email transporter verify failed:', err));

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

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: EMAIL_USER,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Email send failed:', err);
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
  const url = new URL(req.url, `http://${req.headers.host}`);
  const noIndexHeader = { 'X-Robots-Tag': 'noindex, nofollow, noarchive' };

  if (url.pathname === '/api/quote' && req.method === 'POST') {
    try {
      const bodyRaw = await readBody(req);
      const payload = JSON.parse(bodyRaw || '{}');

      const submissions = readSubmissions();
      submissions.unshift({
        receivedAt: new Date().toISOString(),
        ip: req.socket.remoteAddress,
        ...payload,
      });
      writeSubmissions(submissions);

      // Send email to business
      const businessHtml = `
        <h2>New Quote Request</h2>
        <p><strong>Name:</strong> ${payload.name || 'N/A'}</p>
        <p><strong>Phone:</strong> ${payload.phone || 'N/A'}</p>
        <p><strong>Email:</strong> ${payload.email || 'N/A'}</p>
        <p><strong>Service:</strong> ${payload.service || 'N/A'}</p>
        <p><strong>Address:</strong> ${payload.address || 'N/A'}</p>
        <p><strong>Details:</strong> ${payload.details || 'N/A'}</p>
        <p><strong>Received:</strong> ${new Date().toLocaleString()}</p>
      `;
      sendEmail(BUSINESS_EMAIL, 'New Quote Request - TurboGlow Cleaning', businessHtml);

      // Send confirmation to client if email provided
      if (payload.email) {
        const clientHtml = `
          <h2>Thank you for your quote request!</h2>
          <p>Hi ${payload.name},</p>
          <p>We've received your request for: <strong>${payload.service}</strong></p>
          <p>We'll contact you soon at ${payload.phone}.</p>
          <p>Best,<br>TurboGlow Cleaning Team</p>
        `;
        sendEmail(payload.email, 'Quote Request Received - TurboGlow Cleaning', clientHtml);
      }

      sendJSON(res, 200, { success: true });
    } catch (err) {
      sendJSON(res, 500, { success: false, error: String(err) });
    }
    return;
  }

  if (url.pathname === '/api/submissions' && req.method === 'GET') {
    const submissions = readSubmissions();
    sendJSON(res, 200, submissions);
    return;
  }

  if (url.pathname === '/api/submissions' && req.method === 'DELETE') {
    writeSubmissions([]);
    sendJSON(res, 200, { success: true });
    return;
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
