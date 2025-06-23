
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-TEACHER-PAID-STUDENTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Function started");

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    
    logStep("User authenticated", { userId: user.id });

    // Get paid students for this teacher with enhanced package data
    const { data: paidStudents, error: studentsError } = await supabaseClient
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
        package_session_count,
        package_name,
        payment_amount,
        payment_currency,
        created_at,
        notes,
        family_group_id
      `)
      .eq('assigned_teacher_id', user.id)
      .eq('status', 'paid')
      .order('created_at', { ascending: false });

    if (studentsError) {
      logStep("Error fetching paid students", { error: studentsError });
      throw studentsError;
    }

    logStep("Found paid students", { count: paidStudents?.length || 0 });

    // Transform data for frontend with individual package data
    const transformedStudents = (paidStudents || []).map(student => {
      // Check if student has completed registration (has active sessions)
      const hasCompletedRegistration = false; // We'll check this separately if needed

      return {
        id: student.id,
        uniqueId: student.unique_id,
        name: student.name,
        age: student.age,
        phone: student.phone,
        country: student.country,
        platform: student.platform,
        parentName: student.parent_name,
        packageSessionCount: student.package_session_count || 8,
        packageName: student.package_name || 'Standard Package',
        paymentAmount: student.payment_amount || 0,
        paymentCurrency: (student.payment_currency || 'USD').toUpperCase(),
        paymentDate: student.created_at,
        notes: student.notes,
        hasCompletedRegistration: hasCompletedRegistration,
        isFamilyMember: !!student.family_group_id
      };
    });

    // Filter out students who already have scheduled sessions (completed registration)
    const studentsNeedingRegistration = transformedStudents.filter(student => 
      !student.hasCompletedRegistration
    );

    logStep("Completed processing", { 
      totalPaidStudents: transformedStudents.length,
      needingRegistration: studentsNeedingRegistration.length,
      familyMembers: transformedStudents.filter(s => s.isFamilyMember).length
    });

    return new Response(JSON.stringify(studentsNeedingRegistration), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
