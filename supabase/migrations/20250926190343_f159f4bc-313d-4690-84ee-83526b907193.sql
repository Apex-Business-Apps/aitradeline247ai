-- Fix security issue: Add user-specific RLS policies for messages table
-- Add user_id column to associate messages with users
ALTER TABLE public.messages 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance on user queries
CREATE INDEX idx_messages_user_id ON public.messages(user_id);

-- Drop the existing overly broad service role policy
DROP POLICY IF EXISTS "Service role can manage messages" ON public.messages;

-- Create user-specific RLS policies
-- Users can view their own messages
CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can create their own messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages" 
ON public.messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Keep service role access for system operations (more restricted)
CREATE POLICY "Service role can manage all messages" 
ON public.messages 
FOR ALL 
USING (auth.role() = 'service_role'::text) 
WITH CHECK (auth.role() = 'service_role'::text);