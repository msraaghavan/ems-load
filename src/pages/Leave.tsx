import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import { LeaveRequestDialog } from '@/components/LeaveRequestDialog';

interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  profiles: {
    full_name: string;
  };
}

export default function Leave() {
  const { user } = useSupabaseAuth();
  const { isAdminOrHR, companyId: userCompanyId } = useUserRole();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCompanyAndLeaves();
    }
  }, [user]);

  const fetchCompanyAndLeaves = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profile?.company_id) {
        setCompanyId(profile.company_id);
        await fetchLeaves(profile.company_id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async (company_id: string) => {
    // If not admin/HR, only fetch user's own leaves
    let query = supabase
      .from('leave_requests')
      .select('*')
      .eq('company_id', company_id);
    
    if (!isAdminOrHR && user) {
      query = query.eq('user_id', user.id);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leaves:', error);
      toast.error('Failed to load leave requests');
      return;
    }

    // Fetch profiles separately
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(l => l.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const leavesWithProfiles = data.map(leave => ({
        ...leave,
        profiles: profiles?.find(p => p.id === leave.user_id) || { full_name: 'Unknown' }
      }));

      setLeaveRequests(leavesWithProfiles);
    } else {
      setLeaveRequests([]);
    }
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('leave_requests')
      .update({ 
        status: 'approved',
        approved_by: user?.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to approve leave request');
      return;
    }

    toast.success('Leave request approved');
    if (companyId) fetchLeaves(companyId);
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('leave_requests')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) {
      toast.error('Failed to reject leave request');
      return;
    }

    toast.success('Leave request rejected');
    if (companyId) fetchLeaves(companyId);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
    };
    return variants[status as keyof typeof variants] || 'secondary';
  };

  const getTypeColor = (type: string) => {
    const colors = {
      sick: 'bg-destructive/10 text-destructive',
      casual: 'bg-accent/10 text-accent',
      vacation: 'bg-primary/10 text-primary',
      unpaid: 'bg-muted text-muted-foreground',
    };
    return colors[type as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const pendingCount = leaveRequests.filter(l => l.status === 'pending').length;
  const approvedCount = leaveRequests.filter(l => l.status === 'approved').length;

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
          <h1 className="text-3xl font-bold">{isAdminOrHR ? 'Leave Management' : 'My Leave Requests'}</h1>
          <p className="text-muted-foreground mt-1">
            {isAdminOrHR ? 'Manage leave requests and balances' : 'View and apply for leave'}
          </p>
        </div>
        {companyId && !isAdminOrHR && (
          <LeaveRequestDialog 
            onSuccess={() => fetchLeaves(companyId)} 
            companyId={companyId} 
          />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-3xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Check className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-3xl font-bold">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Days</p>
                <p className="text-3xl font-bold">18</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {leaveRequests.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No leave requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaveRequests.map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {leave.profiles?.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{leave.profiles?.full_name || 'Unknown'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-md font-medium capitalize ${getTypeColor(leave.leave_type)}`}>
                          {leave.leave_type}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(leave.start_date).toLocaleDateString()} to {new Date(leave.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right max-w-xs">
                      <p className="text-sm text-muted-foreground">Reason</p>
                      <p className="text-sm font-medium truncate">{leave.reason}</p>
                    </div>

                    <Badge variant={getStatusBadge(leave.status) as "default" | "destructive" | "secondary"} className="capitalize min-w-[90px] justify-center">
                      {leave.status}
                    </Badge>

                    {leave.status === 'pending' && isAdminOrHR && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" className="gap-1" onClick={() => handleApprove(leave.id)}>
                          <Check className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleReject(leave.id)}>
                          <X className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    )}
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
