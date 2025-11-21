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

    const { code, facePhoto } = await req.json();

    console.log('User attempting to join with code:', code);

    if (!facePhoto) {
      throw new Error('Face photo is required for security verification');
    }

    // Get invite code
    const { data: inviteCode, error: inviteError } = await supabaseClient
      .from('invite_codes')
      .select('*, companies(*)')
      .eq('code', code)
      .single();

    if (inviteError || !inviteCode) {
      throw new Error('Invalid invite code');
    }

    // Check if expired
    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      throw new Error('Invite code has expired');
    }

    // Check if max uses reached
    if (inviteCode.current_uses >= inviteCode.max_uses) {
      throw new Error('Invite code has reached maximum uses');
    }

    // Check if user already in company
    const { data: existingRole } = await supabaseClient
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', inviteCode.company_id)
      .single();

    if (existingRole) {
      throw new Error('You are already a member of this company');
    }

    // Add user to company with role from invite code
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: user.id,
        company_id: inviteCode.company_id,
        role: inviteCode.role,
      });

    if (roleError) {
      console.error('Error adding user to company:', roleError);
      throw roleError;
    }

    // Update profile with company_id
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ company_id: inviteCode.company_id })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw profileError;
    }

    // Store face photo for attendance verification
    const { error: photoError } = await supabaseClient
      .from('attendance_photos')
      .insert({
        user_id: user.id,
        company_id: inviteCode.company_id,
        photo_url: facePhoto,
        is_primary: true,
      });

    if (photoError) {
      console.error('Error saving face photo:', photoError);
      // Don't throw - allow user to join but log the error
      console.log('User joined but face photo was not saved');
    } else {
      console.log('Face photo saved successfully for future attendance verification');
    }

    // Increment current_uses
    const { error: updateError } = await supabaseClient
      .from('invite_codes')
      .update({ current_uses: inviteCode.current_uses + 1 })
      .eq('id', inviteCode.id);

    if (updateError) {
      console.error('Error updating invite code uses:', updateError);
    }

    console.log('User joined company successfully');

    return new Response(
      JSON.stringify({ company: inviteCode.companies }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in join-company:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
