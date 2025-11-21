import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface PayrollRecord {
  id: string;
  user_id: string;
  employee_id: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  status: string;
  pay_period: string;
  pay_date: string | null;
}

interface Profile {
  full_name: string | null;
}

export default function Payroll() {
  const { user } = useSupabaseAuth();
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPayrollData();
    }
  }, [user]);

  const fetchPayrollData = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      const { data: payrollData, error } = await supabase
        .from('payroll')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      if (payrollData && payrollData.length > 0) {
        const userIds = [...new Set(payrollData.map(p => p.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        if (profilesData) {
          const profilesMap: Record<string, Profile> = {};
          profilesData.forEach(p => {
            profilesMap[p.id] = { full_name: p.full_name };
          });
          setProfiles(profilesMap);
        }
      }

      setPayrollRecords(payrollData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      setLoading(false);
    }
  };

  const downloadPayslip = (payroll: PayrollRecord) => {
    const employeeName = profiles[payroll.user_id]?.full_name || 'Unknown';
    
    const payslipData = {
      employee_name: employeeName,
      employee_id: payroll.employee_id,
      pay_period: payroll.pay_period,
      basic_salary: payroll.basic_salary,
      allowances: payroll.allowances,
      deductions: payroll.deductions,
      net_salary: payroll.net_salary,
      status: payroll.status,
      generated_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(payslipData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${payroll.employee_id}-${payroll.pay_period}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Payslip downloaded successfully');
  };

  const totalPayroll = payrollRecords.reduce((sum, p) => sum + p.net_salary, 0);
  const processedCount = payrollRecords.filter(p => p.status === 'processed').length;
  const pendingCount = payrollRecords.filter(p => p.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      processed: 'default',
      paid: 'default',
    };
    return variants[status as keyof typeof variants] || 'secondary';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

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
          <CardTitle>Payroll Records</CardTitle>
        </CardHeader>
        <CardContent>
          {payrollRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No payroll records found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payrollRecords.map((payroll) => {
                const employeeName = profiles[payroll.user_id]?.full_name || 'Unknown Employee';
                
                return (
                  <div
                    key={payroll.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${employeeName}`}
                        alt={employeeName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{employeeName}</p>
                        <p className="text-sm text-muted-foreground">Employee ID: {payroll.employee_id}</p>
                        <p className="text-sm text-muted-foreground">Period: {payroll.pay_period}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-8 items-center">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Basic Salary</p>
                        <p className="font-medium">${payroll.basic_salary.toLocaleString()}</p>
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
                        <p className="text-lg font-bold text-primary">${payroll.net_salary.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-6">
                      <Badge variant={getStatusBadge(payroll.status) as "default" | "destructive" | "secondary"} className="capitalize min-w-[90px] justify-center">
                        {payroll.status}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1"
                        onClick={() => downloadPayslip(payroll)}
                      >
                        <Download className="w-4 h-4" />
                        Payslip
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}