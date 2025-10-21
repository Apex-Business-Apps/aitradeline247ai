import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Rate limiting configuration for admin authentication
 */
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Check rate limit for admin authentication attempts
 * @returns true if rate limit exceeded
 */
async function checkRateLimit(
  userId: string,
  supabaseClient: SupabaseClient
): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  
  // Check existing rate limit record
  const { data: rateLimit } = await supabaseClient
    .from('admin_auth_rate_limit')
    .select('*')
    .eq('user_id', userId)
    .gte('window_start', windowStart.toISOString())
    .single();
  
  if (rateLimit) {
    // Check if currently blocked
    if (rateLimit.blocked_until && new Date(rateLimit.blocked_until) > new Date()) {
      return true; // Still blocked
    }
    
    // Check if exceeded attempts in window
    if (rateLimit.attempt_count >= RATE_LIMIT_MAX_ATTEMPTS) {
      // Block the user
      const blockUntil = new Date(Date.now() + RATE_LIMIT_BLOCK_DURATION_MS);
      await supabaseClient
        .from('admin_auth_rate_limit')
        .update({ 
          blocked_until: blockUntil.toISOString(),
          attempt_count: rateLimit.attempt_count + 1
        })
        .eq('user_id', userId)
        .eq('window_start', rateLimit.window_start);
      
      return true; // Exceeded limit
    }
    
    // Increment attempt count
    await supabaseClient
      .from('admin_auth_rate_limit')
      .update({ attempt_count: rateLimit.attempt_count + 1 })
      .eq('user_id', userId)
      .eq('window_start', rateLimit.window_start);
  } else {
    // Create new rate limit record
    await supabaseClient
      .from('admin_auth_rate_limit')
      .insert({
        user_id: userId,
        window_start: new Date().toISOString(),
        attempt_count: 1
      });
  }
  
  return false; // Not rate limited
}

/**
 * Verify that the user is authenticated and has admin or moderator role with rate limiting
 * @param allowedRoles - Roles that are allowed to access (defaults to ['admin', 'moderator'])
 * @throws Error if user is not authenticated, not authorized, or rate limited
 */
export async function checkAdminAuth(
  req: Request,
  supabaseClient: SupabaseClient,
  allowedRoles: string[] = ['admin', 'moderator']
): Promise<{ user: any; userId: string; userRole: string }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

  if (authError || !user) {
    throw new Error('Unauthorized: Invalid or expired token');
  }

  // Check rate limit before proceeding
  const isRateLimited = await checkRateLimit(user.id, supabaseClient);
  if (isRateLimited) {
    console.error('Rate limit exceeded for admin auth:', {
      user_id: user.id,
      email: user.email
    });
    
    await supabaseClient
      .from('security_alerts')
      .insert({
        alert_type: 'admin_auth_rate_limit_exceeded',
        user_id: user.id,
        event_data: {
          email: user.email,
          timestamp: new Date().toISOString()
        },
        severity: 'high'
      });
    
    throw new Error('Too many authentication attempts. Please try again later.');
  }

  // Check if user has any of the allowed roles
  const { data: userRoles, error: roleError } = await supabaseClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  // If user_roles table is empty (bootstrap), grant admin access
  if (roleError) {
    console.warn('Role check error, checking for bootstrap mode:', roleError);
  }

  const hasAllowedRole = userRoles?.some(r => allowedRoles.includes(r.role));
  const isBootstrap = !userRoles || userRoles.length === 0;

  if (!hasAllowedRole && !isBootstrap) {
    console.error('Unauthorized access attempt:', {
      user_id: user.id,
      email: user.email,
      user_roles: userRoles?.map(r => r.role) || [],
      required_roles: allowedRoles
    });
    
    // Log security alert
    await supabaseClient
      .from('security_alerts')
      .insert({
        alert_type: 'unauthorized_admin_access',
        user_id: user.id,
        event_data: {
          email: user.email,
          attempted_function: 'restricted_operation',
          user_roles: userRoles?.map(r => r.role) || [],
          required_roles: allowedRoles
        },
        severity: 'high'
      });
    
    throw new Error(`Forbidden: Requires one of these roles: ${allowedRoles.join(', ')}`);
  }

  const effectiveRole = userRoles?.[0]?.role || 'admin'; // Bootstrap grants admin
  console.log('Access verified:', { 
    user_id: user.id, 
    email: user.email, 
    role: effectiveRole,
    bootstrap: isBootstrap
  });
  
  return { user, userId: user.id, userRole: effectiveRole };
}

