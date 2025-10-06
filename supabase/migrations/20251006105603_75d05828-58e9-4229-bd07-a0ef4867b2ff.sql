-- Grant admin role to user cc8d0710-d4d1-4c88-9a04-edc6a4eac8fb
INSERT INTO public.user_roles (user_id, role)
VALUES ('cc8d0710-d4d1-4c88-9a04-edc6a4eac8fb', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;