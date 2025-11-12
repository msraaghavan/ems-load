import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, TrendingUp, Users, Clock, Calendar } from 'lucide-react';

export default function Reports() {
  const reportTypes = [
    {
      id: 1,
      title: 'Monthly Attendance Report',
      description: 'Comprehensive attendance data for all employees',
      icon: Clock,
      category: 'Attendance',
      lastGenerated: '2025-01-10',
    },
    {
      id: 2,
      title: 'Payroll Summary',
      description: 'Complete payroll breakdown and salary distribution',
      icon: FileText,
      category: 'Payroll',
      lastGenerated: '2025-01-08',
    },
    {
      id: 3,
      title: 'Leave Analytics',
      description: 'Leave patterns and balance tracking report',
      icon: Calendar,
      category: 'Leave',
      lastGenerated: '2025-01-09',
    },
    {
      id: 4,
      title: 'Performance Overview',
      description: 'Employee performance metrics and ratings',
      icon: TrendingUp,
      category: 'Performance',
      lastGenerated: '2025-01-07',
    },
    {
      id: 5,
      title: 'Department Analysis',
      description: 'Department-wise resource and budget analysis',
      icon: Users,
      category: 'Department',
      lastGenerated: '2025-01-06',
    },
    {
      id: 6,
      title: 'Headcount Report',
      description: 'Employee count trends and turnover analysis',
      icon: Users,
      category: 'HR',
      lastGenerated: '2025-01-05',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Generate and export various reports</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-3xl font-bold">{reportTypes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Download className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Downloads This Month</p>
                <p className="text-3xl font-bold">142</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Report Types</p>
                <p className="text-3xl font-bold">6</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription className="mt-1">{report.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="font-medium">{report.category}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-xs text-muted-foreground">Last Generated</p>
                    <p className="font-medium">{new Date(report.lastGenerated).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1 gap-2">
                    <FileText className="w-4 h-4" />
                    Generate
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest report generation and downloads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { user: 'Sarah Johnson', action: 'generated', report: 'Monthly Attendance Report', time: '2 hours ago' },
              { user: 'Michael Chen', action: 'downloaded', report: 'Payroll Summary', time: '5 hours ago' },
              { user: 'Emily Rodriguez', action: 'generated', report: 'Performance Overview', time: '1 day ago' },
              { user: 'David Kumar', action: 'downloaded', report: 'Leave Analytics', time: '2 days ago' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.user}`}
                    alt={activity.user}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span>{' '}
                      <span className="text-muted-foreground">{activity.action}</span>{' '}
                      <span className="font-medium">{activity.report}</span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
