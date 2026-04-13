-- Grant Chief Partnership Portal vendor access to Jason Parcell (CPO).
-- The admin portal and related RLS policies key off the `admin` role.

DO $$
DECLARE
  target_user_ids uuid[];
BEGIN
  SELECT ARRAY(
    SELECT DISTINCT au.id
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON up.user_id = au.id
    WHERE lower(coalesce(up.full_name, au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', '')) = 'jason parcell'
       OR lower(coalesce(au.email, '')) LIKE '%jason%parcell%'
  )
  INTO target_user_ids;

  IF cardinality(target_user_ids) > 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT unnest(target_user_ids), 'admin'
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.user_profiles (user_id, full_name, role)
    SELECT unnest(target_user_ids), 'Jason Parcell', 'admin'
    ON CONFLICT (user_id) DO UPDATE
      SET role = 'admin',
          full_name = COALESCE(NULLIF(public.user_profiles.full_name, ''), EXCLUDED.full_name),
          updated_at = NOW();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  incoming_full_name text;
  incoming_email text;
BEGIN
  incoming_full_name := lower(trim(coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')));
  incoming_email := lower(coalesce(NEW.email, ''));

  IF incoming_email = 'crave-n@usa.com'
     OR incoming_full_name = 'jason parcell'
     OR incoming_email LIKE '%jason%parcell%' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.user_profiles (user_id, full_name, role)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(trim(coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')), ''), 'Jason Parcell'),
      'admin'
    )
    ON CONFLICT (user_id) DO UPDATE
      SET role = 'admin',
          full_name = COALESCE(NULLIF(public.user_profiles.full_name, ''), EXCLUDED.full_name),
          updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$function$;
