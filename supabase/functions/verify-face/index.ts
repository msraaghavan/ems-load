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

    const { photo_base64, company_id } = await req.json();

    console.log('Verifying face for user:', user.id);

    // Get user's registered face photo
    const { data: registeredPhoto, error: photoError } = await supabaseClient
      .from('attendance_photos')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .eq('is_primary', true)
      .single();

    if (photoError || !registeredPhoto) {
      console.log('No registered photo found - this is the first photo');
      
      // First time - save as primary photo
      const { error: insertError } = await supabaseClient
        .from('attendance_photos')
        .insert({
          user_id: user.id,
          company_id,
          photo_url: photo_base64,
          is_primary: true,
        });

      if (insertError) {
        console.error('Error saving photo:', insertError);
        throw insertError;
      }

      return new Response(
        JSON.stringify({
          verified: true,
          confidence: 1.0,
          message: 'First photo registered successfully',
          is_first_photo: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Use AI to compare faces
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Comparing faces using AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a face verification system. Compare the two face images and determine if they are the same person. Respond with ONLY a JSON object with fields: match (boolean), confidence (0-1 number), reason (string).',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Compare these two face images. Are they the same person?',
              },
              {
                type: 'image_url',
                image_url: {
                  url: registeredPhoto.photo_url,
                },
              },
              {
                type: 'image_url',
                image_url: {
                  url: photo_base64,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI verification failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0]?.message?.content || '{}';
    
    console.log('AI response:', aiMessage);

    // Parse AI response
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { match: false, confidence: 0, reason: 'Failed to parse AI response' };
    } catch (e) {
      console.error('Error parsing AI response:', e);
      result = { match: false, confidence: 0, reason: 'Invalid AI response format' };
    }

    console.log('Face verification result:', result);

    return new Response(
      JSON.stringify({
        verified: result.match && result.confidence > 0.7,
        confidence: result.confidence,
        reason: result.reason,
        is_first_photo: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in verify-face:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
