import dotenv from 'dotenv';

dotenv.config();

const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

/**
 * Sends an email using EmailJS REST API
 * @param {string} templateId - EmailJS Template ID
 * @param {Object} templateParams - Dynamic variables for the template
 * @param {string} [toEmail] - Optional specific recipient (if not fixed in template)
 */
export const sendEmailJS = async (templateId, templateParams, toEmail) => {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !publicKey) {
    console.error('[EmailJS Error] Missing Service ID or Public Key in environment');
    return null;
  }

  // Ensure to_email is passed if provided, otherwise trust template defaults
  const params = {
    ...templateParams,
    to_email: toEmail || templateParams.email || templateParams.to_email,
  };

  try {
    const response = await fetch(EMAILJS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: params,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[EmailJS Error] API response not OK:', response.status, errorText);
      return null;
    }

    const result = await response.text();
    console.log('[EmailJS Success]', result);
    return result;
  } catch (error) {
    console.error('[EmailJS Error] failure:', error.message);
    return null;
  }
};

/**
 * Legacy support for direct email sending (mapped to EmailJS)
 * Note: EmailJS works best with pre-defined templates.
 */
export const sendEmail = async ({ to, subject, html }) => {
  console.warn('[EmailJS] sendEmail called. Using generic template if available.');
  return sendEmailJS(process.env.EMAILJS_TEMPLATE_ID_CUSTOMER, {
    to_email: to,
    subject: subject,
    message_html: html
  });
};

/**
 * Legacy support for templated emails
 */
export const sendTemplatedEmail = async (templateId, to, vars = {}) => {
  // Map our internal template IDs to EmailJS Template IDs if needed
  // For now, we'll try to use the one provided by the user
  const emailjsId = templateId === 'user_booking_confirmation'
    ? process.env.EMAILJS_TEMPLATE_ID_CUSTOMER
    : templateId;

  return sendEmailJS(emailjsId, vars, to);
};
