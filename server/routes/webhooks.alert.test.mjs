import { alert } from '../lib/alert.mjs';

/**
 * Test alert endpoint for ops verification
 * POST /internal/alert/test
 */
export async function alertTestHandler(req, res) {
  try {
    await alert('Test Alert', {
      ts: Date.now(),
      source: 'manual_test',
      request_ip: req.ip,
      user_agent: req.get('User-Agent')
    });
    
    return res.json({
      ok: true,
      message: 'Test alert sent successfully'
    });
    
  } catch (error) {
    console.error('Alert test error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to send test alert',
      message: error.message
    });
  }
}