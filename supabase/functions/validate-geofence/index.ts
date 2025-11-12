import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

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

    const { company_id, latitude, longitude } = await req.json();

    console.log('Validating geofence for company:', company_id, 'at:', latitude, longitude);

    // Get company geofences
    const { data: geofences, error } = await supabaseClient
      .from('geofences')
      .select('*')
      .eq('company_id', company_id);

    if (error) {
      console.error('Error fetching geofences:', error);
      throw error;
    }

    if (!geofences || geofences.length === 0) {
      console.log('No geofences configured for company');
      return new Response(
        JSON.stringify({
          valid: true,
          message: 'No geofence configured',
          distance: null,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Check if user is within any geofence
    let minDistance = Infinity;
    let isWithinGeofence = false;
    let nearestGeofence = null;

    for (const geofence of geofences) {
      const distance = calculateDistance(
        latitude,
        longitude,
        parseFloat(geofence.latitude),
        parseFloat(geofence.longitude)
      );

      console.log(`Distance to ${geofence.name}:`, distance, 'meters (limit:', geofence.radius_meters, ')');

      if (distance < minDistance) {
        minDistance = distance;
        nearestGeofence = geofence;
      }

      if (distance <= geofence.radius_meters) {
        isWithinGeofence = true;
        break;
      }
    }

    console.log('Geofence validation result:', isWithinGeofence, 'min distance:', minDistance);

    return new Response(
      JSON.stringify({
        valid: isWithinGeofence,
        distance: Math.round(minDistance),
        nearest_geofence: nearestGeofence?.name,
        radius: nearestGeofence?.radius_meters,
        message: isWithinGeofence
          ? 'Within geofence'
          : `${Math.round(minDistance)}m away from ${nearestGeofence?.name}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in validate-geofence:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
