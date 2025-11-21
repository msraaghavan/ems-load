import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Download, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { AttendanceCheckInDialog } from '@/components/AttendanceCheckInDialog';
import { toast } from 'sonner';

interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  hours_worked: number | null;
  profiles: {
    full_name: string;
    department: string;
  };
}

export default function Attendance() {
  const { user } = useSupabaseAuth();
  const { isAdminOrHR, isDepartmentHead } = useUserRole();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCompanyAndAttendance();
    }
  }, [user]);

  const fetchCompanyAndAttendance = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profile?.company_id) {
        setCompanyId(profile.company_id);
        await fetchAttendance(profile.company_id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (company_id: string) => {
    let query = supabase
      .from('attendance')
      .select('*')
      .eq('company_id', company_id)
      .eq('date', new Date().toISOString().split('T')[0]);
    
    // If not admin/HR/department head, only fetch own attendance
    if (!isAdminOrHR && !isDepartmentHead && user) {
      query = query.eq('user_id', user.id);
    }
    
    const { data, error } = await query.order('check_in_time', { ascending: false });

    if (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance records');
      return;
    }

    // Fetch profiles separately
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, department')
        .in('id', userIds);

      const attendanceWithProfiles = data.map(record => ({
        ...record,
        profiles: profiles?.find(p => p.id === record.user_id) || { full_name: 'Unknown', department: 'N/A' }
      }));

      setAttendance(attendanceWithProfiles);
    } else {
      setAttendance([]);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      present: 'default',
      absent: 'destructive',
      late: 'secondary',
      on_leave: 'secondary',
    };
    return variants[status as keyof typeof variants] || 'secondary';
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '--:--';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;
  const onLeaveCount = attendance.filter(a => a.status === 'on_leave').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extralight tracking-wider">
            {isAdminOrHR || isDepartmentHead ? 'Attendance Tracking' : 'My Attendance'}
          </h1>
          <p className="text-muted-foreground mt-2 font-light tracking-wide">
            {isAdminOrHR || isDepartmentHead ? 'Monitor employee attendance and hours' : 'Track your attendance and working hours'}
          </p>
        </div>
        <div className="flex gap-2">
          <AttendanceCheckInDialog 
            onSuccess={() => companyId && fetchAttendance(companyId)} 
            companyId={companyId || ''} 
          />
          {(isAdminOrHR || isDepartmentHead) && (
            <>
              <Button variant="outline" className="gap-2 font-light tracking-wide">
                <CalendarIcon className="w-4 h-4" />
                Select Date
              </Button>
              <Button className="gap-2 font-light tracking-wide">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-light">Present</p>
                <p className="text-3xl font-extralight">{presentCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-light">Absent</p>
                <p className="text-3xl font-extralight">{absentCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-light">On Leave</p>
                <p className="text-3xl font-extralight">{onLeaveCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-light">Late</p>
                <p className="text-3xl font-extralight">{lateCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-light tracking-wide">Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-light">No attendance records for today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {record.profiles?.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-light">{record.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground font-light">
                        {record.profiles?.department || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Check In</p>
                      <p className="font-medium">{formatTime(record.check_in_time)}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Check Out</p>
                      <p className="font-medium">{formatTime(record.check_out_time)}</p>
                    </div>

                    {record.hours_worked && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Hours</p>
                        <p className="font-medium">{record.hours_worked}h</p>
                      </div>
                    )}

                    <Badge variant={getStatusBadge(record.status) as "default" | "destructive" | "secondary"} className="capitalize min-w-[90px] justify-center">
                      {record.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
