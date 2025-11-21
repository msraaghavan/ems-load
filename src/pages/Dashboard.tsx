import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, Calendar, TrendingUp, UserCheck, UserX, Briefcase, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { AttendanceCheckInDialog } from '@/components/AttendanceCheckInDialog';

export default function Dashboard() {
  const { user } = useSupabaseAuth();
  const { isAdminOrHR, isDepartmentHead } = useUserRole();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    onLeave: 0,
    presentToday: 0,
    pendingLeaves: 0,
    avgRating: '0.0',
    totalDepartments: 0,
    avgWorkHours: '0.0',
    activeProjects: 0
  });
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Get company ID and profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, full_name, department, position')
        .eq('id', user?.id)
        .single();

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      setCompanyId(profile.company_id);

      // For employees, fetch only their own data
      if (isAdminOrHR || isDepartmentHead) {
        // Fetch all company data for admin/HR/department head
        const [employeesRes, attendanceRes, leavesRes, performanceRes, departmentsRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('company_id', profile.company_id),
          supabase.from('attendance').select('*, profiles(full_name)').eq('company_id', profile.company_id).eq('date', new Date().toISOString().split('T')[0]),
          supabase.from('leave_requests').select('*, profiles(full_name)').eq('company_id', profile.company_id).order('created_at', { ascending: false }).limit(3),
          supabase.from('performance_reviews').select('*, profiles(full_name, department, position)').eq('company_id', profile.company_id).order('rating', { ascending: false }).limit(3),
          supabase.from('departments').select('*').eq('company_id', profile.company_id)
        ]);

        const employees = employeesRes.data || [];
        const attendance = attendanceRes.data || [];
        const leaves = leavesRes.data || [];
        const performance = performanceRes.data || [];
        const departments = departmentsRes.data || [];

        const presentToday = attendance.filter(a => a.status === 'present').length;
        const avgHours = attendance.length > 0 
          ? (attendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0) / attendance.length).toFixed(1)
          : '0.0';
        const avgRating = performance.length > 0
          ? (performance.reduce((sum, p) => sum + (p.rating || 0), 0) / performance.length).toFixed(1)
          : '0.0';

        setStats({
          totalEmployees: employees.length,
          activeEmployees: employees.length,
          onLeave: leaves.filter(l => l.status === 'approved').length,
          presentToday,
          pendingLeaves: leaves.filter(l => l.status === 'pending').length,
          avgRating,
          totalDepartments: departments.length,
          avgWorkHours: avgHours,
          activeProjects: 0
        });

        setRecentLeaves(leaves);
        setTopPerformers(performance);
      } else {
        // Fetch only employee's own data
        const [attendanceRes, leavesRes, performanceRes] = await Promise.all([
          supabase.from('attendance').select('*').eq('company_id', profile.company_id).eq('user_id', user?.id).eq('date', new Date().toISOString().split('T')[0]),
          supabase.from('leave_requests').select('*').eq('company_id', profile.company_id).eq('user_id', user?.id).order('created_at', { ascending: false }).limit(3),
          supabase.from('performance_reviews').select('*').eq('company_id', profile.company_id).eq('user_id', user?.id).order('rating', { ascending: false }).limit(1)
        ]);

        const attendance = attendanceRes.data || [];
        const leaves = leavesRes.data || [];
        const performance = performanceRes.data || [];

        const presentToday = attendance.filter(a => a.status === 'present').length;
        const avgHours = attendance.length > 0 
          ? (attendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0) / attendance.length).toFixed(1)
          : '0.0';
        const avgRating = performance.length > 0 ? performance[0].rating?.toFixed(1) || '0.0' : '0.0';

        setStats({
          totalEmployees: 1,
          activeEmployees: 1,
          onLeave: leaves.filter(l => l.status === 'approved').length,
          presentToday,
          pendingLeaves: leaves.filter(l => l.status === 'pending').length,
          avgRating,
          totalDepartments: 0,
          avgWorkHours: avgHours,
          activeProjects: 0
        });

        // Add profile names for display
        const leavesWithProfile = leaves.map(l => ({
          ...l,
          profiles: { full_name: profile.full_name || 'You' }
        }));
        const performanceWithProfile = performance.map(p => ({
          ...p,
          profiles: { full_name: profile.full_name || 'You', department: profile.department, position: profile.position }
        }));

        setRecentLeaves(leavesWithProfile);
        setTopPerformers(performanceWithProfile);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extralight tracking-wider">
            {isAdminOrHR || isDepartmentHead ? 'Dashboard' : 'My Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-2 font-light tracking-wide">
            {isAdminOrHR || isDepartmentHead ? 'Overview of your workforce' : 'Your work statistics and updates'}
          </p>
        </div>
        {!isAdminOrHR && !isDepartmentHead && companyId && (
          <AttendanceCheckInDialog 
            onSuccess={() => fetchDashboardData()} 
            companyId={companyId} 
          />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {(isAdminOrHR || isDepartmentHead) ? (
          <>
            <StatCard
              title="Total Employees"
              value={stats.totalEmployees}
              icon={Users}
              trend={{ value: 12, isPositive: true }}
            />
            <StatCard
              title="Present Today"
              value={stats.presentToday}
              icon={UserCheck}
              trend={{ value: 8, isPositive: true }}
            />
            <StatCard
              title="On Leave"
              value={stats.onLeave}
              icon={UserX}
            />
            <StatCard
              title="Avg Performance"
              value={stats.avgRating}
              icon={Award}
              trend={{ value: 5, isPositive: true }}
            />
          </>
        ) : (
          <>
            <StatCard
              title="My Attendance"
              value={stats.presentToday > 0 ? 'Present' : 'Not Checked In'}
              icon={UserCheck}
            />
            <StatCard
              title="Leave Requests"
              value={stats.pendingLeaves}
              icon={Calendar}
            />
            <StatCard
              title="My Performance"
              value={stats.avgRating}
              icon={Award}
            />
            <StatCard
              title="Work Hours Today"
              value={`${stats.avgWorkHours}h`}
              icon={Clock}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-light tracking-wide">Recent Leave Requests</CardTitle>
                <CardDescription className="font-light">Latest leave applications from employees</CardDescription>
              </div>
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeaves.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No recent leave requests</p>
              ) : (
                <>
                  {recentLeaves.map((leave) => (
                    <div key={leave.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex-1">
                        <p className="font-medium">{leave.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(leave.start_date).toLocaleDateString()} to {new Date(leave.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          leave.status === 'approved' ? 'default' :
                          leave.status === 'rejected' ? 'destructive' : 
                          'secondary'
                        }
                        className="capitalize"
                      >
                        {leave.status}
                      </Badge>
                    </div>
                  ))}
                  {stats.pendingLeaves > 0 && (
                    <Button variant="outline" className="w-full" onClick={() => navigate('/leave')}>
                      View {stats.pendingLeaves} Pending Requests
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-light tracking-wide">Top Performers</CardTitle>
                <CardDescription className="font-light">Employees with highest ratings</CardDescription>
              </div>
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No performance reviews yet</p>
              ) : (
                <>
                  {topPerformers.map((performance) => (
                    <div key={performance.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex-1">
                        <p className="font-medium">{performance.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(performance.review_period_start).toLocaleDateString()} - {new Date(performance.review_period_end).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-accent" />
                        <span className="font-semibold text-accent">{performance.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => navigate('/performance')}>
                    View All Reviews
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {(isAdminOrHR || isDepartmentHead) && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold">{stats.activeProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Work Hours</p>
                  <p className="text-2xl font-bold">{stats.avgWorkHours}h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departments</p>
                  <p className="text-2xl font-bold">{stats.totalDepartments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}