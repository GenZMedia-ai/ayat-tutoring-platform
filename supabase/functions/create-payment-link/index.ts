
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
    const { 
      student_ids, 
      package_id, 
      currency, 
      amount, 
      payment_type = 'single_student',
      family_group_id,
      package_selections,
      total_amount,
      individual_amounts,
      metadata = {} 
    } = body;
    
    logStep("Request data", { payment_type, family_group_id, student_ids, total_amount });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

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
      // For new customers, get customer details from first student
      let customerName = '';
      let customerPhone = '';

      if (payment_type === 'family_group' && family_group_id) {
        const { data: familyData } = await supabaseClient
          .from('family_groups')
          .select('parent_name, phone, unique_id')
          .eq('id', family_group_id)
          .single();
        
        customerName = familyData?.parent_name || '';
        customerPhone = familyData?.phone || '';
      } else if (student_ids?.length > 0) {
        const { data: studentData } = await supabaseClient
          .from('students')
          .select('name, phone, unique_id')
          .eq('id', student_ids[0])
          .single();
        
        customerName = studentData?.name || '';
        customerPhone = studentData?.phone || '';
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: customerName,
        phone: customerPhone
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    let lineItems = [];
    let finalAmount = amount;
    let finalCurrency = currency;
    let sessionMetadata = { ...metadata, created_by: user.id };

    // Handle different payment types
    if (payment_type === 'family_group' && family_group_id) {
      logStep("Processing family group payment");
      
      // Get family data with unique_id
      const { data: familyData, error: familyError } = await supabaseClient
        .from('family_groups')
        .select('unique_id, parent_name')
        .eq('id', family_group_id)
        .single();

      if (familyError) throw new Error(`Failed to get family data: ${familyError.message}`);

      // Get family package selections data
      const { data: familyPaymentData, error: familyPaymentError } = await supabaseClient
        .rpc('calculate_family_payment_total', { p_family_group_id: family_group_id });

      if (familyPaymentError) throw new Error(`Failed to calculate family payment: ${familyPaymentError.message}`);
      
      finalAmount = familyPaymentData.total_amount;
      finalCurrency = familyPaymentData.currency;
      
      // Create line items for each student's package
      const selections = familyPaymentData.package_selections || [];
      lineItems = selections.map((selection: any) => ({
        price_data: {
          currency: finalCurrency.toLowerCase(),
          product_data: {
            name: `${selection.package_name} (${selection.session_count} sessions) - ${selection.student_name}`,
            description: `${selection.package_name} - ${selection.session_count} sessions for ${selection.student_name}`,
          },
          unit_amount: selection.price * 100, // Convert to cents
        },
        quantity: 1,
      }));

      // CRITICAL FIX: Complete metadata for family payments
      sessionMetadata = {
        ...sessionMetadata,
        system_name: 'AyatWBian',
        student_unique_id: familyData.unique_id,
        payment_type: 'family_group',
        family_group_id: family_group_id,
        total_students: selections.length.toString(),
        student_count: selections.length.toString(),
        // Individual student data for n8n processing
        student_ids: selections.map((sel: any) => sel.student_id).join(','),
        individual_student_data: JSON.stringify(selections.map((sel: any) => ({
          student_id: sel.student_id,
          student_name: sel.student_name,
          package_id: sel.package_id,
          package_name: sel.package_name,
          session_count: sel.session_count,
          amount: sel.price
        }))),
        // Family payment summary
        total_amount: finalAmount.toString(),
        currency: finalCurrency
      };

      logStep("Family line items created", { count: lineItems.length, total: finalAmount, metadata: sessionMetadata });

    } else {
      logStep("Processing single student payment");
      
      // Get student data with unique_id
      const { data: studentData, error: studentError } = await supabaseClient
        .from('students')
        .select('unique_id, name')
        .eq('id', student_ids[0])
        .single();

      if (studentError) throw new Error(`Student not found: ${studentError.message}`);

      // Single student payment (backward compatibility)
      const { data: packageData, error: packageError } = await supabaseClient
        .from('packages')
        .select('*')
        .eq('id', package_id)
        .single();

      if (packageError) throw new Error(`Package not found: ${packageError.message}`);

      lineItems = [{
        price_data: {
          currency: finalCurrency.toLowerCase(),
          product_data: {
            name: `${packageData.name} - ${studentData.name}`,
            description: `${packageData.description} (${packageData.session_count} sessions)`,
          },
          unit_amount: finalAmount * 100, // Convert to cents
        },
        quantity: 1,
      }];

      // CRITICAL FIX: Complete metadata for single student payments
      sessionMetadata = {
        ...sessionMetadata,
        system_name: 'AyatWBian',
        student_unique_id: studentData.unique_id,
        payment_type: 'single_student',
        student_ids: student_ids.join(','),
        package_id: package_id,
        package_session_count: packageData.session_count.toString(),
        student_count: '1',
        student_name: studentData.name,
        package_name: packageData.name,
        total_amount: finalAmount.toString(),
        currency: finalCurrency
      };
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
      metadata: sessionMetadata
    });

    logStep("Checkout session created", { sessionId: session.id, metadata: sessionMetadata });

    // Store payment link in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const paymentLinkData = {
      student_ids: student_ids || [],
      package_id: package_id || null,
      currency: finalCurrency,
      amount: finalAmount,
      stripe_session_id: session.id,
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
      status: 'pending',
      payment_type: payment_type,
      family_group_id: family_group_id || null,
      package_selections: payment_type === 'family_group' ? package_selections : null,
      total_amount: payment_type === 'family_group' ? finalAmount : null,
      individual_amounts: payment_type === 'family_group' ? individual_amounts : null,
      package_session_count: payment_type === 'single_student' ? 
        sessionMetadata.package_session_count : null
    };

    const { data: paymentLink, error: linkError } = await supabaseClient
      .from('payment_links')
      .insert(paymentLinkData)
      .select()
      .single();

    if (linkError) throw new Error(`Failed to store payment link: ${linkError.message}`);
    logStep("Payment link stored", { linkId: paymentLink.id, paymentType: payment_type });

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id,
      payment_link_id: paymentLink.id,
      payment_type: payment_type,
      total_amount: finalAmount,
      currency: finalCurrency
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
