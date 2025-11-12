import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Download, Calendar as CalendarIcon } from 'lucide-react';
import { mockAttendance, mockEmployees } from '@/lib/mockData';

export default function Attendance() {
  const getEmployeeName = (id: string) => {
    return mockEmployees.find(e => e.id === id)?.name || 'Unknown';
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

  const presentCount = mockAttendance.filter(a => a.status === 'present').length;
  const absentCount = mockAttendance.filter(a => a.status === 'absent').length;
  const onLeaveCount = mockAttendance.filter(a => a.status === 'on_leave').length;
  const lateCount = mockAttendance.filter(a => a.status === 'late').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Tracking</h1>
          <p className="text-muted-foreground mt-1">Monitor employee attendance and hours</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <CalendarIcon className="w-4 h-4" />
            Select Date
          </Button>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-3xl font-bold">{presentCount}</p>
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
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-3xl font-bold">{absentCount}</p>
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
                <p className="text-sm text-muted-foreground">On Leave</p>
                <p className="text-3xl font-bold">{onLeaveCount}</p>
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
                <p className="text-sm text-muted-foreground">Late</p>
                <p className="text-3xl font-bold">{lateCount}</p>
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
          <CardTitle>Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAttendance.map((attendance) => (
              <div
                key={attendance.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 flex-1">
                  <img
                    src={mockEmployees.find(e => e.id === attendance.employeeId)?.avatar}
                    alt={getEmployeeName(attendance.employeeId)}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{getEmployeeName(attendance.employeeId)}</p>
                    <p className="text-sm text-muted-foreground">
                      {mockEmployees.find(e => e.id === attendance.employeeId)?.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {attendance.checkIn && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Check In</p>
                      <p className="font-medium">{attendance.checkIn}</p>
                    </div>
                  )}
                  
                  {attendance.checkOut && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Check Out</p>
                      <p className="font-medium">{attendance.checkOut}</p>
                    </div>
                  )}

                  {attendance.hoursWorked && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Hours</p>
                      <p className="font-medium">{attendance.hoursWorked}h</p>
                    </div>
                  )}

                  <Badge variant={getStatusBadge(attendance.status) as "default" | "destructive" | "secondary"} className="capitalize min-w-[90px] justify-center">
                    {attendance.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
