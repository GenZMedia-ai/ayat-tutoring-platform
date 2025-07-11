
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

    // Get paid students for this teacher with enhanced package data and payment info
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
      .order('created_at', { ascending: true }); // Sort by oldest first

    if (studentsError) {
      logStep("Error fetching paid students", { error: studentsError });
      throw studentsError;
    }

    logStep("Found paid students", { count: paidStudents?.length || 0 });

    // Get payment dates for all students
    const studentIds = paidStudents?.map(s => s.id) || [];
    const { data: paymentLinks } = studentIds.length > 0 
      ? await supabaseClient
          .from('payment_links')
          .select('student_ids, paid_at, family_group_id')
          .or(`student_ids.cs.{${studentIds.join(',')}},family_group_id.in.(${[...new Set(paidStudents?.filter(s => s.family_group_id).map(s => s.family_group_id))].join(',')})`)
          .not('paid_at', 'is', null)
      : { data: [] };

    // Create payment date lookup
    const paymentDateLookup = new Map();
    paymentLinks?.forEach(link => {
      if (link.family_group_id) {
        // Family payment
        paymentDateLookup.set(`family_${link.family_group_id}`, link.paid_at);
      } else if (link.student_ids) {
        // Individual payments
        link.student_ids.forEach(studentId => {
          paymentDateLookup.set(studentId, link.paid_at);
        });
      }
    });

    // Get family groups for family members
    const familyIds = [...new Set(paidStudents?.filter(s => s.family_group_id).map(s => s.family_group_id))];
    const { data: familyGroups, error: familyError } = familyIds.length > 0 
      ? await supabaseClient
          .from('family_groups')
          .select('id, parent_name, phone')
          .in('id', familyIds)
      : { data: [], error: null };

    if (familyError) {
      logStep("Error fetching family groups", { error: familyError });
    }

    // Check registration status for students
    const { data: sessions } = studentIds.length > 0
      ? await supabaseClient
          .from('session_students')
          .select('student_id, sessions!inner(session_number)')
          .in('student_id', studentIds)
          .gt('sessions.session_number', 1)
      : { data: [] };

    const registeredStudentIds = new Set(sessions?.map(s => s.student_id) || []);

    // Group students by family
    const familyMap = new Map();
    const individualStudents = [];

    for (const student of paidStudents || []) {
      const hasCompletedRegistration = registeredStudentIds.has(student.id);
      
      // Get payment date
      const paymentDate = student.family_group_id 
        ? paymentDateLookup.get(`family_${student.family_group_id}`)
        : paymentDateLookup.get(student.id);
      
      const transformedStudent = {
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
        paymentDate: paymentDate || student.created_at,
        notes: student.notes,
        hasCompletedRegistration,
        isFamilyMember: !!student.family_group_id,
        isScheduled: hasCompletedRegistration
      };

      if (student.family_group_id) {
        const familyGroup = familyGroups?.find(f => f.id === student.family_group_id);
        if (!familyMap.has(student.family_group_id)) {
          familyMap.set(student.family_group_id, {
            id: student.family_group_id,
            type: 'family',
            familyName: familyGroup?.parent_name || student.parent_name || 'Unknown Family',
            parentName: familyGroup?.parent_name || student.parent_name,
            parentPhone: familyGroup?.phone || student.phone,
            paymentDate: paymentDate || student.created_at,
            students: [],
            totalStudents: 0,
            scheduledStudents: 0,
            totalSessions: 0,
            completedSessions: 0
          });
        }
        
        const family = familyMap.get(student.family_group_id);
        family.students.push(transformedStudent);
        family.totalStudents++;
        family.totalSessions += transformedStudent.packageSessionCount;
        if (transformedStudent.isScheduled) {
          family.scheduledStudents++;
        }
      } else {
        // Only include individual students who haven't completed registration
        if (!hasCompletedRegistration) {
          individualStudents.push(transformedStudent);
        }
      }
    }

    // Convert family map to array and filter out fully scheduled families
    const familyCards = Array.from(familyMap.values()).filter(family => 
      family.scheduledStudents < family.totalStudents
    );

    // Combine individual students and family cards
    const result = [...individualStudents, ...familyCards];

    logStep("Completed processing", { 
      totalPaidStudents: paidStudents?.length || 0,
      individualStudents: individualStudents.length,
      familyCards: familyCards.length,
      totalItems: result.length
    });

    return new Response(JSON.stringify(result), {
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
