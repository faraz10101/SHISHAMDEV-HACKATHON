// Email sending through Resend (same flow as the old "src 1" app, now branded for ScamShield).
const { Resend } = require('resend');

let client = null;
const resend = () => {
  if (!client) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
};

const APP_NAME = () => process.env.APP_NAME || 'ScamShield';
const FROM = () => process.env.EMAIL_FROM || `${APP_NAME()} <noreplya.relic@codeera.me>`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function layout({ title, bodyHtml, footerNote }) {
  const app = esc(APP_NAME());
  const logo = process.env.EMAIL_LOGO_URL
    ? `<img src="${esc(process.env.EMAIL_LOGO_URL)}" alt="${app} Logo" style="height:50px;width:auto;display:block;margin:0 auto 10px auto;" />`
    : `<h1 style="margin:0;font-size:28px;font-weight:700;">${app}</h1>`;
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:500px;margin:40px auto;background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);overflow:hidden;">
      <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:30px;text-align:center;">${logo}</div>
      <div style="padding:40px 30px;">${bodyHtml}</div>
      <div style="background:#f9f9f9;padding:20px;text-align:center;border-top:1px solid #eee;font-size:12px;color:#999;">
        <p>&copy; ${new Date().getFullYear()} ${app}. All rights reserved.</p>
        <p>${esc(footerNote)}</p>
      </div>
    </div>
  </body>
</html>`;
}

// Resend v3+ returns { data, error } instead of throwing, so we must check `error` ourselves.
async function deliver({ to, subject, html }) {
  let result;
  try {
    result = await resend().emails.send({ from: FROM(), to, subject, html });
  } catch (err) {
    result = { error: err };
  }
  if (result && result.error) {
    const msg = String(result.error.message || result.error);
    console.error('Resend error:', msg);
    throw new Error(`Failed to send email: ${msg}`); // only logged server-side; the client gets a generic message
  }
  return result.data || result;
}

async function sendOTPEmail(email, code, ttlSeconds = 60) {
  if (!email || !code) throw new Error('Email and code are required');
  const app = esc(APP_NAME());
  const ttl = ttlSeconds % 60 === 0 ? `${ttlSeconds / 60} minute${ttlSeconds === 60 ? '' : 's'}` : `${ttlSeconds} seconds`;

  const html = layout({
    title: `Verify your email - ${APP_NAME()}`,
    footerNote: 'This is an automated message, please do not reply to this email.',
    bodyHtml: `
      <p style="font-size:16px;color:#333;margin:0 0 20px;line-height:1.6;text-align:center;">Welcome to ${app}!</p>
      <p style="color:#666;margin:0 0 20px;text-align:center;font-size:14px;">Please enter the verification code below to verify your email address. Only verified accounts can report scams.</p>
      <div style="background:#f9f9f9;border:2px solid #667eea;border-radius:10px;padding:25px;margin:30px 0;text-align:center;">
        <div style="font-size:13px;color:#999;margin-bottom:15px;text-transform:uppercase;letter-spacing:1.5px;">Verification Code</div>
        <div style="font-size:44px;font-weight:800;color:#667eea;letter-spacing:10px;font-family:'Courier New',monospace;">${esc(code)}</div>
      </div>
      <p style="text-align:center;color:#666;font-size:14px;margin:20px 0;">This code is valid for <strong>${ttl} only</strong>.</p>
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;border-radius:6px;font-size:13px;color:#92400e;">
        <strong style="display:block;margin-bottom:5px;">Security Notice:</strong>
        If you did not request this code, please ignore this email. Never share this code with anyone. We will never ask for your verification code by email, call or message.
      </div>`,
  });

  const data = await deliver({ to: email, subject: `Verify Your Email - ${APP_NAME()}`, html });
  console.log('Verification email sent:', { email, messageId: data && data.id }); // never log the code itself
  return { success: true, email, messageId: data && data.id };
}

async function sendPasswordResetEmail(email, resetLink) {
  const html = layout({
    title: 'Password Reset',
    footerNote: 'This is a security email. Do not share this link with anyone.',
    bodyHtml: `
      <p style="color:#333;line-height:1.6;">We received a request to reset your password. Click the button below to create a new password.</p>
      <p style="text-align:center;"><a href="${esc(resetLink)}" style="display:inline-block;background:#667eea;color:#fff;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:600;margin:20px 0;">Reset Password</a></p>
      <p style="color:#333;"><strong>Link expires in: 1 hour</strong></p>
      <div style="background:#fee;border-left:4px solid #f44;padding:15px;border-radius:6px;font-size:13px;color:#c33;margin:20px 0;">
        <strong>Did not request this?</strong> You can safely ignore this email. Your password will remain unchanged.
      </div>`,
  });
  await deliver({ to: email, subject: `Password Reset Request - ${APP_NAME()}`, html });
  return { success: true };
}

module.exports = { sendOTPEmail, sendPasswordResetEmail };
