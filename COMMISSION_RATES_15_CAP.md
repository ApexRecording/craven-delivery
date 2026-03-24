# Commission Rate Instances (15% Cap)

This document explains **where commission rates are defined, displayed, and used** across the codebase, with the business rule that commission rates should **never exceed 15%**.

## Policy

- **Commission cap:** `<= 15%`
- Applies to merchant-facing commission rates used for fee and payout calculations.

## How commission is currently applied at runtime

The active fee/payout calculations are currently sourced from `commission_settings`:

1. `supabase/functions/calculate-order-fees/index.ts`
   - Reads active `commission_settings.restaurant_commission_percent`
   - Calculates:
     - `restaurant_commission_cents = subtotal * restaurant_commission_percent`
2. `supabase/functions/calculate-restaurant-payouts/index.ts`
   - Reads active `commission_settings.restaurant_commission_percent`
   - Calculates:
     - `totalCommission = totalRevenue * commissionRate`

**Important:** these functions do not currently enforce a hard `<= 15` clamp in code.

---

## Commission-rate instances

| Area | File / Table | Current behavior | 15% cap status |
|---|---|---|---|
| Global commission source-of-truth | `public.commission_settings` in `supabase/migrations/20250928043940_8a613f0a-1584-4623-aa04-ccec338ef66f.sql` | Has `restaurant_commission_percent` (default 10), no DB CHECK cap | **Not hard-enforced** |
| Admin global settings UI | `src/components/admin/commission/components/GlobalSettings.tsx` | Slider/input allows 5 to 25 | **Not capped at 15 in UI** |
| Legacy admin settings UI | `src/components/admin/CommissionSettingsManager.tsx` | Slider/input allows 5 to 25 | **Not capped at 15 in UI** |
| Enhanced tier table | `commission_tiers` in `supabase/migrations/20250120000003_enhanced_commission_system.sql` | Default seed includes `18, 15, 12, 10, 8` | **Contains value above cap (18)** |
| Tier editing UI | `src/components/admin/commission/components/TierManagement.tsx` | Editable numeric input, no max validation | **Not capped at 15 in UI** |
| Restaurant overrides table | `restaurant_commission_overrides` in `supabase/migrations/20250120000003_enhanced_commission_system.sql` | Stores custom `commission_percent`, no DB CHECK cap | **Not hard-enforced** |
| Restaurant overrides UI | `src/components/admin/commission/components/RestaurantOverrides.tsx` | Input `max="30"` | **Not capped at 15 in UI** |
| Merchant pricing plans table | `pricing_plans` in `supabase/migrations/20251017165904_8bcd90d3-f0ae-41bf-ae12-f8f9e8675947.sql` | Seeded delivery rates `15,12,10,8` (pickup lower) | **Compliant** |
| Merchant pricing page static text | `src/components/restaurant/dashboard/settings/PricingPlansDashboard.tsx` | Contains hardcoded `25%` and `30%` examples in card copy | **Not compliant in copy** |

---

## Practical interpretation of "never above 15%"

Given current runtime behavior, the most critical value is:

- `commission_settings.restaurant_commission_percent` (active row)

If this active value is `<= 15`, the current fee/payout functions will compute commission at or below 15%.

However, there are still other stored/displayed paths that can exceed 15% unless constrained:

- Tier seeds/edits
- Override inputs/data
- Static pricing copy

---

## Suggested guardrails (for full enforcement)

To make the 15% cap technically guaranteed everywhere:

1. Add DB CHECK constraints on commission percent columns (cap at 15).
2. Add server-side clamping/validation in fee and payout functions.
3. Update admin UI max values from 25/30 to 15.
4. Update tier seed data so no tier is above 15.
5. Remove/update hardcoded 25% and 30% pricing copy.

---

## Quick reference summary

- **Runtime commission calculations:** use `commission_settings`.
- **Current hard cap enforcement:** not universal.
- **Policy target:** never above 15%.
- **Current compliant seeded plan rates:** max 15 in `pricing_plans`.
