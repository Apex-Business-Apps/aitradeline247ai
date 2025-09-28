/**
 * Status and version endpoints for ops monitoring
 */

/**
 * Handle status check
 * GET /status.json
 */
export function statusHandler(req, res) {
  try {
    const response = {
      ok: true,
      ts: new Date().toISOString(),
      region: process.env.RENDER_REGION || 'unknown',
      deps: {
        supabase: true
      },
      version: {
        gitSha: process.env.GIT_SHA || null,
        builtAt: process.env.BUILT_AT || null
      }
    };

    return res.json(response);
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}

/**
 * Handle version check  
 * GET /version
 */
export function versionHandler(req, res) {
  try {
    const gitSha = process.env.GIT_SHA || 'dev';
    const builtAt = process.env.BUILT_AT || '';
    
    const version = `${gitSha} ${builtAt}`.trim();
    
    return res.type('text/plain').send(version);
  } catch (error) {
    console.error('Version check error:', error);
    return res.status(500).type('text/plain').send('error');
  }
}