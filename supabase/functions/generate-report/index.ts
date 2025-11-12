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

    const { company_id, report_type, start_date, end_date, employee_id } = await req.json();

    console.log('Generating report:', report_type, 'for company:', company_id);

    // Check if user has permission (admin or HR)
    const { data: roleCheck } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .in('role', ['admin', 'hr']);

    if (!roleCheck || roleCheck.length === 0) {
      throw new Error('Only admins and HR can generate reports');
    }

    let reportData: any = {};

    if (report_type === 'attendance') {
      // Attendance report
      let query = supabaseClient
        .from('attendance')
        .select('*, profiles(full_name, department)')
        .eq('company_id', company_id)
        .gte('date', start_date)
        .lte('date', end_date);

      if (employee_id) {
        query = query.eq('user_id', employee_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate statistics
      const totalDays = data.length;
      const presentDays = data.filter(a => a.status === 'present').length;
      const totalHours = data.reduce((sum, a) => sum + (a.hours_worked || 0), 0);
      const avgHours = totalDays > 0 ? totalHours / totalDays : 0;

      reportData = {
        type: 'attendance',
        records: data,
        statistics: {
          total_days: totalDays,
          present_days: presentDays,
          total_hours: Math.round(totalHours * 100) / 100,
          average_hours_per_day: Math.round(avgHours * 100) / 100,
          attendance_rate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
        },
      };
    } else if (report_type === 'performance') {
      // Performance report
      let query = supabaseClient
        .from('performance_reviews')
        .select('*, profiles(full_name, department, position)')
        .eq('company_id', company_id)
        .gte('review_period_start', start_date)
        .lte('review_period_end', end_date);

      if (employee_id) {
        query = query.eq('user_id', employee_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate statistics
      const totalReviews = data.length;
      const avgRating = totalReviews > 0
        ? data.reduce((sum, r) => sum + (parseFloat(r.rating) || 0), 0) / totalReviews
        : 0;

      reportData = {
        type: 'performance',
        records: data,
        statistics: {
          total_reviews: totalReviews,
          average_rating: Math.round(avgRating * 100) / 100,
        },
      };
    } else if (report_type === 'leave') {
      // Leave report
      let query = supabaseClient
        .from('leave_requests')
        .select('*, profiles(full_name, department)')
        .eq('company_id', company_id)
        .gte('start_date', start_date)
        .lte('end_date', end_date);

      if (employee_id) {
        query = query.eq('user_id', employee_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate statistics
      const totalRequests = data.length;
      const approved = data.filter(l => l.status === 'approved').length;
      const pending = data.filter(l => l.status === 'pending').length;
      const rejected = data.filter(l => l.status === 'rejected').length;

      reportData = {
        type: 'leave',
        records: data,
        statistics: {
          total_requests: totalRequests,
          approved,
          pending,
          rejected,
          approval_rate: totalRequests > 0 ? Math.round((approved / totalRequests) * 100) : 0,
        },
      };
    } else {
      throw new Error('Invalid report type. Use: attendance, performance, or leave');
    }

    console.log('Report generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        report: reportData,
        generated_at: new Date().toISOString(),
        generated_by: user.id,
        parameters: {
          company_id,
          report_type,
          start_date,
          end_date,
          employee_id: employee_id || 'all',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in generate-report:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
