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
    // Client for auth verification
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

    // Admin client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { name, facePhoto } = await req.json();
    
    if (!name) {
      throw new Error('Company name is required');
    }

    if (!facePhoto) {
      throw new Error('Face photo is required for security verification');
    }

    console.log('Creating company:', name, 'for user:', user.id);

    // Create company using admin client
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name,
        admin_id: user.id,
      })
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      throw companyError;
    }

    console.log('Company created:', company.id);

    // Assign admin role to the creator
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: user.id,
        company_id: company.id,
        role: 'admin',
      });

    if (roleError) {
      console.error('Error assigning admin role:', roleError);
      throw roleError;
    }

    // Update profile with company_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ company_id: company.id })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw profileError;
    }

    // Store face photo for attendance verification
    const { error: photoError } = await supabaseAdmin
      .from('attendance_photos')
      .insert({
        user_id: user.id,
        company_id: company.id,
        photo_url: facePhoto,
        is_primary: true,
      });

    if (photoError) {
      console.error('Error saving face photo:', photoError);
      console.log('Company created but face photo was not saved');
    } else {
      console.log('Face photo saved successfully for admin attendance verification');
    }

    console.log('Company setup complete');

    return new Response(
      JSON.stringify({ company }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-company:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
