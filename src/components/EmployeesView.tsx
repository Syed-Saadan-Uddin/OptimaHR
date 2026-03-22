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
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee, LeaveRequest, UserRole } from '../types/hr';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

interface EmployeesViewProps {
  role: UserRole;
}

const EmployeesView: React.FC<EmployeesViewProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending-leaves'>('all');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [newSalary, setNewSalary] = useState(5000);
  const [newRole, setNewRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = role === 'HR_ADMIN';

  useEffect(() => {
    if (!db) return;

    // Fetch all users who are not Candidates (i.e. Employees, Dept Heads, HR Admins)
    const q = query(collection(db, 'users'), where('role', '!=', 'CANDIDATE'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const empData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.displayName || 'Unnamed User',
          role: data.designation || 'Staff',
          department: data.department || 'General',
          email: data.email || '',
          joiningDate: data.joiningDate ? data.joiningDate.toDate().toLocaleDateString() : '---',
          status: data.status || 'Active',
          salary: data.salary || 0
        } as Employee;
      });
      setEmployees(empData);
    });

    return () => unsubscribe();
  }, []);

  const handlePromoteClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    setNewRole(emp.role);
    setShowPromoteModal(true);
  };

  const handleEditSalaryClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    setNewSalary(emp.salary || 5000);
    setShowSalaryModal(true);
  };

  const finalizePromotion = async () => {
    if (!selectedEmployee) return;
    setIsUpdating(true);
    try {
      const userRef = doc(db, 'users', selectedEmployee.id);
      await updateDoc(userRef, {
        designation: newRole,
        lastPromotionDate: serverTimestamp()
      });
      console.log("Promotion successful");
      setShowPromoteModal(false);
    } catch (error) {
      console.error("Promotion failed:", error);
      alert("Failed to update designation.");
    } finally {
      setIsUpdating(false);
    }
  };

  const finalizeSalaryUpdate = async () => {
    if (!selectedEmployee) return;
    setIsUpdating(true);
    try {
      const userRef = doc(db, 'users', selectedEmployee.id);
      await updateDoc(userRef, {
        salary: newSalary,
        lastSalaryUpdate: serverTimestamp()
      });
      console.log("Salary update successful");
      setShowSalaryModal(false);
    } catch (error) {
      console.error("Salary update failed:", error);
      alert("Failed to update salary.");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Workforce Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time management of employee records and administrative actions.</p>
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
          Active Personnel
          {activeTab === 'all' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy" />}
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('pending-leaves')}
            className={`pb-3 px-2 text-sm font-bold transition-all relative ${activeTab === 'pending-leaves' ? 'text-navy' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Leave Approvals
            <span className="ml-2 px-1.5 py-0.5 bg-muted-red text-white text-[10px] rounded-full text-center">---</span>
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
                <input
                  type="text"
                  placeholder="Search by name, role or dept..."
                  className="input-field py-1.5 pl-9 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                    <th className="px-6 py-4">Designation & Dept</th>
                    <th className="px-6 py-4">Monthly Gross</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Joined Date</th>
                    {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-off-white transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-navy/5 flex items-center justify-center text-navy font-bold text-xs capitalize">
                            {emp.name.charAt(0)}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-navy">{emp.name}</p>
                            <p className="text-[10px] text-slate-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div>
                          <p className="text-xs font-bold text-navy">{emp.role}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-tight">{emp.department}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <p className="text-xs font-bold text-navy">${emp.salary?.toLocaleString() || '0'}</p>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <span className="badge badge-success">{emp.status}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 text-left">{emp.joiningDate}</td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handlePromoteClick(emp)}
                              className="p-1.5 text-slate-400 hover:text-emerald hover:bg-white rounded-lg border border-transparent hover:border-slate-200" title="Promote"
                            >
                              <ArrowUpRight size={16} />
                            </button>
                            <button
                              onClick={() => handleEditSalaryClick(emp)}
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
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-slate-400 text-sm">
                        No employees found matching your search.
                      </td>
                    </tr>
                  )}
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
            <div className="card p-20 text-center text-slate-400">
              <Clock size={40} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">Leave management system syncing with Firestore...</p>
            </div>
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
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-navy font-bold uppercase">
                    {selectedEmployee.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-navy">{selectedEmployee.name}</p>
                    <p className="text-xs text-slate-500">Current: {selectedEmployee.role}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Designation</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="e.g. Lead Developer"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowPromoteModal(false)} className="btn-secondary flex-1" disabled={isUpdating}>Cancel</button>
                <button
                  onClick={finalizePromotion}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={isUpdating}
                >
                  {isUpdating && <Loader2 size={16} className="animate-spin" />}
                  <span>Confirm Change</span>
                </button>
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
                <h3 className="text-xl font-bold text-navy">Adjust Compensation</h3>
                <button onClick={() => setShowSalaryModal(false)} className="text-slate-400 hover:text-navy">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-off-white rounded-xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-navy font-bold uppercase">
                    {selectedEmployee.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-navy">{selectedEmployee.name}</p>
                    <p className="text-xs text-slate-500">{selectedEmployee.role}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-left">
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
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowSalaryModal(false)} className="btn-secondary flex-1" disabled={isUpdating}>Cancel</button>
                <button
                  onClick={finalizeSalaryUpdate}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={isUpdating}
                >
                  {isUpdating && <Loader2 size={16} className="animate-spin" />}
                  <span>Update Payroll</span>
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
