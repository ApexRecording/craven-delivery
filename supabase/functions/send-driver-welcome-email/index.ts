import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface DriverWelcomeEmailRequest {
  driverName: string;
  driverEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { driverName, driverEmail }: DriverWelcomeEmailRequest = await req.json();

    console.log(`Sending driver onboarding welcome email to ${driverEmail}`);

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Crave'N <onboarding@resend.dev>";

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [driverEmail],
      subject: "🎉 You're Approved! Complete Your Onboarding",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header with Orange Banner -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">🎉 Congratulations!</h1>
                        <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 18px;">You're Approved!</p>
                      </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px;">Hi ${driverName}! 👋</h2>
                        
                        <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                          Great news! Your application to become a Crave'N driver has been <strong>approved</strong>. Welcome to the team! 🚗🍔
                        </p>
                        
                        <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 30px 0;">
                          <h3 style="margin: 0 0 15px 0; color: #2e7d32; font-size: 18px;">💵 First Delivery Bonus</h3>
                          <p style="margin: 0; color: #2e7d32; font-size: 15px; line-height: 1.6;">
                            Earn an extra <strong>$25</strong> when you complete your first delivery!
                          </p>
                        </div>
                        
                        <div style="background-color: #fff5ec; border-left: 4px solid #ff6b00; padding: 20px; margin: 30px 0;">
                          <h3 style="margin: 0 0 15px 0; color: #ff6b00; font-size: 18px;">📋 What's Next?</h3>
                          <p style="margin: 0 0 15px 0; color: #4a4a4a; font-size: 15px; line-height: 1.8;">
                            Complete a quick 10-15 minute onboarding process to get started:
                          </p>
                          <ol style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 15px; line-height: 1.8;">
                            <li>Watch a short orientation video</li>
                            <li>Pass a simple safety quiz</li>
                            <li>Complete your W-9 tax form</li>
                            <li>Set up your payout method</li>
                            <li>Review the test delivery process</li>
                          </ol>
                        </div>
                        
                        <div style="text-align: center; margin: 40px 0 30px 0;">
                          <a href="https://44d88461-c1ea-4d22-93fe-ebc1a7d81db9.lovableproject.com/craver-hub" 
                             style="display: inline-block; background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);">
                            Start Onboarding Now →
                          </a>
                        </div>
                        
                        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 30px 0;">
                          <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 16px;">📊 Quick Stats</h3>
                          <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #4a4a4a; font-size: 14px; line-height: 1.8;">
                            <li>Average earnings: <strong>$15-$25/hour</strong></li>
                            <li>Daily automatic payouts available</li>
                            <li>Flexible schedule - work when you want</li>
                            <li>24/7 support for drivers</li>
                          </ul>
                        </div>
                        
                        <div style="background-color: #e3f2fd; border: 1px solid #2196f3; padding: 15px; border-radius: 6px; margin: 20px 0;">
                          <p style="margin: 0; color: #1565c0; font-size: 14px; line-height: 1.6;">
                            <strong>⏱️ Important:</strong> Complete your onboarding within the next 7 days to maintain your approval status and claim your first delivery bonus!
                          </p>
                        </div>
                        
                        <p style="margin: 30px 0 0 0; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                          Questions? Reply to this email or check out our <a href="https://44d88461-c1ea-4d22-93fe-ebc1a7d81db9.lovableproject.com/driver-guide" style="color: #ff6b00; text-decoration: none;">Driver Guide</a>.
                        </p>
                        
                        <p style="margin: 20px 0 0 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                          Welcome aboard! 🧡<br>
                          <strong>The Crave'N Team</strong>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e5e5;">
                        <p style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 16px; font-weight: bold;">Ready to Start Earning? 💰</p>
                        <p style="margin: 0; color: #898989; font-size: 12px;">
                          © ${new Date().getFullYear()} Crave'N. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    console.log("Driver welcome email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error sending driver welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
