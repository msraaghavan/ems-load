import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, Calendar, TrendingUp, UserCheck, UserX, Briefcase, Award } from 'lucide-react';
import { mockEmployees, mockAttendance, mockLeaveRequests, mockPerformance } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const totalEmployees = mockEmployees.length;
  const activeEmployees = mockEmployees.filter(e => e.status === 'active').length;
  const onLeave = mockEmployees.filter(e => e.status === 'on_leave').length;
  const presentToday = mockAttendance.filter(a => a.status === 'present').length;
  const pendingLeaves = mockLeaveRequests.filter(l => l.status === 'pending').length;
  const avgRating = (mockPerformance.reduce((sum, p) => sum + p.overallRating, 0) / mockPerformance.length).toFixed(1);

  const recentLeaves = mockLeaveRequests.slice(0, 3);
  const topPerformers = mockPerformance.slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-extralight tracking-wider">Dashboard</h1>
        <p className="text-muted-foreground mt-2 font-light tracking-wide">Overview of your workforce</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={totalEmployees}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Present Today"
          value={presentToday}
          icon={UserCheck}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="On Leave"
          value={onLeave}
          icon={UserX}
        />
        <StatCard
          title="Avg Performance"
          value={avgRating}
          icon={Award}
          trend={{ value: 5, isPositive: true }}
        />
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
              {recentLeaves.map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex-1">
                    <p className="font-medium">{leave.employeeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {leave.startDate} to {leave.endDate}
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
              {pendingLeaves > 0 && (
                <Button variant="outline" className="w-full">
                  View {pendingLeaves} Pending Requests
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-light tracking-wide">Top Performers</CardTitle>
                <CardDescription className="font-light">Employees with highest ratings this quarter</CardDescription>
              </div>
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((performance) => (
                <div key={performance.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex-1">
                    <p className="font-medium">{performance.employeeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {performance.reviewPeriod}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-accent">{performance.overallRating}</span>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                View All Reviews
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">24</p>
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
                <p className="text-2xl font-bold">8.5h</p>
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
                <p className="text-2xl font-bold">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
