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
 * Verify that the user is authenticated and has admin role with rate limiting
 * @throws Error if user is not authenticated, not an admin, or rate limited
 */
export async function checkAdminAuth(
  req: Request,
  supabaseClient: SupabaseClient
): Promise<{ user: any; userId: string }> {
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

  // Check if user has admin role
  const { data: userRole, error: roleError } = await supabaseClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (roleError || !userRole || userRole.role !== 'admin') {
    console.error('Non-admin access attempt:', {
      user_id: user.id,
      email: user.email,
      attempted_role: userRole?.role
    });
    
    // Log security alert
    await supabaseClient
      .from('security_alerts')
      .insert({
        alert_type: 'unauthorized_admin_access',
        user_id: user.id,
        event_data: {
          email: user.email,
          attempted_function: 'campaign_operation',
          user_role: userRole?.role || 'none'
        },
        severity: 'high'
      });
    
    throw new Error('Forbidden: Admin access required for campaign operations');
  }

  console.log('Admin access verified:', { user_id: user.id, email: user.email });
  
  return { user, userId: user.id };
}
