export type UserRole = 'admin' | 'hr' | 'department_head' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  joinDate: string;
  status: 'active' | 'on_leave' | 'inactive';
  avatar?: string;
  managerId?: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'on_leave';
  hoursWorked?: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'sick' | 'casual' | 'vacation' | 'unpaid';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
}

export interface Performance {
  id: string;
  employeeId: string;
  employeeName: string;
  reviewPeriod: string;
  overallRating: number;
  goals: Goal[];
  feedback: string;
  reviewerId: string;
  reviewDate: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  achieved: number;
  status: 'on_track' | 'at_risk' | 'completed';
}

export interface Department {
  id: string;
  name: string;
  headId: string;
  headName: string;
  employeeCount: number;
  budget: number;
}

export interface Document {
  id: string;
  employeeId: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
  url: string;
}
