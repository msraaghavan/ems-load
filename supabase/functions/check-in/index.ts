import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { company_id, latitude, longitude, photo_base64 } = await req.json();

    console.log('Check-in request for user:', user.id, 'company:', company_id);

    // Step 1: Validate geofence
    const geofenceResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/validate-geofence`,
      {
        method: 'POST',
        headers: {
          'Authorization': req.headers.get('Authorization')!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ company_id, latitude, longitude }),
      }
    );

    const geofenceData = await geofenceResponse.json();
    console.log('Geofence validation:', geofenceData);

    if (!geofenceData.valid) {
      throw new Error(`Not within geofence: ${geofenceData.message}`);
    }

    // Step 2: Verify face
    const faceResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/verify-face`,
      {
        method: 'POST',
        headers: {
          'Authorization': req.headers.get('Authorization')!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photo_base64, company_id }),
      }
    );

    const faceData = await faceResponse.json();
    console.log('Face verification:', faceData);

    if (!faceData.verified) {
      throw new Error(`Face verification failed: ${faceData.reason || 'Unknown reason'}`);
    }

    // Step 3: Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingAttendance } = await supabaseClient
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .eq('date', today)
      .single();

    if (existingAttendance && existingAttendance.check_in_time) {
      throw new Error('Already checked in today');
    }

    // Step 4: Create or update attendance record
    const attendanceData = {
      user_id: user.id,
      company_id,
      check_in_time: new Date().toISOString(),
      check_in_location_lat: latitude,
      check_in_location_lng: longitude,
      check_in_photo_url: photo_base64,
      status: 'present',
      date: today,
    };

    let attendance;
    if (existingAttendance) {
      const { data, error } = await supabaseClient
        .from('attendance')
        .update(attendanceData)
        .eq('id', existingAttendance.id)
        .select()
        .single();
      
      if (error) throw error;
      attendance = data;
    } else {
      const { data, error } = await supabaseClient
        .from('attendance')
        .insert(attendanceData)
        .select()
        .single();
      
      if (error) throw error;
      attendance = data;
    }

    console.log('Check-in successful:', attendance.id);

    return new Response(
      JSON.stringify({
        success: true,
        attendance,
        geofence: geofenceData,
        face_verification: faceData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in check-in:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
