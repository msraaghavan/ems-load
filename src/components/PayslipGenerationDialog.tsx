import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface PayslipGenerationDialogProps {
  onSuccess: () => void;
  companyId: string;
}

interface Employee {
  id: string;
  full_name: string | null;
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  percentage: number;
}

export function PayslipGenerationDialog({ onSuccess, companyId }: PayslipGenerationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [payPeriod, setPayPeriod] = useState('');
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [calculatedAllowances, setCalculatedAllowances] = useState(0);
  const [calculatedDeductions, setCalculatedDeductions] = useState(0);
  const [netSalary, setNetSalary] = useState(0);

  useEffect(() => {
    if (open) {
      fetchEmployees();
      // Set default pay period to current month
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setPayPeriod(period);
    }
  }, [open]);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('company_id', companyId)
      .order('full_name');

    if (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
      return;
    }

    setEmployees(data || []);
  };

  const calculateAttendance = async (employeeId: string) => {
    if (!employeeId || !payPeriod) return;

    setCalculating(true);

    try {
      // Parse pay period (YYYY-MM)
      const [year, month] = payPeriod.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch attendance records for the period
      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', employeeId)
        .eq('company_id', companyId)
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      if (error) throw error;

      const totalDays = endDate.getDate();
      const presentDays = attendanceData?.filter(a => a.status === 'present').length || 0;
      const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      setAttendanceStats({
        totalDays,
        presentDays,
        percentage
      });

      toast.success('Attendance calculated successfully');
    } catch (error) {
      console.error('Error calculating attendance:', error);
      toast.error('Failed to calculate attendance');
    } finally {
      setCalculating(false);
    }
  };

  const calculateSalary = () => {
    if (!basicSalary || !attendanceStats) {
      toast.error('Please enter basic salary and calculate attendance');
      return;
    }

    const salary = parseFloat(basicSalary);
    let allowances = 0;
    let deductions = 0;

    // Attendance-based bonus/cut logic
    if (attendanceStats.percentage >= 95) {
      // 95%+ attendance: 10% bonus
      allowances = salary * 0.10;
    } else if (attendanceStats.percentage >= 90) {
      // 90-95% attendance: 5% bonus
      allowances = salary * 0.05;
    } else if (attendanceStats.percentage >= 80) {
      // 80-90% attendance: no bonus/cut
      allowances = 0;
      deductions = 0;
    } else if (attendanceStats.percentage >= 70) {
      // 70-80% attendance: 5% cut
      deductions = salary * 0.05;
    } else {
      // Below 70% attendance: 10% cut
      deductions = salary * 0.10;
    }

    const net = salary + allowances - deductions;

    setCalculatedAllowances(allowances);
    setCalculatedDeductions(deductions);
    setNetSalary(net);

    toast.success('Salary calculated successfully');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee || !basicSalary || !payPeriod || !attendanceStats) {
      toast.error('Please fill in all fields and calculate salary');
      return;
    }

    setLoading(true);

    try {
      // Generate employee ID
      const employeeData = employees.find(e => e.id === selectedEmployee);
      const employeeId = `EMP${selectedEmployee.substring(0, 8).toUpperCase()}`;

      const { error } = await supabase
        .from('payroll')
        .insert({
          user_id: selectedEmployee,
          company_id: companyId,
          employee_id: employeeId,
          basic_salary: parseFloat(basicSalary),
          allowances: calculatedAllowances,
          deductions: calculatedDeductions,
          net_salary: netSalary,
          pay_period: payPeriod,
          status: 'processed',
          pay_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast.success(`Payslip generated for ${employeeData?.full_name || 'employee'}`);
      setOpen(false);
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error generating payslip:', error);
      toast.error('Failed to generate payslip');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedEmployee('');
    setBasicSalary('');
    setAttendanceStats(null);
    setCalculatedAllowances(0);
    setCalculatedDeductions(0);
    setNetSalary(0);
  };

  useEffect(() => {
    if (selectedEmployee && payPeriod) {
      calculateAttendance(selectedEmployee);
    }
  }, [selectedEmployee, payPeriod]);

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 95) return 'text-success';
    if (percentage >= 90) return 'text-primary';
    if (percentage >= 80) return 'text-warning';
    return 'text-destructive';
  };

  const getAttendanceLabel = (percentage: number) => {
    if (percentage >= 95) return 'Excellent (10% Bonus)';
    if (percentage >= 90) return 'Very Good (5% Bonus)';
    if (percentage >= 80) return 'Good (No Change)';
    if (percentage >= 70) return 'Fair (5% Cut)';
    return 'Poor (10% Cut)';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FileText className="w-4 h-4" />
          Generate Payslips
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generate Employee Payslip</DialogTitle>
          <DialogDescription>
            Calculate salary based on attendance and generate payslip
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Select Employee</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger id="employee">
                <SelectValue placeholder="Choose an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-period">Pay Period (Month)</Label>
            <Input
              id="pay-period"
              type="month"
              value={payPeriod}
              onChange={(e) => setPayPeriod(e.target.value)}
            />
          </div>

          {attendanceStats && (
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Attendance Report</h4>
                <Badge variant="outline" className={getAttendanceColor(attendanceStats.percentage)}>
                  {attendanceStats.percentage.toFixed(1)}%
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  Present: {attendanceStats.presentDays} / {attendanceStats.totalDays} days
                </p>
                <p className={`font-medium ${getAttendanceColor(attendanceStats.percentage)}`}>
                  {getAttendanceLabel(attendanceStats.percentage)}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="basic-salary">Basic Salary ($)</Label>
            <Input
              id="basic-salary"
              type="number"
              value={basicSalary}
              onChange={(e) => setBasicSalary(e.target.value)}
              placeholder="Enter base salary"
              min="0"
              step="0.01"
            />
          </div>

          {basicSalary && attendanceStats && (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={calculateSalary}
            >
              <Calculator className="w-4 h-4" />
              Calculate Net Salary
            </Button>
          )}

          {netSalary > 0 && (
            <div className="p-4 rounded-lg border bg-card space-y-3">
              <h4 className="font-medium">Salary Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Basic Salary:</span>
                  <span className="font-medium">${parseFloat(basicSalary).toLocaleString()}</span>
                </div>
                {calculatedAllowances > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allowances (Bonus):</span>
                    <span className="font-medium text-success">+${calculatedAllowances.toLocaleString()}</span>
                  </div>
                )}
                {calculatedDeductions > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deductions (Cut):</span>
                    <span className="font-medium text-destructive">-${calculatedDeductions.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Net Salary:</span>
                  <span className="font-semibold text-primary text-lg">${netSalary.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !netSalary}>
              {loading ? 'Generating...' : 'Generate Payslip'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}