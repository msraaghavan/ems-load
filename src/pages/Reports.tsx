import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, TrendingUp, Users, Clock, Calendar, DollarSign, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { convertToCSV, downloadCSV, formatDate, formatDateTime } from '@/lib/csvExport';

export default function Reports() {
  const { user } = useSupabaseAuth();
  const { isAdminOrHR, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [generating, setGenerating] = useState<number | null>(null);

  // Redirect if not authorized (only after role is loaded)
  useEffect(() => {
    if (user && !roleLoading && !isAdminOrHR) {
      navigate('/dashboard');
    }
  }, [isAdminOrHR, roleLoading, user, navigate]);

  useEffect(() => {
    if (user) {
      fetchCompanyId();
    }
  }, [user]);

  const fetchCompanyId = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user?.id)
      .single();
    
    if (profile?.company_id) {
      setCompanyId(profile.company_id);
    }
  };

  const exportEmployeesCSV = async () => {
    if (!companyId) {
      toast.error('Company not found');
      return;
    }

    setGenerating(4);
    
    try {
      const { data: employees, error } = await supabase
        .from('profiles')
        .select('id, full_name, department, position, phone, created_at')
        .eq('company_id', companyId);

      if (error) throw error;

      if (!employees || employees.length === 0) {
        toast.error('No employee data found');
        return;
      }

      // Format data for CSV
      const csvData = employees.map(emp => ({
        'Employee ID': emp.id,
        'Full Name': emp.full_name || '',
        'Department': emp.department || '',
        'Position': emp.position || '',
        'Phone': emp.phone || '',
        'Joined Date': formatDate(emp.created_at)
      }));

      const csvContent = convertToCSV(
        csvData,
        ['Employee ID', 'Full Name', 'Department', 'Position', 'Phone', 'Joined Date']
      );

      downloadCSV(csvContent, `employees-export-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Employees data exported successfully');
    } catch (error: any) {
      console.error('Error exporting employees:', error);
      toast.error('Failed to export employees data');
    } finally {
      setGenerating(null);
    }
  };

  const exportAttendanceCSV = async () => {
    if (!companyId) {
      toast.error('Company not found');
      return;
    }

    setGenerating(5);
    
    try {
      // Get last 30 days of attendance
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select('user_id, date, check_in_time, check_out_time, hours_worked, status')
        .eq('company_id', companyId)
        .gte('date', startDate)
        .order('date', { ascending: false });

      if (error) throw error;

      if (!attendance || attendance.length === 0) {
        toast.error('No attendance data found for the last 30 days');
        return;
      }

      // Get employee names
      const userIds = [...new Set(attendance.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      // Format data for CSV
      const csvData = attendance.map(att => ({
        'Employee Name': profileMap.get(att.user_id) || 'Unknown',
        'Date': formatDate(att.date),
        'Check In': att.check_in_time ? formatDateTime(att.check_in_time) : '',
        'Check Out': att.check_out_time ? formatDateTime(att.check_out_time) : '',
        'Hours Worked': att.hours_worked || '',
        'Status': att.status || ''
      }));

      const csvContent = convertToCSV(
        csvData,
        ['Employee Name', 'Date', 'Check In', 'Check Out', 'Hours Worked', 'Status']
      );

      downloadCSV(csvContent, `attendance-export-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Attendance data exported successfully');
    } catch (error: any) {
      console.error('Error exporting attendance:', error);
      toast.error('Failed to export attendance data');
    } finally {
      setGenerating(null);
    }
  };

  const exportPayrollCSV = async () => {
    if (!companyId) {
      toast.error('Company not found');
      return;
    }

    setGenerating(6);
    
    try {
      const { data: payroll, error } = await supabase
        .from('payroll')
        .select('user_id, employee_id, pay_period, basic_salary, allowances, deductions, net_salary, status, pay_date')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!payroll || payroll.length === 0) {
        toast.error('No payroll data found');
        return;
      }

      // Get employee names
      const userIds = [...new Set(payroll.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      // Format data for CSV
      const csvData = payroll.map(pay => ({
        'Employee Name': profileMap.get(pay.user_id) || 'Unknown',
        'Employee ID': pay.employee_id,
        'Pay Period': pay.pay_period,
        'Basic Salary': pay.basic_salary,
        'Allowances': pay.allowances,
        'Deductions': pay.deductions,
        'Net Salary': pay.net_salary,
        'Status': pay.status || '',
        'Pay Date': formatDate(pay.pay_date)
      }));

      const csvContent = convertToCSV(
        csvData,
        ['Employee Name', 'Employee ID', 'Pay Period', 'Basic Salary', 'Allowances', 'Deductions', 'Net Salary', 'Status', 'Pay Date']
      );

      downloadCSV(csvContent, `payroll-export-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Payroll data exported successfully');
    } catch (error: any) {
      console.error('Error exporting payroll:', error);
      toast.error('Failed to export payroll data');
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateReport = async (reportType: string, reportId: number) => {
    // Handle CSV exports directly
    if (reportType === 'employees') {
      await exportEmployeesCSV();
      return;
    }
    if (reportType === 'attendance-csv') {
      await exportAttendanceCSV();
      return;
    }
    if (reportType === 'payroll') {
      await exportPayrollCSV();
      return;
    }

    // Handle edge function reports
    if (!companyId) {
      toast.error('Company not found');
      return;
    }

    setGenerating(reportId);
    
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          company_id: companyId,
          report_type: reportType,
          start_date: startDate,
          end_date: endDate
        }
      });

      if (error) throw error;

      toast.success(`${reportType} report generated successfully`);
      
      // Download the report as JSON
      downloadReport(data.report, reportType);
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  const downloadReport = (reportData: any, reportType: string) => {
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reportTypes = [
    {
      id: 4,
      title: 'Employee Directory Export',
      description: 'Complete list of all employees with contact details (CSV)',
      icon: Users,
      category: 'Employees',
      type: 'employees',
      format: 'CSV'
    },
    {
      id: 5,
      title: 'Attendance Records Export',
      description: 'Last 30 days of attendance data for all employees (CSV)',
      icon: UserCheck,
      category: 'Attendance',
      type: 'attendance-csv',
      format: 'CSV'
    },
    {
      id: 6,
      title: 'Payroll Data Export',
      description: 'Complete payroll records with salary breakdowns (CSV)',
      icon: DollarSign,
      category: 'Payroll',
      type: 'payroll',
      format: 'CSV'
    },
    {
      id: 1,
      title: 'Monthly Attendance Report',
      description: 'Comprehensive attendance analytics report (JSON)',
      icon: Clock,
      category: 'Attendance',
      type: 'attendance',
      format: 'JSON'
    },
    {
      id: 2,
      title: 'Leave Analytics',
      description: 'Leave patterns and balance tracking report (JSON)',
      icon: Calendar,
      category: 'Leave',
      type: 'leave',
      format: 'JSON'
    },
    {
      id: 3,
      title: 'Performance Overview',
      description: 'Employee performance metrics and ratings (JSON)',
      icon: TrendingUp,
      category: 'Performance',
      type: 'performance',
      format: 'JSON'
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
                <p className="text-sm text-muted-foreground">CSV Exports</p>
                <p className="text-3xl font-bold">3</p>
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
                <p className="text-sm text-muted-foreground">JSON Reports</p>
                <p className="text-3xl font-bold">3</p>
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
                    <p className="text-xs text-muted-foreground">Format</p>
                    <p className="font-medium">{report.format}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    className="flex-1 gap-2" 
                    onClick={() => handleGenerateReport(report.type, report.id)}
                    disabled={generating === report.id}
                  >
                    <FileText className="w-4 h-4" />
                    {generating === report.id ? 'Generating...' : 'Generate & Download'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}