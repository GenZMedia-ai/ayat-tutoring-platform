
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ServerDateResponse {
  currentDate: string;
  timezone: string;
  timestamp: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Getting server date in Egypt timezone...');

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get current date in Egypt timezone from the database function
    const { data, error } = await supabase.rpc('get_egypt_current_date');

    if (error) {
      console.error('Error getting Egypt current date:', error);
      throw error;
    }

    // Get current timestamp in Egypt timezone for additional context
    const egyptTime = new Date().toLocaleString('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const response: ServerDateResponse = {
      currentDate: data, // This is in YYYY-MM-DD format from the database
      timezone: 'Africa/Cairo',
      timestamp: egyptTime
    };

    console.log('Server date response:', response);

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error in get-server-date function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get server date',
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
