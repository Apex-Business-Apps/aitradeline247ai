/**
 * Wire authentication protection for API routes
 */
export async function wireAuthProtect(app) {
  const { requireAuth } = await import('../lib/auth.guard.mjs');
  
  // Protect settings routes
  app.use('/api/settings', requireAuth);
  app.use('/api/settings/test-call', requireAuth);
  
  // Protect billing routes  
  app.use('/api/billing/portal', requireAuth);
  
  console.log('✅ Auth protection wired for API routes');
}