import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hysvqdwmhxnblxfqnszn.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5c3ZxZHdtaHhuYmx4ZnFuc3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTQxMjcsImV4cCI6MjA3MjI5MDEyN30.cPgBYmuZh7o-stRDGGG0grKINWe9-RolObGmiqsdJfo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Middleware to require Supabase JWT authentication
 * Sets req.user = { id, email } on success
 */
export async function requireAuth(req, res, next) {
  try {
    // Get token from Authorization header or cookie
    let token = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    // Verify the JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Set user info on request
    req.user = {
      id: user.id,
      email: user.email
    };

    next();
  } catch (err) {
    console.error('Auth guard error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}