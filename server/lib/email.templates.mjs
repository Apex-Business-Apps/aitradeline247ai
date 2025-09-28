import { sign } from './signer.mjs';

const BASE_URL = process.env.BASE_URL;
const PAY_DEPOSIT_AMOUNT_CAD = process.env.PAY_DEPOSIT_AMOUNT_CAD || '25';

/**
 * Generate missed call email template with CTA buttons
 * @param {Object} params - { callSid, fromE164, transcript, audioUrl, hasRecentPayment }
 * @returns {Object} - { subject, html, text }
 */
export function missedCall({ callSid, fromE164, transcript = '', audioUrl = '', hasRecentPayment = false }) {
  const transcriptExcerpt = transcript ? transcript.substring(0, 500) : '(no speech detected)';
  
  // Generate signed tokens for CTAs
  const callbackToken = sign({ callSid, toE164: fromE164 });
  const resolveToken = sign({ callSid, toE164: fromE164 });
  
  const callbackUrl = `${BASE_URL}/a/c?t=${callbackToken}`;
  const resolveUrl = `${BASE_URL}/a/r?t=${resolveToken}`;
  
  // Show Stripe button only if keys exist and no recent payment
  const showStripeButton = process.env.STRIPE_SECRET_KEY && !hasRecentPayment;
  const stripeButtonHtml = showStripeButton ? `
    <tr>
      <td style="padding: 10px 0;">
        <a href="${BASE_URL}/booking/deposit?callSid=${callSid}&e164=${encodeURIComponent(fromE164)}" 
           style="display: inline-block; background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Secure booking with $${PAY_DEPOSIT_AMOUNT_CAD} deposit
        </a>
      </td>
    </tr>` : '';
  
  const subject = `Missed Call: ${fromE164}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <h1 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px;">Missed Call Alert</h1>
        <p style="margin: 0 0 12px 0; font-size: 16px;"><strong>From:</strong> ${fromE164}</p>
        <p style="margin: 0 0 12px 0; font-size: 16px;"><strong>Call ID:</strong> ${callSid}</p>
      </div>
      
      <div style="margin-bottom: 24px;">
        <h2 style="color: #374151; margin: 0 0 12px 0; font-size: 18px;">Transcript</h2>
        <div style="background-color: #f3f4f6; border-radius: 6px; padding: 16px; font-family: monospace; font-size: 14px;">
          ${transcriptExcerpt}
        </div>
      </div>
      
      ${audioUrl ? `
      <div style="margin-bottom: 24px;">
        <h2 style="color: #374151; margin: 0 0 12px 0; font-size: 18px;">Recording</h2>
        <p><a href="${audioUrl}" style="color: #3b82f6; text-decoration: none;">🎵 Listen to 7-day audio link</a></p>
      </div>` : ''}
      
      <div style="margin-bottom: 24px;">
        <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 18px;">Quick Actions</h2>
        <table style="width: 100%;">
          <tr>
            <td style="padding: 10px 0;">
              <a href="${callbackUrl}" 
                 style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-right: 12px;">
                📞 Call back now
              </a>
              <a href="${resolveUrl}" 
                 style="display: inline-block; background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                ✅ Mark resolved
              </a>
            </td>
          </tr>
          ${stripeButtonHtml}
        </table>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; color: #6b7280; font-size: 14px;">
        <p>TradeLine 24/7 - Your AI Receptionist</p>
        <p>Links expire in 7 days for security.</p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Missed Call Alert

From: ${fromE164}
Call ID: ${callSid}

Transcript:
${transcriptExcerpt}

${audioUrl ? `Recording: ${audioUrl}\n` : ''}

Quick Actions:
- Call back now: ${callbackUrl}
- Mark resolved: ${resolveUrl}
${showStripeButton ? `- Secure booking with $${PAY_DEPOSIT_AMOUNT_CAD} deposit: ${BASE_URL}/booking/deposit?callSid=${callSid}&e164=${encodeURIComponent(fromE164)}` : ''}

TradeLine 24/7 - Your AI Receptionist
Links expire in 7 days for security.
  `;
  
  return { subject, html, text };
}

/**
 * Generate weekly digest email template
 * @param {Object} params - { metrics, topMissed, newestTranscripts }
 * @returns {Object} - { subject, html, text }
 */
export function weeklyDigest({ metrics, topMissed = [], newestTranscripts = [] }) {
  const subject = 'TL247 Weekly — Calls & Transcripts Summary';
  
  const topMissedHtml = topMissed.length > 0 
    ? topMissed.map(item => `<li>${item.e164} (${item.count} calls)</li>`).join('')
    : '<li>No missed calls this week</li>';
    
  const transcriptsHtml = newestTranscripts.length > 0
    ? newestTranscripts.map(t => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${t.from || 'Unknown'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${t.to || 'Unknown'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(t.time).toLocaleString()}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="3" style="padding: 8px; text-align: center; color: #6b7280;">No transcripts this week</td></tr>';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <h1 style="color: #1f2937; margin: 0 0 16px 0; font-size: 28px;">📊 Weekly Summary</h1>
        <p style="color: #6b7280; margin: 0; font-size: 16px;">TradeLine 24/7 Operations Digest</p>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px;">
        <div style="background-color: #dbeafe; border-radius: 8px; padding: 20px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #1e40af;">${metrics.totalCalls || 0}</div>
          <div style="color: #3730a3; font-weight: 600;">Total Calls</div>
        </div>
        <div style="background-color: #dcfce7; border-radius: 8px; padding: 20px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #15803d;">${metrics.bridgedPercent || 0}%</div>
          <div style="color: #166534; font-weight: 600;">Bridged</div>
        </div>
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #d97706;">${metrics.avgRingToBridge || 0}s</div>
          <div style="color: #92400e; font-weight: 600;">Avg Ring-to-Bridge</div>
        </div>
        <div style="background-color: #fee2e2; border-radius: 8px; padding: 20px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #dc2626;">${metrics.missedCalls || 0}</div>
          <div style="color: #991b1b; font-weight: 600;">Missed Calls</div>
        </div>
      </div>
      
      <div style="margin-bottom: 32px;">
        <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 20px;">📞 Top 5 Missed Numbers</h2>
        <ul style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 0;">
          ${topMissedHtml}
        </ul>
      </div>
      
      <div style="margin-bottom: 32px;">
        <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 20px;">📝 Newest 10 Transcripts</h2>
        <table style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 6px; overflow: hidden;">
          <thead>
            <tr style="background-color: #e5e7eb;">
              <th style="padding: 12px 8px; text-align: left; font-weight: 600;">From</th>
              <th style="padding: 12px 8px; text-align: left; font-weight: 600;">To</th>
              <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Time</th>
            </tr>
          </thead>
          <tbody>
            ${transcriptsHtml}
          </tbody>
        </table>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; color: #6b7280; font-size: 14px;">
        <p>TradeLine 24/7 Weekly Operations Report</p>
        <p>Generated automatically every Monday at 07:05 America/Edmonton</p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
TL247 Weekly — Calls & Transcripts Summary

METRICS:
- Total Calls: ${metrics.totalCalls || 0}
- Bridged: ${metrics.bridgedPercent || 0}%
- Avg Ring-to-Bridge: ${metrics.avgRingToBridge || 0}s
- Missed Calls: ${metrics.missedCalls || 0}
- Transcripts Done: ${metrics.transcriptsDone || 0}

TOP 5 MISSED NUMBERS:
${topMissed.length > 0 
  ? topMissed.map(item => `- ${item.e164} (${item.count} calls)`).join('\n')
  : '- No missed calls this week'
}

NEWEST 10 TRANSCRIPTS:
${newestTranscripts.length > 0
  ? newestTranscripts.map(t => `- ${t.from || 'Unknown'} → ${t.to || 'Unknown'} at ${new Date(t.time).toLocaleString()}`).join('\n')
  : '- No transcripts this week'
}

TradeLine 24/7 Weekly Operations Report
Generated automatically every Monday at 07:05 America/Edmonton
  `;
  
  return { subject, html, text };
}