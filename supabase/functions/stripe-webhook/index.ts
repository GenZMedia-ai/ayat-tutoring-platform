
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("🔥 WEBHOOK RECEIVED - Starting processing");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      logStep("❌ CRITICAL ERROR: Missing Stripe configuration", { 
        hasStripeKey: !!stripeKey, 
        hasWebhookSecret: !!webhookSecret 
      });
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
      logStep("❌ CRITICAL ERROR: No signature found in request");
      throw new Error("No signature found");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("✅ Webhook signature verified successfully");
    } catch (err) {
      logStep("❌ CRITICAL ERROR: Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    logStep("🎯 Event received", { type: event.type, id: event.id });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("💰 Processing completed checkout", { 
        sessionId: session.id,
        amount: session.amount_total,
        customerEmail: session.customer_email
      });

      const metadata = session.metadata;
      if (!metadata) {
        logStep("❌ CRITICAL ERROR: No metadata found in session");
        throw new Error("No metadata found in session");
      }

      logStep("📋 Session metadata", metadata);

      // PHASE 1 FIX: Enhanced family payment detection and handling
      const isFamily = metadata.payment_type === 'family_group';
      let studentIds: string[] = [];
      let sessionCount = parseInt(metadata.package_session_count || '8');
      
      if (isFamily && metadata.family_group_id) {
        logStep("👨‍👩‍👧‍👦 FAMILY PAYMENT DETECTED", { familyGroupId: metadata.family_group_id });
        
        // CRITICAL FIX: Get ALL students in the family group
        const { data: familyStudents, error: familyError } = await supabaseClient
          .from('students')
          .select('id, name')
          .eq('family_group_id', metadata.family_group_id);

        if (familyError) {
          logStep("❌ CRITICAL ERROR: Failed to fetch family students", { error: familyError });
          throw familyError;
        }

        if (familyStudents && familyStudents.length > 0) {
          studentIds = familyStudents.map(s => s.id);
          logStep("✅ Found family students", { 
            count: studentIds.length, 
            students: familyStudents.map(s => ({ id: s.id, name: s.name }))
          });
        } else {
          logStep("❌ CRITICAL ERROR: No family students found", { familyGroupId: metadata.family_group_id });
          throw new Error(`No students found for family group: ${metadata.family_group_id}`);
        }

        // CRITICAL FIX: Get session count from family package selections
        const { data: packageData } = await supabaseClient
          .from('family_package_selections')
          .select(`
            packages!inner(session_count)
          `)
          .eq('family_group_id', metadata.family_group_id)
          .limit(1)
          .single();

        if (packageData?.packages?.session_count) {
          sessionCount = packageData.packages.session_count;
          logStep("✅ Retrieved family session count", { sessionCount });
        }

        // CRITICAL FIX: Update family group status to 'paid'
        const { error: familyUpdateError } = await supabaseClient
          .from('family_groups')
          .update({ 
            status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', metadata.family_group_id);

        if (familyUpdateError) {
          logStep("❌ ERROR: Failed to update family group status", { error: familyUpdateError });
        } else {
          logStep("✅ FAMILY GROUP STATUS UPDATED TO PAID");
        }
      } else {
        // Single student payment
        studentIds = metadata.student_ids?.split(',') || [];
        logStep("👤 SINGLE STUDENT PAYMENT", { studentIds, sessionCount });
      }

      if (studentIds.length === 0) {
        logStep("❌ CRITICAL ERROR: No student IDs found for payment processing");
        throw new Error("No student IDs found for payment processing");
      }

      // CRITICAL FIX: Update payment link status with enhanced data
      const { error: linkUpdateError } = await supabaseClient
        .from('payment_links')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          package_session_count: sessionCount
        })
        .eq('stripe_session_id', session.id);

      if (linkUpdateError) {
        logStep("❌ ERROR: Failed to update payment link", { error: linkUpdateError });
      } else {
        logStep("✅ PAYMENT LINK UPDATED TO PAID", { sessionCount });
      }

      // CRITICAL FIX: Update ALL student statuses to 'paid' with enhanced logging
      logStep("🔄 UPDATING STUDENT STATUSES TO PAID", { 
        studentCount: studentIds.length,
        isFamily: isFamily,
        studentIds: studentIds
      });

      const { data: updatedStudents, error: studentUpdateError } = await supabaseClient
        .from('students')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .in('id', studentIds)
        .select('id, name, status');

      if (studentUpdateError) {
        logStep("❌ CRITICAL ERROR: Failed to update student statuses", { 
          error: studentUpdateError,
          studentIds: studentIds
        });
        throw studentUpdateError;
      } else {
        logStep("✅ ALL STUDENT STATUSES UPDATED TO PAID", { 
          count: updatedStudents?.length || 0,
          students: updatedStudents?.map(s => ({ id: s.id, name: s.name, status: s.status })),
          isFamily: isFamily 
        });
      }

      // Enhanced notification data for n8n
      const notificationData = {
        event_type: 'payment_completed',
        student_unique_id: metadata.student_unique_id,
        payment_amount: session.amount_total ? session.amount_total / 100 : 0,
        payment_currency: session.currency?.toUpperCase(),
        package_session_count: sessionCount,
        stripe_session_id: session.id,
        payment_timestamp: new Date().toISOString(),
        payment_status: 'succeeded',
        student_ids: studentIds,
        system_name: metadata.system_name || 'AyatWBian',
        payment_type: metadata.payment_type || 'single_student',
        family_group_id: metadata.family_group_id || null,
        student_count: studentIds.length.toString()
      };

      logStep("📤 Prepared notification data", notificationData);

      // Send to n8n webhook
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
            logStep("✅ Notification sent to n8n successfully");
          } else {
            logStep("⚠️ Failed to send notification to n8n", { 
              status: response.status, 
              statusText: response.statusText 
            });
          }
        } catch (error) {
          logStep("⚠️ Error sending notification to n8n", { error: error.message });
        }
      } else {
        logStep("⚠️ N8N_WEBHOOK_URL not configured, skipping external notification");
      }

      logStep("🎉 PAYMENT PROCESSING COMPLETED SUCCESSFULLY", {
        studentsUpdated: updatedStudents?.length || 0,
        isFamily: isFamily,
        sessionCount: sessionCount
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("❌ CRITICAL WEBHOOK ERROR", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
