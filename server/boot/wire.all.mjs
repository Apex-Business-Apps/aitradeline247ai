/**
 * Central wiring module for all server enhancements
 * Provides single import to wire all enhancement routes
 */

/**
 * Wire all enhancement routes to Express app
 * @param {Express} app - Express application instance
 */
export async function wireAll(app) {
  try {
    // Import and wire enhancement routes
    const { wireEnhancements } = await import('./enhancements.wire.mjs');
    wireEnhancements(app);
    
    // Import and wire status routes
    const { wireStatus } = await import('./status.wire.mjs');
    wireStatus(app);
    
    console.log('✅ All enhancement routes wired successfully');
    
  } catch (error) {
    console.error('❌ Failed to wire enhancement routes:', error);
    throw error;
  }
}