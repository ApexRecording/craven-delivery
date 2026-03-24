# Merchant Commission Tiers (15% Cap) — Detailed Breakdown

This document explains the merchant commission **tiers (sometimes called "tears")** when the maximum commission is capped at **15%**.

---

## 1) Commission Cap Rule

- **Maximum merchant commission:** `15%`
- Any merchant commission setup should stay at or below this cap.

---

## 2) Merchant Plan Instances (from pricing plans)

Merchant plan rates are stored in `pricing_plans` and shown in the merchant pricing dashboard.

### Plan tiers and rates

| Plan Tier | Delivery Commission | Pickup Commission | Relation to 15% Cap |
|---|---:|---:|---|
| Basic | 15% | 10% | At cap |
| Standard | 12% | 8% | Below cap |
| Premium | 10% | 5% | Below cap |
| Enterprise | 8% | 3% | Below cap |

---

## 3) Percentages Below 15%

If 15% is the ceiling, these are the **merchant commission percentages below the cap**:

### Delivery commission rates below 15%
- **12%**
- **10%**
- **8%**

### Pickup commission rates below 15%
- **10%**
- **8%**
- **5%**
- **3%**

---

## 4) What each tier means for merchants

### Basic (15% delivery / 10% pickup)
- Entry tier at the maximum allowed delivery rate.
- Useful when a merchant is on the baseline plan and still within cap policy.

### Standard (12% delivery / 8% pickup)
- Mid-lower commission tier.
- Merchant keeps more margin per order than Basic.

### Premium (10% delivery / 5% pickup)
- Lower commission tier for stronger merchant economics.
- Better unit economics for high-volume or strategic merchants.

### Enterprise (8% delivery / 3% pickup)
- Lowest seeded commission tier.
- Designed for top-tier partnerships and highest retention economics.

---

## 5) Merchant-facing instances where these rates appear

1. **Pricing Plans Dashboard (`All plans`)**
   - Displays all plans dynamically from `pricing_plans`.
   - No hardcoded commission percentages in the current UI cards.

2. **Pricing Plans Dashboard (`Your plan`)**
   - Displays the merchant’s current plan rates (delivery + pickup).
   - Pulls current plan values from the same `pricing_plans` source.

3. **Plan definition source**
   - Seeded in migration file for `pricing_plans`.
   - Current seeded plan set uses 15% max delivery, with lower tiers at 12/10/8.

---

## 6) Important implementation note (runtime calculations vs plan display)

At present, merchant plan tiers are the merchant-facing plan definitions.  
However, fee/payout runtime paths can also depend on active commission settings.

To keep merchant experience and financial calculations fully aligned with the 15% cap:
- keep plan rates at `<= 15%`,
- and ensure active runtime commission settings also remain `<= 15%`.

---

## 7) Quick summary

- **Cap:** 15%
- **Below-cap merchant delivery rates:** 12%, 10%, 8%
- **Below-cap merchant pickup rates:** 10%, 8%, 5%, 3%
- **Tier ladder:** Basic → Standard → Premium → Enterprise

