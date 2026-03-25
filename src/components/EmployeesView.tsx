import React, { useState, useEffect } from 'react';
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
  ArrowUpRight,
  Download,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee, LeaveRequest, UserRole } from '../types/hr';
import { db } from '../firebase';
import { collection, onSnapshot, updateDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firestoreUtils';

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
  const [newSystemRole, setNewSystemRole] = useState<UserRole>('CANDIDATE');
  const [newDepartment, setNewDepartment] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE' as UserRole,
    jobTitle: '',
    department: '',
    salary: 5000,
    joiningDate: new Date().toISOString().split('T')[0]
  });
  const [pendingLeaves, setPendingLeaves] = useState<(LeaveRequest & { employeeName: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const isAdmin = role === 'HR_ADMIN';

  useEffect(() => {
    if (!role || (role !== 'HR_ADMIN' && role !== 'DEPT_HEAD')) {
      setLoading(false);
      return;
    }

    // Fetch all users (HR can manage everyone)
    const employeesQuery = query(collection(db, 'users'), orderBy('name'));
    const unsubscribeEmployees = onSnapshot(employeesQuery, (snapshot) => {
      const employeesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setEmployees(employeesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // Fetch pending leaves
    const leavesQuery = query(collection(db, 'leaves'), where('status', '==', 'Pending'));
    const unsubscribeLeaves = onSnapshot(leavesQuery, (snapshot) => {
      const leavesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setPendingLeaves(leavesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leaves');
    });

    // Fetch departments
    const unsubscribeDepts = onSnapshot(doc(db, 'settings', 'organization'), (snapshot) => {
      if (snapshot.exists()) {
        setDepartments(snapshot.data().departments || []);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/organization');
    });

    return () => {
      unsubscribeEmployees();
      unsubscribeLeaves();
      unsubscribeDepts();
    };
  }, []);

  const handlePromote = (emp: any) => {
    setSelectedEmployee(emp);
    setNewRole(emp.jobTitle || emp.role || '');
    setNewSystemRole(emp.role as UserRole);
    setNewDepartment(emp.department || '');
    setShowPromoteModal(true);
  };

  const handleEditSalary = (emp: Employee) => {
    setSelectedEmployee(emp);
    setNewSalary(emp.salary || 5000);
    setNewDepartment(emp.department || '');
    setShowSalaryModal(true);
  };

  const confirmPromotion = async () => {
    if (!selectedEmployee) return;
    try {
      await updateDoc(doc(db, 'users', selectedEmployee.id), { 
        jobTitle: newRole,
        role: newSystemRole,
        department: newDepartment
      });
      setShowPromoteModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${selectedEmployee.id}`);
    }
  };

  const confirmSalaryUpdate = async () => {
    if (!selectedEmployee) return;
    try {
      await updateDoc(doc(db, 'users', selectedEmployee.id), { 
        salary: newSalary,
        department: newDepartment
      });
      setShowSalaryModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${selectedEmployee.id}`);
    }
  };

  const handleAddEmployee = async () => {
    try {
      // In a real app, we'd use Firebase Auth to create the user first.
      // For this demo, we'll just add to the users collection.
      const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
      const newEmpId = `EMP-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      await setDoc(doc(db, 'users', newEmpId), {
        ...addForm,
        status: 'Active',
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setAddForm({
        name: '',
        email: '',
        role: 'EMPLOYEE',
        jobTitle: '',
        department: '',
        salary: 5000,
        joiningDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
    }
  };

  const handleLeaveAction = async (leaveId: string, status: 'Approved' | 'Rejected') => {
    try {
      await updateDoc(doc(db, 'leaves', leaveId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leaves/${leaveId}`);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Employee Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage workforce records and administrative actions.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
          >
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
            {pendingLeaves.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-muted-red text-white text-[10px] rounded-full">
                {pendingLeaves.length}
              </span>
            )}
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
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-off-white/50">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search directory..." 
                  className="input-field py-1.5 !pl-9 text-xs w-full" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg self-end sm:self-auto">
                <Filter size={18} />
              </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
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
                  {loading ? (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4} className="px-6 py-20 text-center">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-navy rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
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
                          <span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{emp.status}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">{emp.joiningDate}</td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity relative">
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
                              
                              <div className="relative">
                                <button 
                                  onClick={() => setActiveDropdown(activeDropdown === emp.id ? null : emp.id)}
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    activeDropdown === emp.id ? 'bg-navy text-white border-navy' : 'text-slate-400 hover:text-navy hover:bg-white border-transparent hover:border-slate-200'
                                  }`}
                                >
                                  <MoreHorizontal size={16} />
                                </button>
                                
                                <AnimatePresence>
                                  {activeDropdown === emp.id && (
                                    <>
                                      <div 
                                        className="fixed inset-0 z-[60]" 
                                        onClick={() => setActiveDropdown(null)}
                                      />
                                      <motion.div 
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-[70] text-left"
                                      >
                                        <button 
                                          onClick={() => {
                                            const resume = (emp as any).resume;
                                            if (resume) {
                                              const link = document.createElement('a');
                                              link.href = resume.base64;
                                              link.download = resume.name;
                                              link.click();
                                            } else {
                                              alert('No resume found for this employee.');
                                            }
                                            setActiveDropdown(null);
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-off-white rounded-lg transition-colors"
                                        >
                                          <Download size={14} />
                                          Download Resume
                                        </button>
                                        <button 
                                          onClick={() => {
                                            handlePromote(emp);
                                            setActiveDropdown(null);
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-off-white rounded-lg transition-colors"
                                        >
                                          <ArrowUpRight size={14} />
                                          Promote Employee
                                        </button>
                                        <button 
                                          onClick={() => {
                                            handleEditSalary(emp);
                                            setActiveDropdown(null);
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-off-white rounded-lg transition-colors"
                                        >
                                          <DollarSign size={14} />
                                          Adjust Salary
                                        </button>
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4} className="px-6 py-10 text-center text-slate-500">No employees found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {loading ? (
                <div className="p-10 text-center">
                  <div className="w-8 h-8 border-3 border-slate-200 border-t-navy rounded-full animate-spin mx-auto" />
                </div>
              ) : filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <div key={emp.id} className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-navy font-bold text-sm">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy">{emp.name}</p>
                          <p className="text-[10px] text-slate-400">{emp.id}</p>
                        </div>
                      </div>
                      <span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{emp.status}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                      <div>
                        <p className="mb-1">Role & Dept</p>
                        <p className="text-navy normal-case font-bold text-xs">{emp.role}</p>
                        <p className="text-slate-500 normal-case font-medium text-[10px]">{emp.department}</p>
                      </div>
                      <div>
                        <p className="mb-1">Joined Date</p>
                        <p className="text-navy normal-case font-bold text-xs">{emp.joiningDate}</p>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button 
                          onClick={() => {
                            const resume = (emp as any).resume;
                            if (resume) {
                              const link = document.createElement('a');
                              link.href = resume.base64;
                              link.download = resume.name;
                              link.click();
                            } else {
                              alert('No resume found for this employee.');
                            }
                          }}
                          className="flex-1 min-w-[100px] py-2 bg-off-white text-slate-600 rounded-lg flex items-center justify-center gap-2 text-xs font-bold"
                        >
                          <Download size={14} />
                          <span>Resume</span>
                        </button>
                        <button 
                          onClick={() => handlePromote(emp)}
                          className="flex-1 min-w-[100px] py-2 bg-off-white text-slate-600 rounded-lg flex items-center justify-center gap-2 text-xs font-bold"
                        >
                          <ArrowUpRight size={14} />
                          <span>Promote</span>
                        </button>
                        <button 
                          onClick={() => handleEditSalary(emp)}
                          className="flex-1 min-w-[100px] py-2 bg-off-white text-slate-600 rounded-lg flex items-center justify-center gap-2 text-xs font-bold"
                        >
                          <DollarSign size={14} />
                          <span>Salary</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-slate-500 text-sm">No employees found.</div>
              )}
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
            {pendingLeaves.length > 0 ? (
              pendingLeaves.map((leave) => (
                <div key={leave.id} className="card p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-navy/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-navy/5 flex items-center justify-center text-navy font-bold">
                      {leave.employeeName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-navy">{leave.employeeName || 'Unknown Employee'}</h4>
                        <span className="badge badge-info">{leave.type} Leave</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        <Clock size={12} className="inline mr-1" />
                        {leave.startDate} to {leave.endDate} • {leave.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleLeaveAction(leave.id, 'Rejected')}
                      className="btn-secondary flex-1 sm:flex-none text-xs text-muted-red hover:bg-muted-red/5 border-muted-red/20 flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} />
                      <span>Decline</span>
                    </button>
                    <button 
                      onClick={() => handleLeaveAction(leave.id, 'Approved')}
                      className="btn-primary flex-1 sm:flex-none text-xs flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-slate-500">No pending leave requests.</div>
            )}
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Role</label>
                  <select 
                    className="input-field"
                    value={newSystemRole}
                    onChange={(e) => setNewSystemRole(e.target.value as UserRole)}
                  >
                    <option value="CANDIDATE">Candidate</option>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="DEPT_HEAD">Department Head</option>
                    <option value="HR_ADMIN">HR Admin</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job Title / Designation</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="e.g. Lead Developer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</label>
                  <select 
                    className="input-field"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept, i) => (
                      <option key={i} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Effective Date</label>
                  <input type="date" className="input-field" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowPromoteModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={confirmPromotion} className="btn-primary flex-1">Confirm Promotion</button>
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
              <div className="flex justify-between items-center gap-4">
                <h3 className="text-xl font-bold text-navy truncate">Adjust Salary</h3>
                <button onClick={() => setShowSalaryModal(false)} className="text-slate-400 hover:text-navy flex-shrink-0">
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
                      className="input-field !pl-10" 
                      value={newSalary}
                      onChange={(e) => setNewSalary(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</label>
                  <select 
                    className="input-field"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept, i) => (
                      <option key={i} value={dept}>{dept}</option>
                    ))}
                  </select>
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
                <button onClick={confirmSalaryUpdate} className="btn-primary flex-1">Update Salary</button>
              </div>
            </motion.div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-navy">Add New Employee</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-navy">
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="john@company.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Role</label>
                  <select 
                    className="input-field"
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value as UserRole })}
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="DEPT_HEAD">Department Head</option>
                    <option value="HR_ADMIN">HR Admin</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job Title</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={addForm.jobTitle}
                    onChange={(e) => setAddForm({ ...addForm, jobTitle: e.target.value })}
                    placeholder="Software Engineer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</label>
                  <select 
                    className="input-field"
                    value={addForm.department}
                    onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept, i) => (
                      <option key={i} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Salary ($)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={addForm.salary}
                    onChange={(e) => setAddForm({ ...addForm, salary: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joining Date</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={addForm.joiningDate}
                    onChange={(e) => setAddForm({ ...addForm, joiningDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button 
                  onClick={handleAddEmployee} 
                  className="btn-primary flex-1"
                  disabled={!addForm.name || !addForm.email || !addForm.department}
                >
                  Create Employee Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeesView;
