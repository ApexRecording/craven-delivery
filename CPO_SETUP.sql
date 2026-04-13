-- CPO_SETUP.sql
-- Run this in the Supabase SQL editor to grant Jason Parcell CPO access
-- to the Chief Partnership Portal.
--
-- Step 1: Look up Jason Parcell's user ID
-- SELECT id, email FROM auth.users WHERE email ILIKE '%parcell%' OR email ILIKE '%jason%';
--
-- Step 2: Grant the CPO role (replace 'USER-ID-HERE' with the result from Step 1,
--         and update the email below to match the exact email on file)
--
-- Option A: grant by known user ID
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('USER-ID-HERE', 'cpo')
-- ON CONFLICT (user_id, role) DO NOTHING;
--
-- Option B: grant by email (will silently succeed even if account doesn't exist yet)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'cpo'
FROM auth.users
WHERE email = 'jason.parcell@cravndelivery.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the role was granted:
-- SELECT u.email, r.role FROM auth.users u
-- JOIN public.user_roles r ON r.user_id = u.id
-- WHERE r.role = 'cpo';
