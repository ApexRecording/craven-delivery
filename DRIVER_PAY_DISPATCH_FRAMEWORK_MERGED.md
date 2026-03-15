# CRAVE'N Driver Pay & Dispatch Framework (Merged Implementation)

This document merges the executive framework with the current Crave'n codebase implementation.

## 1) Core Principles in Production

### Driver Transparency
- Drivers are shown full offer payout before accept in the assignment modal.
- Offers now use `orders.payout_cents` directly (full payout), with tip inclusion messaging.
- Escalated offers include the driver-facing message:
  - **"Payout increased due to driver demand."**

### Distance-Based Fairness
- Default starting offer formula (configurable):
  - `base_offer_cents + (per_mile_cents * distance_miles) + tip_cents`
- Defaults:
  - Base: **$3.50**
  - Per mile: **$1.00**

### Dynamic Market Pricing
- If assignments are declined/expired, payout escalates automatically.
- Escalation uses a configurable sequence (default):
  - **$1.00, $1.25, $1.25, $1.50**
- Optional `max_offer_cents` cap is supported.

### Driver Time Protection (Wait Pay)
- Driver arrival at restaurant is captured on arrival action.
- Pickup confirmation timestamp is captured at pickup completion.
- Wait pay formula:
  - `max(0, waited_minutes - wait_pay_grace_minutes) * wait_pay_per_minute_cents`
- Defaults:
  - Grace period: **10 minutes**
  - Wait pay: **$1.00/minute** after grace

### Efficient Dispatching
- Dispatch remains proximity and quality weighted:
  - Distance, rating, level, availability.
- Assignment retries continue until accepted or safety cap is reached.

---

## 2) Admin-Configurable Pay Controls

`driver_payout_settings` now supports:
- `base_offer_cents`
- `per_mile_cents`
- `wait_pay_grace_minutes`
- `wait_pay_per_minute_cents`
- `escalation_interval_minutes`
- `escalation_sequence_cents`
- `max_offer_cents` (optional)

The admin payout settings UI now manages this full framework.

---

## 3) Code Paths Updated

- **Dispatch + Escalation**
  - `supabase/functions/auto-assign-orders/index.ts`
- **Delivery Finalization + Wait Pay**
  - `supabase/functions/finalize-delivery/index.ts`
- **Driver Offer UI (full payout + escalation message)**
  - `src/components/mobile/OrderAssignmentModal.tsx`
- **Driver accept/decline status updates**
  - `src/components/mobile/MobileDriverDashboard.tsx`
- **Arrival + pickup timestamps for wait-pay computation**
  - `src/components/mobile/ActiveDeliveryFlow.tsx`
- **Admin payout controls**
  - `src/components/admin/PayoutSettingsManager.tsx`
- **Schema migration**
  - `supabase/migrations/20260315000100_driver_pay_dispatch_framework.sql`

---

## 4) Policy Mapping Notes

- **Acceptance freedom policy:** dispatch priority logic does not use acceptance rate as an assignment priority input.
- **Driver protection:** existing delivery proof flow (photos + timestamps) remains in place and is now paired with payout framework improvements.
- **Supply control:** waitlist/capacity infrastructure exists in the platform and can be tuned independently from payout mechanics.

---

## 5) KPI Targets (Ops / Finance)

Recommended KPI tracking targets aligned to the framework:
- Driver payout per order: **$9–$12**
- Platform contribution per delivery: **$5–$7**
- Completion time: **25–35 min**
- Acceptance rate: **>85%**
- Escalation beyond 6 min: **<10% of orders**
