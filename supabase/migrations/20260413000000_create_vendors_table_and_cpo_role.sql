-- Create vendors table for tracking vendor/partner relationships
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  contract_value_cents INTEGER,
  payment_terms TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CPOs and admins can view vendors"
  ON public.vendors FOR SELECT
  USING (has_role(auth.uid(), 'cpo') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "CPOs and admins can insert vendors"
  ON public.vendors FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'cpo') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "CPOs and admins can update vendors"
  ON public.vendors FOR UPDATE
  USING (has_role(auth.uid(), 'cpo') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "CPOs and admins can delete vendors"
  ON public.vendors FOR DELETE
  USING (has_role(auth.uid(), 'cpo') OR has_role(auth.uid(), 'admin'));

-- Create vendor_contacts table for additional contacts per vendor
CREATE TABLE IF NOT EXISTS public.vendor_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CPOs and admins can view vendor contacts"
  ON public.vendor_contacts FOR SELECT
  USING (has_role(auth.uid(), 'cpo') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "CPOs and admins can manage vendor contacts"
  ON public.vendor_contacts FOR ALL
  USING (has_role(auth.uid(), 'cpo') OR has_role(auth.uid(), 'admin'));

-- Create vendor_notes table for interaction history
CREATE TABLE IF NOT EXISTS public.vendor_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'meeting', 'call', 'email', 'contract', 'issue')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CPOs and admins can view vendor notes"
  ON public.vendor_notes FOR SELECT
  USING (has_role(auth.uid(), 'cpo') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "CPOs and admins can manage vendor notes"
  ON public.vendor_notes FOR ALL
  USING (has_role(auth.uid(), 'cpo') OR has_role(auth.uid(), 'admin'));
