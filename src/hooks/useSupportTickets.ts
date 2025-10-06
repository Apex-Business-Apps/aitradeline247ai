import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface CreateTicketParams {
  email: string;
  subject: string;
  message: string;
}

/**
 * Secure hook for creating support tickets
 * - Automatically includes user_id for authenticated users
 * - Prevents email-based enumeration attacks
 * - Uses masked email view (support_tickets_secure) to prevent email leakage
 * - Admins see full emails, regular users see masked emails (a***@domain.com)
 */
export const useSupportTickets = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTicket = async ({ email, subject, message }: CreateTicketParams) => {
    setIsSubmitting(true);
    
    try {
      // Get current session to determine if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      const ticketData: any = {
        email,
        subject,
        message,
        status: 'open'
      };

      // Only add user_id if authenticated (enforced by RLS)
      if (session?.user) {
        ticketData.user_id = session.user.id;
      }

      const { error } = await supabase
        .from('support_tickets')
        .insert(ticketData);

      if (error) throw error;

      toast({
        title: 'Ticket Created',
        description: session?.user 
          ? 'Your support ticket has been created. You can view it in your account.'
          : 'Your support ticket has been submitted. We\'ll respond to your email soon.',
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error creating support ticket:', error);
      
      toast({
        title: 'Error',
        description: 'Unable to create support ticket. Please try again.',
        variant: 'destructive',
      });

      return { success: false, error };
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserTickets = async () => {
    try {
      // Use secure view that automatically masks emails for non-admins
      const { data, error } = await supabase
        .from('support_tickets_secure')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return { tickets: data, error: null };
    } catch (error: any) {
      console.error('Error fetching support tickets:', error);
      return { tickets: null, error };
    }
  };

  return {
    createTicket,
    getUserTickets,
    isSubmitting,
  };
};
