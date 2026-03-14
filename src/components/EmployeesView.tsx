import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  XCircle,
  Clock,
  UserPlus,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee, LeaveRequest, UserRole } from '../types/hr';

const mockEmployees: Employee[] = [
  { id: 'EMP-2026-001', name: 'John Doe', role: 'Senior Developer', department: 'Engineering', email: 'john.doe@optimahr.com', joiningDate: '2024-01-15', status: 'Active' },
  { id: 'EMP-2026-002', name: 'Jane Smith', role: 'Product Designer', department: 'Design', email: 'jane.s@optimahr.com', joiningDate: '2024-03-20', status: 'Active' },
  { id: 'EMP-2026-003', name: 'Robert Brown', role: 'HR Manager', department: 'Human Resources', email: 'r.brown@optimahr.com', joiningDate: '2023-11-10', status: 'Active' },
  { id: 'EMP-2026-004', name: 'Emily Davis', role: 'Backend Engineer', department: 'Engineering', email: 'e.davis@optimahr.com', joiningDate: '2025-02-01', status: 'Active' },
];

const mockPendingLeaves: (LeaveRequest & { employeeName: string })[] = [
  { id: 'L-001', employeeId: 'EMP-2026-001', employeeName: 'John Doe', type: 'Sick', startDate: '2026-03-01', endDate: '2026-03-02', status: 'Pending', reason: 'Medical appointment' },
  { id: 'L-002', employeeId: 'EMP-2026-002', employeeName: 'Jane Smith', type: 'Casual', startDate: '2026-03-05', endDate: '2026-03-07', status: 'Pending', reason: 'Personal errands' },
];

interface EmployeesViewProps {
  role: UserRole;
}

const EmployeesView: React.FC<EmployeesViewProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending-leaves'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [newSalary, setNewSalary] = useState(5000);
  const [newRole, setNewRole] = useState('');

  const isAdmin = role === 'HR_ADMIN';

  const handlePromote = (emp: Employee) => {
    setSelectedEmployee(emp);
    setNewRole(emp.role);
    setShowPromoteModal(true);
  };

  const handleEditSalary = (emp: Employee) => {
    setSelectedEmployee(emp);
    setNewSalary(5000); // Default or fetch existing
    setShowSalaryModal(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Employee Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage workforce records and administrative actions.</p>
        </div>
        {isAdmin && (
          <button className="btn-primary flex items-center gap-2">
            <UserPlus size={18} />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-2 text-sm font-bold transition-all relative ${activeTab === 'all' ? 'text-navy' : 'text-slate-400 hover:text-slate-600'}`}
        >
          All Employees
          {activeTab === 'all' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy" />}
        </button>
        {isAdmin && (
          <button 
            onClick={() => setActiveTab('pending-leaves')}
            className={`pb-3 px-2 text-sm font-bold transition-all relative ${activeTab === 'pending-leaves' ? 'text-navy' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Pending Leave Approvals
            <span className="ml-2 px-1.5 py-0.5 bg-muted-red text-white text-[10px] rounded-full">2</span>
            {activeTab === 'pending-leaves' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy" />}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'all' ? (
          <motion.div 
            key="all"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-off-white/50">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Search directory..." className="input-field py-1.5 pl-9 text-xs" />
              </div>
              <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                <Filter size={18} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-off-white text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Role & Dept</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Joined Date</th>
                    {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-off-white transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-navy font-bold text-xs">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-navy">{emp.name}</p>
                            <p className="text-[10px] text-slate-400">{emp.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-xs font-bold text-navy">{emp.role}</p>
                          <p className="text-[10px] text-slate-500">{emp.department}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge badge-success">{emp.status}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{emp.joiningDate}</td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handlePromote(emp)}
                              className="p-1.5 text-slate-400 hover:text-emerald hover:bg-white rounded-lg border border-transparent hover:border-slate-200" title="Promote"
                            >
                              <ArrowUpRight size={16} />
                            </button>
                            <button 
                              onClick={() => handleEditSalary(emp)}
                              className="p-1.5 text-slate-400 hover:text-slate-blue hover:bg-white rounded-lg border border-transparent hover:border-slate-200" title="Edit Salary"
                            >
                              <DollarSign size={16} />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-navy hover:bg-white rounded-lg border border-transparent hover:border-slate-200">
                              <MoreHorizontal size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="pending"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {mockPendingLeaves.map((leave) => (
              <div key={leave.id} className="card p-6 flex items-center justify-between group hover:border-navy/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-navy/5 flex items-center justify-center text-navy font-bold">
                    {leave.employeeName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-navy">{leave.employeeName}</h4>
                      <span className="badge badge-info">{leave.type} Leave</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      <Clock size={12} className="inline mr-1" />
                      {leave.startDate} to {leave.endDate} • {leave.reason}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs text-muted-red hover:bg-muted-red/5 border-muted-red/20 flex items-center gap-2">
                    <XCircle size={16} />
                    <span>Decline</span>
                  </button>
                  <button className="btn-primary text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPromoteModal && selectedEmployee && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-md p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-navy">Promote Employee</h3>
                <button onClick={() => setShowPromoteModal(false)} className="text-slate-400 hover:text-navy">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-off-white rounded-xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-navy font-bold">
                    {selectedEmployee.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-navy">{selectedEmployee.name}</p>
                    <p className="text-xs text-slate-500">Current: {selectedEmployee.role}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Designation</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="e.g. Lead Developer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Effective Date</label>
                  <input type="date" className="input-field" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowPromoteModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => setShowPromoteModal(false)} className="btn-primary flex-1">Confirm Promotion</button>
              </div>
            </motion.div>
          </div>
        )}

        {showSalaryModal && selectedEmployee && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-md p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-navy">Adjust Salary</h3>
                <button onClick={() => setShowSalaryModal(false)} className="text-slate-400 hover:text-navy">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-off-white rounded-xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-navy font-bold">
                    {selectedEmployee.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-navy">{selectedEmployee.name}</p>
                    <p className="text-xs text-slate-500">{selectedEmployee.role}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Monthly Gross ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="number" 
                      className="input-field pl-10" 
                      value={newSalary}
                      onChange={(e) => setNewSalary(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="p-4 bg-emerald/5 rounded-xl border border-emerald/10">
                  <p className="text-[10px] font-bold text-emerald uppercase tracking-widest mb-2">Projected Breakdown</p>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Basic (50%)</span>
                    <span className="font-bold text-navy">${(newSalary * 0.5).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">HRA & Allowances (50%)</span>
                    <span className="font-bold text-navy">${(newSalary * 0.5).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowSalaryModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => setShowSalaryModal(false)} className="btn-primary flex-1">Update Salary</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeesView;
