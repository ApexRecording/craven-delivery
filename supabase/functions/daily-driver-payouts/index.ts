import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DriverEarning {
  driver_id: string;
  amount: number;
  payment_method: {
    id: string;
    payment_type: string;
    account_identifier: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting daily driver payouts process");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const payoutDate = yesterday.toISOString().split('T')[0];

    console.log(`Processing payouts for date: ${payoutDate}`);

    // Check if batch already exists
    const { data: existingBatch } = await supabase
      .from('daily_payout_batches')
      .select('*')
      .eq('payout_date', payoutDate)
      .single();

    if (existingBatch && existingBatch.status === 'completed') {
      console.log(`Payouts already completed for ${payoutDate}`);
      return new Response(
        JSON.stringify({ message: "Payouts already completed for this date" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all drivers with earnings from yesterday and their payment methods
    const { data: driversWithEarnings, error: driversError } = await supabase
      .from('driver_earnings')
      .select(`
        driver_id,
        amount,
        driver_payment_methods!inner(
          id,
          payment_type,
          account_identifier,
          is_primary
        )
      `)
      .gte('created_at', `${payoutDate}T00:00:00Z`)
      .lt('created_at', `${payoutDate}T23:59:59Z`)
      .eq('driver_payment_methods.is_primary', true);

    if (driversError) {
      throw new Error(`Failed to fetch driver earnings: ${driversError.message}`);
    }

    if (!driversWithEarnings || driversWithEarnings.length === 0) {
      console.log("No drivers with earnings found for yesterday");
      return new Response(
        JSON.stringify({ message: "No drivers with earnings found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Aggregate earnings by driver
    const driverEarnings = new Map<string, DriverEarning>();
    
    driversWithEarnings.forEach((earning: any) => {
      const driverId = earning.driver_id;
      if (driverEarnings.has(driverId)) {
        driverEarnings.get(driverId)!.amount += earning.amount;
      } else {
        driverEarnings.set(driverId, {
          driver_id: driverId,
          amount: earning.amount,
          payment_method: earning.driver_payment_methods
        });
      }
    });

    const totalAmount = Array.from(driverEarnings.values()).reduce((sum, earning) => sum + earning.amount, 0);
    const totalDrivers = driverEarnings.size;

    console.log(`Found ${totalDrivers} drivers with total earnings of $${totalAmount}`);

    // Create or update payout batch
    const { data: payoutBatch, error: batchError } = await supabase
      .from('daily_payout_batches')
      .upsert({
        payout_date: payoutDate,
        total_amount: totalAmount,
        total_drivers: totalDrivers,
        status: 'processing'
      })
      .select()
      .single();

    if (batchError) {
      throw new Error(`Failed to create payout batch: ${batchError.message}`);
    }

    // Process individual payouts
    const payoutPromises = Array.from(driverEarnings.values()).map(async (earning) => {
      try {
        console.log(`Processing payout for driver ${earning.driver_id}: $${earning.amount} to ${earning.payment_method.account_identifier}`);

        // Create payout record
        const { data: payoutRecord, error: payoutError } = await supabase
          .from('driver_payouts')
          .insert({
            batch_id: payoutBatch.id,
            driver_id: earning.driver_id,
            payment_method_id: earning.payment_method.id,
            amount: earning.amount,
            status: 'pending'
          })
          .select()
          .single();

        if (payoutError) {
          throw new Error(`Failed to create payout record: ${payoutError.message}`);
        }

        // Simulate Cash App payment (replace with actual Cash App API when available)
        const paymentResult = await simulateCashAppPayout(earning);

        // Update payout record with result
        await supabase
          .from('driver_payouts')
          .update({
            status: paymentResult.success ? 'completed' : 'failed',
            external_transaction_id: paymentResult.transactionId,
            error_message: paymentResult.error,
            processed_at: new Date().toISOString()
          })
          .eq('id', payoutRecord.id);

        return { success: paymentResult.success, driver_id: earning.driver_id };
      } catch (error) {
        console.error(`Error processing payout for driver ${earning.driver_id}:`, error);
        return { success: false, driver_id: earning.driver_id, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    const payoutResults = await Promise.all(payoutPromises);
    const successfulPayouts = payoutResults.filter(result => result.success).length;
    const failedPayouts = payoutResults.filter(result => !result.success).length;

    // Update batch status
    const batchStatus = failedPayouts === 0 ? 'completed' : 'failed';
    await supabase
      .from('daily_payout_batches')
      .update({
        status: batchStatus,
        processed_at: new Date().toISOString()
      })
      .eq('id', payoutBatch.id);

    console.log(`Payout batch completed: ${successfulPayouts} successful, ${failedPayouts} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        batch_id: payoutBatch.id,
        total_drivers: totalDrivers,
        total_amount: totalAmount,
        successful_payouts: successfulPayouts,
        failed_payouts: failedPayouts,
        results: payoutResults
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Daily payout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

// Simulate Cash App payout (replace with actual Cash App API)
async function simulateCashAppPayout(earning: DriverEarning) {
  // This is a simulation - replace with actual Cash App Business API
  console.log(`Simulating Cash App payout: $${earning.amount} to ${earning.payment_method.account_identifier}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For now, simulate 95% success rate
  const success = Math.random() > 0.05;
  
  if (success) {
    return {
      success: true,
      transactionId: `cashapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      error: null
    };
  } else {
    return {
      success: false,
      transactionId: null,
      error: "Cash App payment failed - insufficient funds or invalid account"
    };
  }
}