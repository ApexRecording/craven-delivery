-- Grant Jason Parcell access to the Chief Partnership Portal.
-- This portal currently uses the existing admin role gate in user_roles.
DO $$
DECLARE
  matched_user_count integer;
  jason_user_id uuid;
  jason_full_name text;
  jason_phone text;
BEGIN
  SELECT COUNT(*)
  INTO matched_user_count
  FROM (
    SELECT DISTINCT au.id
    FROM auth.users au
    LEFT JOIN public.user_profiles up
      ON up.user_id = au.id
    WHERE LOWER(BTRIM(COALESCE(up.full_name, au.raw_user_meta_data->>'full_name', ''))) = 'jason parcell'
  ) matched_users;

  IF matched_user_count <> 1 THEN
    RAISE NOTICE 'Expected exactly one Jason Parcell account, found %; skipping portal access grant.', matched_user_count;
    RETURN;
  END IF;

  SELECT
    au.id,
    COALESCE(NULLIF(BTRIM(up.full_name), ''), NULLIF(BTRIM(au.raw_user_meta_data->>'full_name'), ''), 'Jason Parcell'),
    NULLIF(BTRIM(up.phone), '')
  INTO
    jason_user_id,
    jason_full_name,
    jason_phone
  FROM auth.users au
  LEFT JOIN public.user_profiles up
    ON up.user_id = au.id
  WHERE LOWER(BTRIM(COALESCE(up.full_name, au.raw_user_meta_data->>'full_name', ''))) = 'jason parcell'
  LIMIT 1;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (jason_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.user_profiles (user_id, full_name, role, phone)
  VALUES (jason_user_id, jason_full_name, 'admin', jason_phone)
  ON CONFLICT (user_id) DO UPDATE
  SET
    full_name = COALESCE(EXCLUDED.full_name, public.user_profiles.full_name),
    role = 'admin',
    phone = COALESCE(EXCLUDED.phone, public.user_profiles.phone),
    updated_at = now();
END $$;
