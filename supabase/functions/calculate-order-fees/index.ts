import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderData {
  subtotal_cents: number;
  restaurant_id: string;
  delivery_address: {
    lat: number;
    lng: number;
  };
  pickup_address: {
    lat: number;
    lng: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { orderData }: { orderData: OrderData } = await req.json();

    // Get commission settings
    const { data: settings } = await supabase
      .from('commission_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!settings) {
      throw new Error('Commission settings not found');
    }

    // Calculate distance using Haversine formula
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const distance = calculateDistance(
      orderData.pickup_address.lat,
      orderData.pickup_address.lng,
      orderData.delivery_address.lat,
      orderData.delivery_address.lng
    );

    // Check if it's peak hours (5-8 PM or 11 AM - 1 PM)
    const now = new Date();
    const hour = now.getHours();
    const isPeakHour = (hour >= 17 && hour <= 20) || (hour >= 11 && hour <= 13);
    
    // Calculate fees
    const serviceFeeCents = Math.round(orderData.subtotal_cents * (settings.customer_service_fee_percent / 100));
    
    let deliveryFeeCents = settings.delivery_fee_base_cents + Math.round(distance * settings.delivery_fee_per_mile_cents);
    if (isPeakHour) {
      deliveryFeeCents = Math.round(deliveryFeeCents * settings.peak_hour_multiplier);
    }

    const restaurantCommissionCents = Math.round(orderData.subtotal_cents * (settings.restaurant_commission_percent / 100));
    
    const totalCents = orderData.subtotal_cents + serviceFeeCents + deliveryFeeCents;
    const restaurantEarningsCents = orderData.subtotal_cents - restaurantCommissionCents;
    const craveNEarningsCents = restaurantCommissionCents + serviceFeeCents + deliveryFeeCents;

    return new Response(
      JSON.stringify({
        subtotal_cents: orderData.subtotal_cents,
        service_fee_cents: serviceFeeCents,
        delivery_fee_cents: deliveryFeeCents,
        total_cents: totalCents,
        restaurant_commission_cents: restaurantCommissionCents,
        restaurant_earnings_cents: restaurantEarningsCents,
        craven_earnings_cents: craveNEarningsCents,
        distance_miles: distance,
        is_peak_hour: isPeakHour,
        fee_breakdown: {
          base_delivery_fee: settings.delivery_fee_base_cents,
          distance_fee: Math.round(distance * settings.delivery_fee_per_mile_cents),
          peak_multiplier: isPeakHour ? settings.peak_hour_multiplier : 1,
          service_fee_percent: settings.customer_service_fee_percent,
          commission_percent: settings.restaurant_commission_percent
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error calculating order fees:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});