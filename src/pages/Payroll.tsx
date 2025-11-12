import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Download, FileText } from 'lucide-react';
import { mockPayroll } from '@/lib/mockData';

export default function Payroll() {
  const totalPayroll = mockPayroll.reduce((sum, p) => sum + p.netSalary, 0);
  const processedCount = mockPayroll.filter(p => p.status === 'processed').length;
  const pendingCount = mockPayroll.filter(p => p.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      processed: 'default',
      paid: 'default',
    };
    return variants[status as keyof typeof variants] || 'secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground mt-1">Process and manage employee salaries</p>
        </div>
        <Button className="gap-2">
          <FileText className="w-4 h-4" />
          Generate Payslips
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payroll</p>
                <p className="text-3xl font-bold">${totalPayroll.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processed</p>
                <p className="text-3xl font-bold">{processedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Records - January 2025</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockPayroll.map((payroll) => (
              <div
                key={payroll.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 flex-1">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${payroll.employeeName}`}
                    alt={payroll.employeeName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{payroll.employeeName}</p>
                    <p className="text-sm text-muted-foreground">Employee ID: {payroll.employeeId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-8 items-center">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Basic Salary</p>
                    <p className="font-medium">${payroll.basicSalary.toLocaleString()}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Allowances</p>
                    <p className="font-medium text-success">+${payroll.allowances.toLocaleString()}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Deductions</p>
                    <p className="font-medium text-destructive">-${payroll.deductions.toLocaleString()}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Net Salary</p>
                    <p className="text-lg font-bold text-primary">${payroll.netSalary.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-6">
                  <Badge variant={getStatusBadge(payroll.status) as "default" | "destructive" | "secondary"} className="capitalize min-w-[90px] justify-center">
                    {payroll.status}
                  </Badge>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Download className="w-4 h-4" />
                    Payslip
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
