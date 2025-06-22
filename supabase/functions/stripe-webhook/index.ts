
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      throw new Error("No signature found");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    logStep("Event received", { type: event.type, id: event.id });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing completed checkout", { sessionId: session.id });

      const metadata = session.metadata;
      if (!metadata) {
        throw new Error("No metadata found in session");
      }

      const studentIds = metadata.student_ids?.split(',') || [];
      const packageSessionCount = parseInt(metadata.package_session_count || '0');
      
      logStep("Session metadata", { 
        studentIds, 
        packageSessionCount,
        paymentType: metadata.payment_type 
      });

      // Update payment link status
      const { error: linkUpdateError } = await supabaseClient
        .from('payment_links')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('stripe_session_id', session.id);

      if (linkUpdateError) {
        logStep("Error updating payment link", { error: linkUpdateError });
      } else {
        logStep("Payment link updated to paid");
      }

      // Update student statuses to 'paid'
      const { error: studentUpdateError } = await supabaseClient
        .from('students')
        .update({ status: 'paid' })
        .in('id', studentIds);

      if (studentUpdateError) {
        logStep("Error updating student status", { error: studentUpdateError });
        throw studentUpdateError;
      } else {
        logStep("Student statuses updated to paid", { count: studentIds.length });
      }

      // Prepare notification data for n8n (external webhook)
      const notificationData = {
        event_type: 'payment_completed',
        student_unique_id: metadata.student_unique_id,
        payment_amount: session.amount_total ? session.amount_total / 100 : 0,
        payment_currency: session.currency?.toUpperCase(),
        package_session_count: packageSessionCount,
        stripe_session_id: session.id,
        payment_timestamp: new Date().toISOString(),
        payment_status: 'succeeded',
        student_ids: studentIds,
        system_name: metadata.system_name || 'AyatWBian'
      };

      logStep("Prepared notification data", notificationData);

      // Send to n8n webhook (external notification system)
      const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
      if (n8nWebhookUrl) {
        try {
          const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(notificationData)
          });

          if (response.ok) {
            logStep("Notification sent to n8n successfully");
          } else {
            logStep("Failed to send notification to n8n", { 
              status: response.status, 
              statusText: response.statusText 
            });
          }
        } catch (error) {
          logStep("Error sending notification to n8n", { error: error.message });
        }
      } else {
        logStep("N8N_WEBHOOK_URL not configured, skipping external notification");
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
