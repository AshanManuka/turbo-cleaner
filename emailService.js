const { getTransporter } = require('./transporter');

const BUSINESS_EMAIL = 'info@turboglowcleaning.com.au';
const FROM = `TurboGlow Cleaning <${BUSINESS_EMAIL}>`;
const SUBJECT = 'New Contact Form Submission';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatMultilineHtml(text) {
  return escapeHtml(text).replace(/\r?\n/g, '<br>');
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(email) {
  if (!isNonEmptyString(email)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function buildContactEmailHtml({ name, email, message }) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = formatMultilineHtml(message);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${SUBJECT}</title>
  </head>
  <body style="margin:0; padding:0; background:#f6f7f9; font-family: Arial, Helvetica, sans-serif; color:#111827;">
    <div style="max-width:680px; margin:0 auto; padding:24px;">
      <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:10px; padding:22px;">
        <h2 style="margin:0 0 16px; font-size:18px; line-height:1.3;">${SUBJECT}</h2>
        <table cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse; font-size:14px;">
          <tr>
            <td style="padding:10px 12px; width:160px; background:#f9fafb; border:1px solid #e5e7eb;"><strong>Customer Name</strong></td>
            <td style="padding:10px 12px; border:1px solid #e5e7eb;">${safeName}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px; width:160px; background:#f9fafb; border:1px solid #e5e7eb;"><strong>Customer Email</strong></td>
            <td style="padding:10px 12px; border:1px solid #e5e7eb;">${safeEmail}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px; width:160px; background:#f9fafb; border:1px solid #e5e7eb; vertical-align:top;"><strong>Message</strong></td>
            <td style="padding:10px 12px; border:1px solid #e5e7eb; line-height:1.5;">
              <div style="white-space:normal;">${safeMessage}</div>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0; font-size:12px; color:#6b7280;">
          This email was generated from the website contact form.
        </p>
      </div>
    </div>
  </body>
</html>`;
}

function buildContactEmailText({ name, email, message }) {
  return [
    SUBJECT,
    '',
    `Customer Name: ${name}`,
    `Customer Email: ${email}`,
    '',
    'Message:',
    message,
  ].join('\n');
}

async function sendContactEmail(name, email, message) {
  if (!isNonEmptyString(name) || !isNonEmptyString(message) || !isValidEmail(email)) {
    const error = new Error('Invalid contact email payload (name, email, message are required).');
    error.code = 'CONTACT_EMAIL_INVALID_INPUT';
    console.error('[email] sendContactEmail validation failed:', {
      nameOk: isNonEmptyString(name),
      emailOk: isValidEmail(email),
      messageOk: isNonEmptyString(message),
    });
    return { success: false, error: error.message };
  }

  try {
    const transporter = getTransporter();

    await transporter.sendMail({
      from: FROM,
      to: BUSINESS_EMAIL,
      subject: SUBJECT,
      replyTo: `${name} <${email.trim()}>`,
      text: buildContactEmailText({ name: name.trim(), email: email.trim(), message }),
      html: buildContactEmailHtml({ name: name.trim(), email: email.trim(), message }),
    });

    console.log('[email] Contact email sent successfully.');
    return { success: true };
  } catch (err) {
    console.error('[email] sendContactEmail failed:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

module.exports = {
  sendContactEmail,
};

