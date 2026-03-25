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
  jobTitle?: string;
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
  salary?: number;
}

export interface LeaveBalance {
  sick: number;
  casual: number;
  unpaid: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  type: 'Sick' | 'Casual' | 'Unpaid';
  startDate: string;
  endDate: string;
  days: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
  appliedAt?: any;
}

export interface PerformanceGoal {
  id: string;
  employeeId: string;
  title: string;
  weight: number;
  score?: number;
  createdAt: any;
}

export interface Appraisal {
  id: string;
  employeeId: string;
  period: string;
  managerRemarks?: string;
  overallScore?: number;
  status: 'Draft' | 'Submitted' | 'Reviewed' | 'Closed';
  updatedAt: any;
  timeline: {
    label: string;
    date: string;
    status: 'completed' | 'pending';
  }[];
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  grossSalary: number;
  breakdown: {
    basic: number;
    hra: number;
    allowances: number;
  };
  deductions: {
    tax: number;
    providentFund: number;
    unpaidLeave?: number;
  };
  netSalary: number;
  status: 'Paid' | 'Pending';
  processedAt: any;
}
