// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

declare const EdgeRuntime: {
  waitUntil(promise: Promise<any>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type DriverPaySettings = {
  base_offer_cents: number;
  per_mile_cents: number;
  escalation_interval_minutes: number;
  escalation_sequence_cents: number[];
  max_offer_cents: number | null;
};

const DEFAULT_DRIVER_PAY_SETTINGS: DriverPaySettings = {
  base_offer_cents: 350,
  per_mile_cents: 100,
  escalation_interval_minutes: 2,
  escalation_sequence_cents: [100, 125, 125, 150],
  max_offer_cents: null,
};

function normalizeDriverPaySettings(row: any): DriverPaySettings {
  const sequenceRaw = Array.isArray(row?.escalation_sequence_cents)
    ? row.escalation_sequence_cents
    : DEFAULT_DRIVER_PAY_SETTINGS.escalation_sequence_cents;

  const escalation_sequence_cents = sequenceRaw
    .map((value: any) => Number(value))
    .filter((value: number) => Number.isFinite(value) && value >= 0);

  return {
    base_offer_cents: Number(row?.base_offer_cents ?? DEFAULT_DRIVER_PAY_SETTINGS.base_offer_cents),
    per_mile_cents: Number(row?.per_mile_cents ?? DEFAULT_DRIVER_PAY_SETTINGS.per_mile_cents),
    escalation_interval_minutes: Math.max(
      1,
      Number(row?.escalation_interval_minutes ?? DEFAULT_DRIVER_PAY_SETTINGS.escalation_interval_minutes)
    ),
    escalation_sequence_cents: escalation_sequence_cents.length
      ? escalation_sequence_cents
      : DEFAULT_DRIVER_PAY_SETTINGS.escalation_sequence_cents,
    max_offer_cents: row?.max_offer_cents == null ? null : Number(row.max_offer_cents),
  };
}

async function getDriverPaySettings(supabase: any): Promise<DriverPaySettings> {
  const { data } = await supabase
    .from('driver_payout_settings')
    .select('base_offer_cents, per_mile_cents, escalation_interval_minutes, escalation_sequence_cents, max_offer_cents')
    .eq('is_active', true)
    .maybeSingle();

  return normalizeDriverPaySettings(data);
}

function getOrderDistanceMiles(order: any): number {
  const distanceKm = Number(order?.distance_km ?? 0);
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 0;
  return distanceKm * 0.621371;
}

function calculateInitialOfferCents(order: any, settings: DriverPaySettings): number {
  const tipCents = Math.max(0, Number(order?.tip_cents ?? 0));
  const distanceMiles = getOrderDistanceMiles(order);
  const distanceComponent = Math.round(distanceMiles * settings.per_mile_cents);
  return Math.max(0, settings.base_offer_cents + distanceComponent + tipCents);
}

async function ensureOrderHasFrameworkStartingOffer(supabase: any, order: any, settings: DriverPaySettings): Promise<number> {
  const frameworkStart = calculateInitialOfferCents(order, settings);
  const currentPayout = Number(order?.payout_cents ?? 0);
  const nextPayout = currentPayout > 0 ? Math.max(currentPayout, frameworkStart) : frameworkStart;

  if (nextPayout !== currentPayout) {
    await supabase
      .from('orders')
      .update({ payout_cents: nextPayout })
      .eq('id', order.id);
  }

  return nextPayout;
}

async function escalateOrderPayoutIfNeeded(supabase: any, orderId: string, settings: DriverPaySettings) {
  const { data: order } = await supabase
    .from('orders')
    .select('id, payout_cents')
    .eq('id', orderId)
    .single();

  if (!order) return null;

  const { count } = await supabase
    .from('order_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', orderId)
    .in('status', ['declined', 'expired']);

  const rejectedOrExpiredCount = Number(count ?? 0);
  if (rejectedOrExpiredCount <= 0) return null;

  const sequence = settings.escalation_sequence_cents;
  const sequenceIndex = Math.min(rejectedOrExpiredCount - 1, sequence.length - 1);
  const increment = sequence[Math.max(0, sequenceIndex)] ?? 0;
  if (increment <= 0) return null;

  const currentPayout = Number(order.payout_cents ?? 0);
  const candidatePayout = currentPayout + increment;
  const cappedPayout = settings.max_offer_cents != null
    ? Math.min(candidatePayout, settings.max_offer_cents)
    : candidatePayout;

  if (cappedPayout <= currentPayout) return null;

  await supabase
    .from('orders')
    .update({ payout_cents: cappedPayout })
    .eq('id', orderId);

  return {
    previous_payout_cents: currentPayout,
    payout_cents: cappedPayout,
    escalation_message: 'Payout increased due to driver demand.',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { orderId } = await req.json();
    console.log('Auto-assigning order:', orderId);

    // Fetch order with restaurant coordinates
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`*, restaurants!inner(id, name, latitude, longitude)`)
      .eq('id', orderId)
      .in('order_status', ['pending', 'confirmed'])
      .single();

    if (orderError || !order) throw new Error('Order not found or not pending');

    const restaurant = order.restaurants;
    const paySettings = await getDriverPaySettings(supabase);
    const startingPayoutCents = await ensureOrderHasFrameworkStartingOffer(supabase, order, paySettings);
    order.payout_cents = startingPayoutCents;

    // Get available online drivers
    const { data: availableDrivers, error: driversError } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('status', 'online')
      .eq('is_available', true);

    if (driversError || !availableDrivers || availableDrivers.length === 0)
      throw new Error('No drivers available');

    // Calculate distance and priority
    const driversWithDistance: any[] = [];
    for (const driver of availableDrivers) {
      const { data: locationData } = await supabase
        .from('craver_locations')
        .select('lat, lng, updated_at')
        .eq('user_id', driver.user_id)
        .single();

      if (!locationData) continue;

      // Calculate distance only if restaurant has coordinates; otherwise don't filter by distance
      const hasCoords = restaurant.latitude != null && restaurant.longitude != null;
      let distanceMiles = 0;
      if (hasCoords) {
        const distanceResult = (await supabase.rpc('calculate_distance', {
          lat1: restaurant.latitude,
          lng1: restaurant.longitude,
          lat2: locationData.lat,
          lng2: locationData.lng
        })).data;
        distanceMiles = distanceResult ?? 999;
        if (distanceMiles > 10) continue;
      }


      const level = driver.driver_level ?? 1;
      const priority = calculateDriverPriority(Number(driver.rating) || 5, Number(level), Number(distanceMiles));

      driversWithDistance.push({ ...driver, distance: distanceMiles, location: locationData, priority });
    }

    if (driversWithDistance.length === 0)
      return new Response(JSON.stringify({ success: false, message: 'No drivers in range' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Sort by priority (nearest + best rating/level)
    driversWithDistance.sort((a, b) => b.priority - a.priority);

    // Assign order to drivers one by one until accepted
    for (const driver of driversWithDistance) {
      try {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + 45);

        const { data: assignment } = await supabase
          .from('order_assignments')
          .insert({
            order_id: orderId,
            driver_id: driver.user_id,
            status: 'pending',
            expires_at: expiresAt.toISOString()
          })
          .select()
          .single();

        const orderDistanceKm = Number(order.distance_km ?? 0);
        const notificationPayload = {
          type: 'order_assignment',
          assignment_id: assignment.id,
          order_id: orderId,
          restaurant_name: restaurant.name,
          pickup_address: order.pickup_address,
          dropoff_address: order.dropoff_address,
          payout_cents: order.payout_cents,
          distance_km: orderDistanceKm,
          distance_mi: (orderDistanceKm * 0.621371).toFixed(1),
          expires_at: assignment.expires_at,
          estimated_time: Math.ceil(orderDistanceKm * 2.5),
          tips_included: true,
        };

        // Send real-time notification via persistent channel (driver-specific)
        const channel = supabase.channel(`driver_${driver.user_id}`);
        await channel.subscribe();
        await channel.send({ type: 'broadcast', event: 'order_assignment', payload: notificationPayload });

        // Also broadcast on the common user notifications channel so clients listening there receive it
        const pickupText = typeof order.pickup_address === 'string'
          ? order.pickup_address
          : [order.pickup_address?.address, order.pickup_address?.city, order.pickup_address?.state]
              .filter(Boolean)
              .join(', ');
        const title = `New Order: ${restaurant.name || 'Pickup'}`;
        const message = `Pickup at ${pickupText || 'restaurant'}`;

        const userChannel = supabase.channel(`user_notifications_${driver.user_id}`);
        await userChannel.subscribe();
        await userChannel.send({
          type: 'broadcast',
          event: 'push_notification',
          payload: { title, message, data: notificationPayload }
        });

        // Persist a record in order_notifications for history
        await supabase.from('order_notifications').insert({
          user_id: driver.user_id,
          order_id: orderId,
          title,
          message,
          notification_type: 'order_assignment'
        });

        console.log(`Order assigned to driver: ${driver.user_id} with priority ${driver.priority}`);

        // Set up background monitoring without blocking POS response
        EdgeRuntime.waitUntil(
          monitorAssignmentAcceptance(
            supabase,
            assignment.id,
            orderId,
            driversWithDistance.slice(driversWithDistance.indexOf(driver) + 1),
            paySettings
          )
        );

        return new Response(JSON.stringify({
          success: true,
          assignment_id: assignment.id,
          driver_id: driver.user_id,
          message: 'Order assigned successfully'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      } catch (err) {
        console.warn(`Driver ${driver.user_id} failed to accept or error occurred. Trying next driver.`);
        continue;
      }
    }

    return new Response(JSON.stringify({ success: false, message: 'Failed to assign order to any driver' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });

  } catch (err) {
    console.error('Auto-assignment error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});

// Monitor assignment acceptance in background and handle fallback to next driver
async function monitorAssignmentAcceptance(
  supabase,
  assignmentId: string,
  orderId: string,
  remainingDrivers: any[],
  paySettings: DriverPaySettings
) {
  const interval = 2000; // Check every 2 seconds
  const maxChecks = 22; // 45 seconds total (45/2 = 22.5)
  let checks = 0;

  while (checks < maxChecks) {
    try {
      const { data: assignment } = await supabase
        .from('order_assignments')
        .select('status')
        .eq('id', assignmentId)
        .single();
      
      if (assignment?.status === 'accepted') {
        console.log(`Assignment ${assignmentId} accepted by driver`);
        return true;
      }
      
      if (assignment?.status === 'declined') {
        console.log(`Assignment ${assignmentId} declined, trying next driver`);
        break;
      }
      
      await new Promise(res => setTimeout(res, interval));
      checks++;
    } catch (error) {
      console.error('Error checking assignment status:', error);
      break;
    }
  }

  // Mark assignment expired if not accepted
  await supabase
    .from('order_assignments')
    .update({ status: 'expired' })
    .eq('id', assignmentId);

  const escalation = await escalateOrderPayoutIfNeeded(supabase, orderId, paySettings);

  // Try next available drivers if any
  if (remainingDrivers.length > 0) {
    console.log(`Assignment expired, trying next ${remainingDrivers.length} drivers`);
    await assignToNextDriver(supabase, orderId, remainingDrivers, paySettings, escalation?.escalation_message);
  } else {
    console.log(`No remaining drivers in current list, initiating continuous retry for order ${orderId}`);
    // Start continuous retry cycle instead of giving up
    await continuousOrderAssignment(supabase, orderId, paySettings);
  }
  
  return false;
}

// Assign order to next available driver in the list
async function assignToNextDriver(
  supabase,
  orderId: string,
  drivers: any[],
  paySettings: DriverPaySettings,
  escalationMessage?: string
) {
  for (const driver of drivers) {
    try {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + 45);

      const { data: assignment } = await supabase
        .from('order_assignments')
        .insert({
          order_id: orderId,
          driver_id: driver.user_id,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      // Get order and restaurant details for notification
      const { data: order } = await supabase
        .from('orders')
        .select(`*, restaurants!inner(id, name, latitude, longitude)`)
        .eq('id', orderId)
        .single();

      if (!order) continue;

      const restaurant = order.restaurants;
      const orderDistanceKm = Number(order.distance_km ?? 0);
      const notificationPayload = {
        type: 'order_assignment',
        assignment_id: assignment.id,
        order_id: orderId,
        restaurant_name: restaurant.name,
        pickup_address: order.pickup_address,
        dropoff_address: order.dropoff_address,
        payout_cents: order.payout_cents,
        distance_km: orderDistanceKm,
        distance_mi: (orderDistanceKm * 0.621371).toFixed(1),
        expires_at: assignment.expires_at,
        estimated_time: Math.ceil(orderDistanceKm * 2.5),
        escalation_message: escalationMessage,
        tips_included: true,
      };

      // Send notifications
      const channel = supabase.channel(`driver_${driver.user_id}`);
      await channel.subscribe();
      await channel.send({ type: 'broadcast', event: 'order_assignment', payload: notificationPayload });

      const pickupText = typeof order.pickup_address === 'string'
        ? order.pickup_address
        : [order.pickup_address?.address, order.pickup_address?.city, order.pickup_address?.state]
            .filter(Boolean)
            .join(', ');
      const title = `New Order: ${restaurant.name || 'Pickup'}`;
      const message = `Pickup at ${pickupText || 'restaurant'}`;

      const userChannel = supabase.channel(`user_notifications_${driver.user_id}`);
      await userChannel.subscribe();
      await userChannel.send({
        type: 'broadcast',
        event: 'push_notification',
        payload: { title, message, data: notificationPayload }
      });

      await supabase.from('order_notifications').insert({
        user_id: driver.user_id,
        order_id: orderId,
        title,
        message,
        notification_type: 'order_assignment'
      });

      console.log(`Fallback assignment created for driver: ${driver.user_id}`);
      
      // Continue monitoring this new assignment
      const remainingDrivers = drivers.slice(drivers.indexOf(driver) + 1);
      EdgeRuntime.waitUntil(
        monitorAssignmentAcceptance(supabase, assignment.id, orderId, remainingDrivers, paySettings)
      );
      
      return true;
    } catch (error) {
      console.error(`Failed to assign to driver ${driver.user_id}:`, error);
      continue;
    }
  }
  
  // If we've exhausted this batch of drivers, start continuous retry
  console.log(`Exhausted current driver batch, starting continuous retry for order ${orderId}`);
  EdgeRuntime.waitUntil(continuousOrderAssignment(supabase, orderId, paySettings));
  return false;
}

// Continuous order assignment - keeps trying until order is accepted or cancelled
async function continuousOrderAssignment(
  supabase,
  orderId: string,
  paySettings: DriverPaySettings,
  searchRadius: number = 10
) {
  const maxSearchRadius = 50; // Max 50 miles
  const baseRetryInterval = paySettings.escalation_interval_minutes * 60 * 1000;
  const maxRetries = 120; // Safety cap for prolonged retries
  let retryCount = 0;
  let currentRadius = searchRadius;

  console.log(`Starting continuous assignment for order ${orderId} with ${currentRadius} mile radius`);

  while (retryCount < maxRetries) {
    try {
      // Check if order is still pending
      const { data: order } = await supabase
        .from('orders')
        .select(`*, restaurants!inner(id, name, latitude, longitude)`)
        .eq('id', orderId)
        .in('order_status', ['pending', 'confirmed'])
        .single();

      if (!order) {
        console.log(`Order ${orderId} no longer pending, stopping continuous assignment`);
        return;
      }

      // Check if there's already an accepted assignment
      const { data: existingAssignment } = await supabase
        .from('order_assignments')
        .select('status')
        .eq('order_id', orderId)
        .eq('status', 'accepted')
        .single();

      if (existingAssignment) {
        console.log(`Order ${orderId} already has accepted assignment, stopping continuous assignment`);
        return;
      }

      const restaurant = order.restaurants;

      // Get available drivers with expanded radius
      const { data: availableDrivers } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('status', 'online')
        .eq('is_available', true);

      if (availableDrivers && availableDrivers.length > 0) {
        // Filter drivers that haven't been tried recently (within last 10 minutes)
        const tenMinutesAgo = new Date();
        tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

        const { data: recentAssignments } = await supabase
          .from('order_assignments')
          .select('driver_id')
          .eq('order_id', orderId)
          .gte('created_at', tenMinutesAgo.toISOString());

        const recentDriverIds = new Set(recentAssignments?.map(a => a.driver_id) || []);

        // Calculate distance and priority for available drivers
        const driversWithDistance: any[] = [];
        for (const driver of availableDrivers) {
          // Skip drivers tried recently unless we're expanding radius significantly
          if (recentDriverIds.has(driver.user_id) && currentRadius < 25) continue;

          const { data: locationData } = await supabase
            .from('craver_locations')
            .select('lat, lng, updated_at')
            .eq('user_id', driver.user_id)
            .single();

          if (!locationData) continue;

          // Calculate distance
          const hasCoords = restaurant.latitude != null && restaurant.longitude != null;
          let distanceMiles = 0;
          if (hasCoords) {
            const distanceResult = (await supabase.rpc('calculate_distance', {
              lat1: restaurant.latitude,
              lng1: restaurant.longitude,
              lat2: locationData.lat,
              lng2: locationData.lng
            })).data;
            distanceMiles = distanceResult ?? 999;
            if (distanceMiles > currentRadius) continue;
          }

          const level = driver.driver_level ?? 1;
          const priority = calculateDriverPriority(Number(driver.rating) || 5, Number(level), Number(distanceMiles));

          driversWithDistance.push({ ...driver, distance: distanceMiles, location: locationData, priority });
        }

        if (driversWithDistance.length > 0) {
          driversWithDistance.sort((a, b) => b.priority - a.priority);
          console.log(`Found ${driversWithDistance.length} drivers within ${currentRadius} miles for order ${orderId}`);
          
          // Try to assign to the best available driver
          const escalation = retryCount > 0
            ? await escalateOrderPayoutIfNeeded(supabase, orderId, paySettings)
            : null;
          const success = await assignToNextDriver(
            supabase,
            orderId,
            driversWithDistance,
            paySettings,
            escalation?.escalation_message
          );
          if (success) {
            console.log(`Continuous assignment successful for order ${orderId}`);
            return;
          }
        }
      }

      // Expand search radius if no drivers found
      if (currentRadius < maxSearchRadius) {
        currentRadius = Math.min(currentRadius + 5, maxSearchRadius);
        console.log(`Expanding search radius to ${currentRadius} miles for order ${orderId}`);
      }

      retryCount++;
      console.log(`Continuous assignment attempt ${retryCount} failed for order ${orderId}, retrying in ${baseRetryInterval/1000} seconds`);
      
      // Wait before next attempt
      await new Promise(res => setTimeout(res, baseRetryInterval));

    } catch (error) {
      console.error(`Continuous assignment error for order ${orderId}:`, error);
      retryCount++;
      await new Promise(res => setTimeout(res, baseRetryInterval));
    }
  }

  console.log(`Continuous assignment exceeded max retries for order ${orderId}`);
}

// Driver priority: higher rating/level + closer distance
function calculateDriverPriority(rating: number, level: number, distance: number): number {
  const ratingScore = (rating / 5) * 50;
  const levelScore = (level - 1) * 10;
  const distanceScore = Math.max(0, 30 - (distance * 3));
  return ratingScore + levelScore + distanceScore;
}
