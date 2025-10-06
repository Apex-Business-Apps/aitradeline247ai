import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Verify that the user is authenticated and has admin role
 * @throws Error if user is not authenticated or not an admin
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
