-- Chief Partnership Portal: CPO role, vendors table, and vendor interactions
-- This migration adds support for the Chief Partnership Officer (CPO) role
-- and the vendor management feature used in the Chief Partnership Portal.

-- 1. Allow 'cpo' as a valid role in user_roles
--    The original check constraint referenced specific roles; we drop and recreate it
--    to include 'cpo' without breaking existing data.
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check
    CHECK (role IN ('customer', 'driver', 'admin', 'moderator', 'user', 'cpo'));

-- 2. Create vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  contact_name  TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website       TEXT,
  address       TEXT,
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'inactive', 'prospect', 'former')),
  notes         TEXT,
  contract_start DATE,
  contract_end   DATE,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- 3. Create vendor_interactions table for tracking relationship history
CREATE TABLE IF NOT EXISTS public.vendor_interactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id     UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id),
  interaction_type TEXT NOT NULL
                  CHECK (interaction_type IN ('meeting', 'call', 'email', 'negotiation', 'contract', 'review', 'other')),
  summary       TEXT NOT NULL,
  outcome       TEXT,
  next_steps    TEXT,
  occurred_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_interactions ENABLE ROW LEVEL SECURITY;

-- 4. has_role helper already exists; extend RLS policies for new tables

-- CPOs can fully manage vendors
CREATE POLICY "CPO can manage vendors"
  ON public.vendors FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'cpo'))
  WITH CHECK (has_role(auth.uid(), 'cpo'));

-- Admins can also view and manage vendors
CREATE POLICY "Admins can manage vendors"
  ON public.vendors FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- CPOs can fully manage vendor interactions
CREATE POLICY "CPO can manage vendor interactions"
  ON public.vendor_interactions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'cpo'))
  WITH CHECK (has_role(auth.uid(), 'cpo'));

-- Admins can view vendor interactions
CREATE POLICY "Admins can view vendor interactions"
  ON public.vendor_interactions FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_vendors_status      ON public.vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_category    ON public.vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendor_interactions_vendor_id ON public.vendor_interactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_interactions_occurred  ON public.vendor_interactions(occurred_at);

-- 6. updated_at trigger for vendors
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Grant CPO role to Jason Parcell
--    The INSERT is keyed on email so it works whether the account was created before
--    or after this migration runs.  An operator can also run CPO_SETUP.sql manually.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'cpo'
FROM auth.users
WHERE email = 'jason.parcell@cravndelivery.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Fallback: also try common variants of the email address
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'cpo'
FROM auth.users
WHERE email = 'jparcell@cravndelivery.com'
ON CONFLICT (user_id, role) DO NOTHING;
