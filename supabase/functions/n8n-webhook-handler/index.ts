
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[N8N-WEBHOOK-HANDLER] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("N8N webhook received");

    // CORS headers for web requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const webhookData = await req.json();
    logStep("Webhook data received", webhookData);

    // Extract payment data from n8n webhook
    const { 
      system_name,
      student_unique_id,
      payment_type,
      stripe_session_id,
      student_ids,
      family_group_id,
      individual_student_data,
      package_session_count,
      total_amount,
      currency,
      individual_amounts
    } = webhookData;

    // CRITICAL: Filter only AyatWBian payments
    if (system_name !== 'AyatWBian') {
      logStep("Ignoring payment - not for AyatWBian system", { system_name });
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Payment ignored - not for AyatWBian system' 
      }), {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 200,
      });
    }

    if (!student_unique_id || !stripe_session_id) {
      throw new Error("Missing required payment data");
    }

    logStep("Processing AyatWBian payment", { 
      student_unique_id, 
      payment_type,
      stripe_session_id 
    });

    let studentsToUpdate = [];

    // Handle different payment types
    if (payment_type === 'family_group') {
      logStep("Processing family group payment");

      // Find family group by unique_id
      const { data: familyGroup, error: familyError } = await supabaseClient
        .from('family_groups')
        .select('id, parent_name')
        .eq('unique_id', student_unique_id)
        .single();

      if (familyError || !familyGroup) {
        throw new Error(`Family group not found with unique_id: ${student_unique_id}`);
      }

      logStep("Found family group", { familyId: familyGroup.id });

      // Get all students in family
      const { data: familyStudents, error: studentsError } = await supabaseClient
        .from('students')
        .select('*')
        .eq('family_group_id', familyGroup.id);

      if (studentsError) {
        throw new Error(`Failed to fetch family students: ${studentsError.message}`);
      }

      studentsToUpdate = familyStudents || [];

      // Update family group status to paid
      const { error: familyUpdateError } = await supabaseClient
        .from('family_groups')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', familyGroup.id);

      if (familyUpdateError) {
        logStep("Error updating family group status", { error: familyUpdateError });
      } else {
        logStep("Family group status updated to paid");
      }

      // ENHANCED: Process individual student data with specific package info
      if (individual_student_data) {
        try {
          const studentData = JSON.parse(individual_student_data);
          logStep("Processing individual student package data", { count: studentData.length });

          for (const studentInfo of studentData) {
            const { error: studentPackageError } = await supabaseClient
              .from('students')
              .update({
                package_session_count: studentInfo.session_count,
                package_name: studentInfo.package_name,
                payment_amount: studentInfo.amount,
                payment_currency: currency,
                updated_at: new Date().toISOString()
              })
              .eq('id', studentInfo.student_id);

            if (studentPackageError) {
              logStep("Error updating student package info", { 
                studentId: studentInfo.student_id, 
                error: studentPackageError 
              });
            } else {
              logStep("Updated student package info", {
                studentId: studentInfo.student_id,
                sessionCount: studentInfo.session_count,
                packageName: studentInfo.package_name,
                amount: studentInfo.amount
              });
            }
          }
        } catch (parseError) {
          logStep("Error parsing individual student data", { error: parseError });
          
          // FALLBACK: If individual_amounts is available, use it
          if (individual_amounts) {
            try {
              const amounts = JSON.parse(individual_amounts);
              logStep("Using individual_amounts fallback", amounts);
              
              for (const student of studentsToUpdate) {
                const studentAmount = amounts[student.id];
                if (studentAmount) {
                  const { error: fallbackError } = await supabaseClient
                    .from('students')
                    .update({
                      payment_amount: studentAmount,
                      payment_currency: currency,
                      package_session_count: parseInt(package_session_count || '8'),
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', student.id);

                  if (fallbackError) {
                    logStep("Fallback update error", { studentId: student.id, error: fallbackError });
                  }
                }
              }
            } catch (fallbackParseError) {
              logStep("Fallback parsing also failed", { error: fallbackParseError });
            }
          }
        }
      }

    } else {
      logStep("Processing single student payment");
      
      // Find student by unique_id
      const { data: student, error: studentError } = await supabaseClient
        .from('students')
        .select('*')
        .eq('unique_id', student_unique_id)
        .single();

      if (studentError || !student) {
        throw new Error(`Student not found with unique_id: ${student_unique_id}`);
      }

      studentsToUpdate = [student];

      // Update student with package info
      const { error: packageUpdateError } = await supabaseClient
        .from('students')
        .update({
          package_session_count: parseInt(package_session_count || '8'),
          payment_amount: parseInt(total_amount || '0'),
          payment_currency: currency,
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id);

      if (packageUpdateError) {
        logStep("Error updating student package info", { error: packageUpdateError });
      }
    }

    // Update all students status from awaiting-payment to paid
    if (studentsToUpdate.length > 0) {
      const studentIds = studentsToUpdate.map(s => s.id);
      
      const { data: updatedStudents, error: statusUpdateError } = await supabaseClient
        .from('students')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .in('id', studentIds)
        .eq('status', 'awaiting-payment')
        .select('id, name, status');

      if (statusUpdateError) {
        logStep("Error updating student statuses", { error: statusUpdateError });
        throw statusUpdateError;
      }

      logStep("Students updated to paid status", { 
        count: updatedStudents?.length || 0,
        students: updatedStudents?.map(s => ({ id: s.id, name: s.name, status: s.status }))
      });
    }

    // Update payment link status
    const { error: paymentLinkError } = await supabaseClient
      .from('payment_links')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        package_session_count: parseInt(package_session_count || '8'),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_session_id', stripe_session_id);

    if (paymentLinkError) {
      logStep("Error updating payment link", { error: paymentLinkError });
    } else {
      logStep("Payment link updated to paid status");
    }

    logStep("Payment processing completed successfully", {
      payment_type,
      students_updated: studentsToUpdate.length,
      family_payment: payment_type === 'family_group'
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Payment processed successfully',
      students_updated: studentsToUpdate.length,
      payment_type
    }), {
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
