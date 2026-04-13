-- Grant Jason Parcell access to the partnership/vendor management portal.
-- The current portal permission model is keyed off the admin role, so this
-- migration backfills that role onto Jason's existing account when it exists.
DO $$
DECLARE
  target_user_id UUID;
  target_match_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT au.id)
  INTO target_match_count
  FROM auth.users au
  LEFT JOIN public.user_profiles up
    ON up.user_id = au.id
  WHERE trim(lower(COALESCE(up.full_name, ''))) = 'jason parcell'
     OR trim(lower(COALESCE(au.raw_user_meta_data ->> 'full_name', ''))) = 'jason parcell';

  IF target_match_count = 1 THEN
    SELECT au.id
    INTO target_user_id
    FROM auth.users au
    LEFT JOIN public.user_profiles up
      ON up.user_id = au.id
    WHERE trim(lower(COALESCE(up.full_name, ''))) = 'jason parcell'
       OR trim(lower(COALESCE(au.raw_user_meta_data ->> 'full_name', ''))) = 'jason parcell'
    LIMIT 1;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE public.user_profiles
    SET
      full_name = COALESCE(NULLIF(full_name, ''), 'Jason Parcell'),
      role = 'admin',
      updated_at = now()
    WHERE user_id = target_user_id;

    IF NOT FOUND THEN
      INSERT INTO public.user_profiles (user_id, full_name, role)
      VALUES (target_user_id, 'Jason Parcell', 'admin');
    END IF;

    RAISE NOTICE 'Granted admin access to Jason Parcell (user_id=%).', target_user_id;
  ELSIF target_match_count = 0 THEN
    RAISE NOTICE 'Jason Parcell account not found. Access grant skipped until his profile exists.';
  ELSE
    RAISE NOTICE 'Multiple Jason Parcell accounts found. Access grant skipped to avoid assigning the wrong account.';
  END IF;
END $$;
