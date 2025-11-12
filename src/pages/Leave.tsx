import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Check, X } from 'lucide-react';
import { mockLeaveRequests } from '@/lib/mockData';

export default function Leave() {
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

  const pendingCount = mockLeaveRequests.filter(l => l.status === 'pending').length;
  const approvedCount = mockLeaveRequests.filter(l => l.status === 'approved').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground mt-1">Manage leave requests and balances</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Leave Request
        </Button>
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
          <div className="space-y-4">
            {mockLeaveRequests.map((leave) => (
              <div
                key={leave.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 flex-1">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${leave.employeeName}`}
                    alt={leave.employeeName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{leave.employeeName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-md font-medium capitalize ${getTypeColor(leave.type)}`}>
                        {leave.type}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {leave.startDate} to {leave.endDate}
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

                  {leave.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" className="gap-1">
                        <Check className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1">
                        <X className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {leave.status === 'approved' && leave.approvedBy && (
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Approved by</p>
                      <p className="font-medium">{leave.approvedBy}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
