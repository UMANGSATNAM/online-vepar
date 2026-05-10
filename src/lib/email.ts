import { Resend } from 'resend';

// Initialize Resend with graceful fallback if no key is provided
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Default "from" address for platform emails
const DEFAULT_FROM = process.env.EMAIL_FROM || 'Online Vepar <hello@onlinevepar.com>';

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}) {
  if (!resend) {
    console.log('\n[MOCK EMAIL SENT] =======================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('HTML Payload length:', html.length);
    console.log('=========================================\n');
    return { id: 'mock-id-' + Date.now(), success: true };
  }

  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, ''), // Strips HTML tags for simple text fallback
    });

    return { ...data, success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { error, success: false };
  }
}

export async function sendAbandonedCartRecoveryEmail(
  toEmail: string,
  customerName: string,
  storeName: string,
  recoveryUrl: string,
  items: any[]
) {
  const subject = `Your cart is waiting for you at ${storeName}`;
  
  let itemsHtml = '';
  try {
    // Attempt to format items
    if (items && items.length > 0) {
      itemsHtml = items.map(item => `
        <div style="display: flex; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 15px;" />` : ''}
          <div>
            <p style="margin: 0; font-weight: bold; color: #111;">${item.name}</p>
            <p style="margin: 5px 0 0; color: #666;">Qty: ${item.quantity}</p>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error('Error formatting email items:', e);
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-w-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h2 style="color: #111; margin-top: 0;">Hi ${customerName || 'there'},</h2>
        <p style="color: #444; font-size: 16px; line-height: 1.5;">We noticed you left some items in your cart at <strong>${storeName}</strong>. They are still waiting for you!</p>
        
        <div style="margin: 30px 0;">
          ${itemsHtml}
        </div>
        
        <p style="color: #444; font-size: 16px; line-height: 1.5;">Click the button below to complete your order securely.</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${recoveryUrl}" style="background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
            Complete My Purchase
          </a>
        </div>
        
        <p style="color: #888; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
          If you have any questions, simply reply to this email.<br>
          &copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject,
    html,
  });
}
