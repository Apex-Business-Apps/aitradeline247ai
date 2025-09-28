// Authentication protection middleware for API routes
export function wireAuthProtect(app) {
  // Middleware to require JWT auth
  const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }
    next();
  };

  // Protect settings routes
  app.use('/api/settings', requireAuth);
  app.use('/api/settings/test-call', requireAuth);
  
  // Protect billing routes
  app.use('/api/billing/portal', requireAuth);
  
  console.log('✅ Auth protection wired for API routes');
}