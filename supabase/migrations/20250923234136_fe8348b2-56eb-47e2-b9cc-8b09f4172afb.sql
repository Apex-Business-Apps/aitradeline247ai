-- Remove user ceo@tradeline247ai.com and related data
DELETE FROM public.user_roles WHERE user_id = '479a9bab-c18a-4af4-b3dd-b8fa79bb6695';
DELETE FROM public.profiles WHERE user_id = '479a9bab-c18a-4af4-b3dd-b8fa79bb6695';
DELETE FROM auth.users WHERE id = '479a9bab-c18a-4af4-b3dd-b8fa79bb6695';