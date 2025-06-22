
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT-LINK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json();
    const { student_ids, package_id, currency, amount, payment_type, metadata } = body;
    
    logStep("Request data", { student_ids, package_id, currency, amount, payment_type });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get package details
    const { data: packageData, error: packageError } = await supabaseClient
      .from('packages')
      .select('*')
      .eq('id', package_id)
      .single();

    if (packageError) throw new Error(`Package not found: ${packageError.message}`);
    logStep("Package retrieved", { packageName: packageData.name });

    // Get first student details for customer info
    const { data: studentData, error: studentError } = await supabaseClient
      .from('students')
      .select('*')
      .eq('id', student_ids[0])
      .single();

    if (studentError) throw new Error(`Student not found: ${studentError.message}`);
    logStep("Student retrieved", { studentName: studentData.name });

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: studentData.name,
        phone: studentData.phone
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `${packageData.name} - ${studentData.name}`,
              description: `${packageData.description} (${packageData.session_count} sessions)`,
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
      metadata: {
        ...metadata,
        student_ids: student_ids.join(','),
        package_id: package_id,
        created_by: user.id
      }
    });

    logStep("Checkout session created", { sessionId: session.id });

    // Store payment link in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { data: paymentLink, error: linkError } = await supabaseClient
      .from('payment_links')
      .insert({
        student_ids: student_ids,
        package_id: package_id,
        currency: currency,
        amount: amount,
        stripe_session_id: session.id,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (linkError) throw new Error(`Failed to store payment link: ${linkError.message}`);
    logStep("Payment link stored", { linkId: paymentLink.id });

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id,
      payment_link_id: paymentLink.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
