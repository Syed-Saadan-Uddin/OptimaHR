export type UserRole = 'HR_ADMIN' | 'DEPT_HEAD' | 'EMPLOYEE' | 'CANDIDATE';

export interface JobListing {
  id: string;
  title: string;
  department: string;
  location: string;
  description: string;
  postedDate: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  appliedJobId: string;
  status: 'Applied' | 'Shortlisted' | 'Rejected' | 'Hired';
  interviewScore?: number;
  appliedDate: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  joiningDate: string;
  status: 'Active' | 'Inactive';
}

export interface LeaveBalance {
  sick: number;
  casual: number;
  unpaid: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'Sick' | 'Casual' | 'Unpaid';
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
}

export interface PerformanceGoal {
  id: string;
  title: string;
  weight: number;
  score?: number;
}

export interface Payslip {
  id: string;
  month: string;
  year: number;
  gross: number;
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  tax: number;
  net: number;
}
