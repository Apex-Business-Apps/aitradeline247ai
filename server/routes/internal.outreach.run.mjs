import { dueFollowups } from '../lib/outreach.mjs';

// Simple in-memory rate limiting (for basic protection)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requests = rateLimitMap.get(ip);
  
  // Remove old requests outside the window
  const validRequests = requests.filter(time => time > windowStart);
  rateLimitMap.set(ip, validRequests);
  
  // Check if within limit
  if (validRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  // Add current request
  validRequests.push(now);
  return true;
}

export async function internalOutreachRunHandler(req, res) {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Basic rate limiting
  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  try {
    console.log('Running due followups...');
    const sent = await dueFollowups();
    
    console.log(`Sent ${sent} followup messages`);
    
    res.json({ 
      success: true, 
      sent: sent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running followups:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Export the route setup function
export function setupInternalOutreachRun(app) {
  app.post('/internal/outreach/run', internalOutreachRunHandler);
}