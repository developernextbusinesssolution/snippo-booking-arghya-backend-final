import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Standard HTML wrapper for premium look
 */
const emailWrapper = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background-color: #f8f9fa; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #080810; padding: 20px; text-align: center; }
    .content { padding: 40px; line-height: 1.6; color: #1a1a1a; font-size: 16px; }
    .footer { background: #f1f3f5; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }
    .btn { display: inline-block; padding: 12px 24px; background: #E63946; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
    h1, h2, h3 { color: #080810; margin-top: 0; }
    hr { border: 0; border-top: 1px solid #eee; margin: 30px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://snippo.com/wp-content/uploads/2026/02/tmpd7p765pj-1.webp" alt="Snippo" height="50">
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Snippo Booking. All rights reserved.<br>
      This is an automated notification.
    </div>
  </div>
</body>
</html>
`;

/**
 * Replaces {{variable}} in string with provided values
 */
const compile = (str, vars = {}) => {
  let result = str;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), val || '');
  }
  return result;
};

export const sendEmail = async ({ to, subject, text, html, wrap = true }) => {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Email Error] RESEND_API_KEY not configured');
    return null;
  }

  try {
    const fromAddress = process.env.SMTP_FROM_EMAIL || 'onboarding@resend.dev';
    const fromName = process.env.SMTP_FROM_NAME || 'Snippo Booking';

    const finalHtml = wrap ? emailWrapper(html) : html;

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: [to],
      subject: subject,
      html: finalHtml,
      text: text || "This email requires HTML viewing",
    });

    if (error) {
      console.error('[Resend Error]', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Email Error] failure:', error.message);
    return null;
  }
};

/**
 * Fetches dynamic template and sends email
 */
import { getEmailTemplate } from '../store.js';

export const sendTemplatedEmail = async (templateId, to, vars = {}) => {
  const template = await getEmailTemplate(templateId);
  if (!template) {
    console.warn(`[Email] Template ${templateId} not found, skipping.`);
    return null;
  }

  const subject = compile(template.subject, vars);
  const html = compile(template.body, vars);

  return sendEmail({ to, subject, html });
};
