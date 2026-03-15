import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, driverId, deliveryPhotoUrl, pickupPhotoUrl } = await req.json();

    if (!orderId) throw new Error("Missing orderId");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, customer_id, driver_id, assigned_craver_id, subtotal_cents, tip_cents, payout_cents, distance_km, pickup_confirmed_at, order_status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) throw orderError ?? new Error("Order not found");

    // Determine driver id
    const resolvedDriverId = driverId || order.driver_id || order.assigned_craver_id;
    if (!resolvedDriverId) throw new Error("Driver not assigned to this order");

    // Prepare order update data
    const updateData: any = {
      order_status: 'delivered',
      driver_id: resolvedDriverId
    };

    // Add photo URLs if provided
    if (deliveryPhotoUrl) {
      updateData.delivery_photo_url = deliveryPhotoUrl;
    }
    if (pickupPhotoUrl) {
      updateData.pickup_photo_url = pickupPhotoUrl;
    }

    // Update order status to delivered and add photos
    if (order.order_status !== 'delivered') {
      const { error: statusErr } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);
      if (statusErr) throw statusErr;
    }

    // Get active payout setting (distance + wait pay model; legacy percentage kept for backward compatibility)
    const { data: setting } = await supabase
      .from('driver_payout_settings')
      .select('percentage, base_offer_cents, per_mile_cents, wait_pay_grace_minutes, wait_pay_per_minute_cents')
      .eq('is_active', true)
      .maybeSingle();

    const tip = Number(order.tip_cents ?? 0);
    const distanceKm = Number(order.distance_km ?? 0);
    const distanceMiles = Math.max(0, distanceKm * 0.621371);
    const baseOfferCents = Number(setting?.base_offer_cents ?? 350);
    const perMileCents = Number(setting?.per_mile_cents ?? 100);
    const waitGraceMinutes = Number(setting?.wait_pay_grace_minutes ?? 10);
    const waitPayPerMinuteCents = Number(setting?.wait_pay_per_minute_cents ?? 100);

    // If order payout isn't set, derive a framework-aligned offer.
    const fallbackOffer = Math.max(0, baseOfferCents + Math.round(distanceMiles * perMileCents) + tip);
    const offerPayout = Number(order.payout_cents ?? fallbackOffer);

    // Pull arrival data from the accepted assignment so wait pay only covers true in-restaurant waits.
    const { data: acceptedAssignment } = await supabase
      .from('order_assignments')
      .select('arrived_at_restaurant_at')
      .eq('order_id', orderId)
      .eq('driver_id', resolvedDriverId)
      .eq('status', 'accepted')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let waitPayCents = 0;
    let paidWaitMinutes = 0;
    if (acceptedAssignment?.arrived_at_restaurant_at && order.pickup_confirmed_at) {
      const arrivedAtMs = new Date(acceptedAssignment.arrived_at_restaurant_at).getTime();
      const pickupConfirmedMs = new Date(order.pickup_confirmed_at).getTime();
      const waitedMinutes = Math.max(0, Math.floor((pickupConfirmedMs - arrivedAtMs) / 60000));
      paidWaitMinutes = Math.max(0, waitedMinutes - waitGraceMinutes);
      waitPayCents = paidWaitMinutes * waitPayPerMinuteCents;
    }

    const basePay = Math.max(0, offerPayout - tip) + waitPayCents;
    const total = offerPayout + waitPayCents;

    // Insert driver_earnings record (idempotent-ish: avoid duplicates for same order)
    // Try delete existing then insert to keep it simple
    await supabase.from('driver_earnings').delete().eq('order_id', orderId).eq('driver_id', resolvedDriverId);

    const { error: earnErr } = await supabase.from('driver_earnings').insert({
      driver_id: resolvedDriverId,
      order_id: orderId,
      amount_cents: basePay,
      tip_cents: tip,
      total_cents: total,
      payout_cents: total,
    });

    if (earnErr) throw earnErr;

    console.log('Delivery finalized:', {
      orderId,
      driverId: resolvedDriverId,
      earnings: total / 100,
      hasPickupPhoto: !!pickupPhotoUrl,
      hasDeliveryPhoto: !!deliveryPhotoUrl
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        percentage: Number(setting?.percentage ?? 70),
        basePay, 
        tip, 
        total,
        offerPayout,
        waitPayCents,
        paidWaitMinutes,
        photos: {
          pickup: pickupPhotoUrl,
          delivery: deliveryPhotoUrl
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('finalize-delivery error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
