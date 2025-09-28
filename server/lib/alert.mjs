import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const EXEC_TO = process.env.EXEC_TO || 'info@tradeline247ai.com';
const EMAIL_FROM = process.env.EMAIL_FROM || 'TradeLine 24/7 <noreply@tradeline247ai.com>';

/**
 * Send alert email to executives
 * @param {string} subject - Alert subject
 * @param {object} details - Alert details object
 */
export async function alert(subject, details) {
  try {
    const alertSubject = `[TL247 Alert] ${subject}`;
    const timestamp = new Date().toISOString();
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626; margin-bottom: 20px;">TradeLine 24/7 System Alert</h2>
        
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="color: #991b1b; margin: 0 0 12px 0;">${subject}</h3>
          <p style="margin: 0; color: #7f1d1d;">Timestamp: ${timestamp}</p>
        </div>
        
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
          <h4 style="margin: 0 0 12px 0; color: #374151;">Alert Details:</h4>
          <pre style="background: #fff; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${JSON.stringify(details, null, 2)}</pre>
        </div>
        
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>This is an automated alert from TradeLine 24/7 monitoring system.</p>
        </div>
      </div>
    `;
    
    const textContent = `
TradeLine 24/7 System Alert

Subject: ${subject}
Timestamp: ${timestamp}

Details:
${JSON.stringify(details, null, 2)}

This is an automated alert from TradeLine 24/7 monitoring system.
    `;

    await resend.emails.send({
      from: EMAIL_FROM,
      to: EXEC_TO,
      subject: alertSubject,
      html: htmlContent,
      text: textContent
    });
    
    console.log(`Alert sent: ${alertSubject}`);
    
  } catch (error) {
    console.error('Failed to send alert:', error);
    // Don't throw - alerts should not break the main flow
  }
}