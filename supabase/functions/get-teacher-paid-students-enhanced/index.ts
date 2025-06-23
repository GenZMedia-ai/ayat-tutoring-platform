
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-TEACHER-PAID-STUDENTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

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
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Enhanced query to handle both single and family payments
    const { data: paidStudents, error } = await supabaseClient
      .from('students')
      .select(`
        id,
        unique_id,
        name,
        age,
        phone,
        country,
        platform,
        parent_name,
        notes,
        family_group_id,
        created_at
      `)
      .eq('assigned_teacher_id', user.id)
      .eq('status', 'paid')
      .order('created_at', { ascending: false });

    if (error) {
      logStep("Error fetching paid students", { error });
      throw error;
    }

    logStep("Found paid students", { count: paidStudents?.length || 0 });

    // For each student, get their payment information
    const enrichedStudents = await Promise.all(
      (paidStudents || []).map(async (student) => {
        let paymentAmount = 0;
        let paymentCurrency = 'USD';
        let packageSessionCount = 8;
        let paymentDate = student.created_at;

        // Check if student has family payment data
        if (student.family_group_id) {
          logStep("Processing family student", { 
            studentId: student.id, 
            familyGroupId: student.family_group_id 
          });

          // Get family payment information
          const { data: familyPayment } = await supabaseClient
            .from('payment_links')
            .select('amount, currency, paid_at, package_session_count')
            .eq('family_group_id', student.family_group_id)
            .eq('status', 'paid')
            .order('paid_at', { ascending: false })
            .limit(1)
            .single();

          if (familyPayment) {
            logStep("Found family payment data", { 
              studentId: student.id,
              amount: familyPayment.amount,
              currency: familyPayment.currency
            });

            // Get student's specific package selection
            const { data: packageSelection } = await supabaseClient
              .from('family_package_selections')
              .select(`
                custom_price,
                packages!inner(session_count, price)
              `)
              .eq('student_id', student.id)
              .single();

            if (packageSelection) {
              paymentAmount = packageSelection.custom_price || packageSelection.packages.price;
              packageSessionCount = packageSelection.packages.session_count;
              logStep("Found package selection", { 
                studentId: student.id,
                sessionCount: packageSessionCount,
                amount: paymentAmount
              });
            } else {
              // Fallback to proportional family payment
              const { data: familyStudentsCount } = await supabaseClient
                .from('students')
                .select('id')
                .eq('family_group_id', student.family_group_id);

              const studentCount = familyStudentsCount?.length || 1;
              paymentAmount = Math.round(familyPayment.amount / studentCount);
              logStep("Using proportional family payment", { 
                studentId: student.id,
                totalAmount: familyPayment.amount,
                studentCount,
                proportionalAmount: paymentAmount
              });
            }

            paymentCurrency = familyPayment.currency;
            paymentDate = familyPayment.paid_at || student.created_at;
          }
        } else {
          // Single student payment
          logStep("Processing single student", { studentId: student.id });

          const { data: singlePayment } = await supabaseClient
            .from('payment_links')
            .select('amount, currency, paid_at, package_session_count')
            .contains('student_ids', [student.id])
            .eq('status', 'paid')
            .order('paid_at', { ascending: false })
            .limit(1)
            .single();

          if (singlePayment) {
            paymentAmount = singlePayment.amount;
            paymentCurrency = singlePayment.currency;
            packageSessionCount = singlePayment.package_session_count || 8;
            paymentDate = singlePayment.paid_at || student.created_at;
            logStep("Found single payment data", { 
              studentId: student.id,
              amount: paymentAmount,
              sessionCount: packageSessionCount
            });
          }
        }

        // Check if student already has scheduled sessions (registration completed)
        const { data: existingSessions } = await supabaseClient
          .from('sessions')
          .select('id')
          .in('id', 
            await supabaseClient
              .from('session_students')
              .select('session_id')
              .eq('student_id', student.id)
              .then(res => res.data?.map(ss => ss.session_id) || [])
          )
          .gt('session_number', 1); // Only count non-trial sessions

        const hasRegistration = existingSessions && existingSessions.length > 0;
        logStep("Checked registration status", { 
          studentId: student.id,
          hasRegistration,
          sessionCount: existingSessions?.length || 0
        });

        return {
          id: student.id,
          uniqueId: student.unique_id,
          name: student.name,
          age: student.age,
          phone: student.phone,
          country: student.country,
          platform: student.platform,
          parentName: student.parent_name,
          packageSessionCount,
          paymentAmount,
          paymentCurrency: paymentCurrency.toUpperCase(),
          paymentDate,
          notes: student.notes,
          hasCompletedRegistration: hasRegistration
        };
      })
    );

    // Filter out students who have already completed registration
    const studentsNeedingRegistration = enrichedStudents.filter(s => !s.hasCompletedRegistration);

    logStep("Completed processing", { 
      totalPaidStudents: enrichedStudents.length,
      needingRegistration: studentsNeedingRegistration.length
    });

    return new Response(JSON.stringify(studentsNeedingRegistration), {
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
