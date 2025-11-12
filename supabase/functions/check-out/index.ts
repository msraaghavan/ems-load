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

    console.log('Check-out request for user:', user.id, 'company:', company_id);

    // Get today's attendance record
    const today = new Date().toISOString().split('T')[0];
    const { data: attendance, error: attendanceError } = await supabaseClient
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .eq('date', today)
      .single();

    if (attendanceError || !attendance) {
      throw new Error('No check-in found for today. Please check in first.');
    }

    if (attendance.check_out_time) {
      throw new Error('Already checked out today');
    }

    // Validate geofence
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

    // Calculate hours worked
    const checkInTime = new Date(attendance.check_in_time);
    const checkOutTime = new Date();
    const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    console.log('Hours worked:', hoursWorked);

    // Update attendance record
    const { data: updatedAttendance, error: updateError } = await supabaseClient
      .from('attendance')
      .update({
        check_out_time: checkOutTime.toISOString(),
        check_out_location_lat: latitude,
        check_out_location_lng: longitude,
        check_out_photo_url: photo_base64,
        hours_worked: Math.round(hoursWorked * 100) / 100,
      })
      .eq('id', attendance.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating attendance:', updateError);
      throw updateError;
    }

    console.log('Check-out successful:', updatedAttendance.id);

    return new Response(
      JSON.stringify({
        success: true,
        attendance: updatedAttendance,
        hours_worked: Math.round(hoursWorked * 100) / 100,
        geofence: geofenceData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in check-out:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
