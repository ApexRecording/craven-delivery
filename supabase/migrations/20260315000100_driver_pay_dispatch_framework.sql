-- Driver pay & dispatch framework: configurable distance pay, escalation, and wait-pay

-- Expand payout settings to support distance-based offers, escalation, and wait pay.
ALTER TABLE public.driver_payout_settings
ADD COLUMN IF NOT EXISTS base_offer_cents INTEGER NOT NULL DEFAULT 350,
ADD COLUMN IF NOT EXISTS per_mile_cents INTEGER NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS wait_pay_grace_minutes INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS wait_pay_per_minute_cents INTEGER NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS escalation_interval_minutes INTEGER NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS escalation_sequence_cents INTEGER[] NOT NULL DEFAULT ARRAY[100, 125, 125, 150],
ADD COLUMN IF NOT EXISTS max_offer_cents INTEGER;

-- Track when the driver arrives at the restaurant so wait pay can be calculated.
ALTER TABLE public.order_assignments
ADD COLUMN IF NOT EXISTS arrived_at_restaurant_at TIMESTAMPTZ;

-- Backfill active/default settings safely for existing rows.
UPDATE public.driver_payout_settings
SET
  base_offer_cents = COALESCE(base_offer_cents, 350),
  per_mile_cents = COALESCE(per_mile_cents, 100),
  wait_pay_grace_minutes = COALESCE(wait_pay_grace_minutes, 10),
  wait_pay_per_minute_cents = COALESCE(wait_pay_per_minute_cents, 100),
  escalation_interval_minutes = COALESCE(escalation_interval_minutes, 2),
  escalation_sequence_cents = COALESCE(escalation_sequence_cents, ARRAY[100, 125, 125, 150]);

-- Reasonable guards.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'driver_payout_settings_base_offer_non_negative'
  ) THEN
    ALTER TABLE public.driver_payout_settings
      ADD CONSTRAINT driver_payout_settings_base_offer_non_negative
      CHECK (base_offer_cents >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'driver_payout_settings_per_mile_non_negative'
  ) THEN
    ALTER TABLE public.driver_payout_settings
      ADD CONSTRAINT driver_payout_settings_per_mile_non_negative
      CHECK (per_mile_cents >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'driver_payout_settings_wait_pay_non_negative'
  ) THEN
    ALTER TABLE public.driver_payout_settings
      ADD CONSTRAINT driver_payout_settings_wait_pay_non_negative
      CHECK (wait_pay_grace_minutes >= 0 AND wait_pay_per_minute_cents >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'driver_payout_settings_escalation_interval_positive'
  ) THEN
    ALTER TABLE public.driver_payout_settings
      ADD CONSTRAINT driver_payout_settings_escalation_interval_positive
      CHECK (escalation_interval_minutes > 0);
  END IF;
END
$$;
