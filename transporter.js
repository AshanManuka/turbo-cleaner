const nodemailer = require('nodemailer');

function getEnvNumber(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function getTransportConfig() {
  const host = process.env.EMAIL_HOST || 'smtp.zoho.com';
  const port = getEnvNumber('EMAIL_PORT', 465);

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  const missing = [];
  if (!user) missing.push('EMAIL_USER');
  if (!pass) missing.push('EMAIL_PASS');
  if (missing.length) {
    const err = new Error(`Missing required email environment variables: ${missing.join(', ')}`);
    err.code = 'EMAIL_ENV_MISSING';
    throw err;
  }

  return { host, port, user, pass };
}

let cachedTransporter;

function createTransporter() {
  const { host, port, user, pass } = getTransportConfig();
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    auth: { user, pass },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
    family: 4,
  });
}

function getTransporter() {
  if (!cachedTransporter) cachedTransporter = createTransporter();
  return cachedTransporter;
}

async function verifyTransporter() {
  try {
    await getTransporter().verify();
    console.log('[email] SMTP transporter verified successfully.');
    return { success: true };
  } catch (err) {
    console.error('[email] SMTP transporter verification failed:', err);
    return { success: false, error: err };
  }
}

module.exports = {
  getTransporter,
  verifyTransporter,
};
