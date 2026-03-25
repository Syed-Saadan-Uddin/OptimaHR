import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Plus,
  Filter,
  MoreHorizontal,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LeaveRequest } from '../types/hr';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from './FirebaseProvider';
import { handleFirestoreError, OperationType } from '../firestoreUtils';

const LeaveManagement: React.FC = () => {
  const { user, userProfile, role } = useFirebase();
  const [showModal, setShowModal] = useState(false);
  const [leaveType, setLeaveType] = useState('Sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [days, setDays] = useState(1);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const balance = userProfile?.leaveBalance || { sick: 12, casual: 15, unpaid: 0 };

  useEffect(() => {
    if (!user || !role) return;

    let q;
    if (role === 'HR_ADMIN' || role === 'DEPT_HEAD') {
      // Admins see all leaves
      q = query(
        collection(db, 'leaves'),
        orderBy('appliedAt', 'desc')
      );
    } else {
      // Employees see only their own
      q = query(
        collection(db, 'leaves'),
        where('employeeId', '==', user.uid),
        orderBy('appliedAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leavesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setLeaves(leavesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leaves');
    });

    return () => unsubscribe();
  }, [user]);

  const isError = days > (balance[leaveType.toLowerCase() as keyof typeof balance] || 0) && leaveType !== 'Unpaid';

  const handleStatusUpdate = async (id: string, status: 'Approved' | 'Rejected') => {
    if (role !== 'HR_ADMIN' && role !== 'DEPT_HEAD') return;
    
    try {
      const { doc, updateDoc, getDoc, increment } = await import('firebase/firestore');
      const leaveRef = doc(db, 'leaves', id);
      const leaveSnap = await getDoc(leaveRef);
      
      if (!leaveSnap.exists()) return;
      const leaveData = leaveSnap.data();

      // If approved, deduct from balance
      if (status === 'Approved' && leaveData.status !== 'Approved') {
        const userRef = doc(db, 'users', leaveData.employeeId);
        const typeKey = leaveData.type.toLowerCase();
        
        if (typeKey !== 'unpaid') {
          await updateDoc(userRef, {
            [`leaveBalance.${typeKey}`]: increment(-leaveData.days)
          });
        }
      }

      await updateDoc(leaveRef, { status });

      // Create notification for the employee
      await addDoc(collection(db, 'notifications'), {
        userId: leaveData.employeeId,
        title: `Leave ${status}`,
        message: `Your ${leaveData.type} leave request from ${leaveData.startDate} to ${leaveData.endDate} has been ${status.toLowerCase()}.`,
        type: 'LEAVE',
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'leaves');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isError || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'leaves'), {
        employeeId: user.uid,
        employeeName: userProfile?.name || user.displayName,
        type: leaveType,
        startDate,
        endDate,
        days,
        reason,
        status: 'Pending',
        appliedAt: serverTimestamp()
      });
      setShowModal(false);
      // Reset form
      setLeaveType('Sick');
      setStartDate('');
      setEndDate('');
      setDays(1);
      setReason('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'leaves');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLeaves = leaves.filter(leave => 
    leave.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    leave.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    leave.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    leave.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Leave Management</h1>
          <p className="text-slate-500 text-sm mt-1">Track your leave balances and history.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
          <Plus size={18} />
          <span>Apply Leave</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'SICK LEAVE', value: balance.sick, total: 12 },
          { label: 'CASUAL LEAVE', value: balance.casual, total: 15 },
          { label: 'UNPAID LEAVE', value: '∞', total: '∞' },
        ].map((stat) => (
          <div key={stat.label} className="card p-6 sm:p-8 flex flex-col items-start justify-center min-h-[120px] sm:min-h-[140px]">
            <p className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <div className="flex items-baseline gap-1 text-slate-500 flex-wrap">
              <span className="text-2xl sm:text-4xl font-bold text-navy leading-none">{stat.value}</span>
              <span className="text-xs sm:text-lg font-medium">/ {stat.total} available</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-off-white/50">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search history..." 
              className="input-field py-1.5 !pl-9 text-xs" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all">
            <Filter size={18} />
          </button>
        </div>
        <div className="overflow-x-auto">
          {/* Desktop Table */}
          <table className="hidden md:table w-full text-left border-collapse">
            <thead>
              <tr className="bg-off-white text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-navy rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredLeaves.length > 0 ? (
                filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-off-white transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-navy">{leave.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600 font-medium">{leave.employeeName || 'Unknown'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Calendar size={14} />
                        {leave.startDate} to {leave.endDate} ({leave.days} days)
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${
                        leave.status === 'Approved' ? 'badge-success' :
                        leave.status === 'Pending' ? 'badge-warning' : 'badge-error'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(role === 'HR_ADMIN' || role === 'DEPT_HEAD') && leave.status === 'Pending' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleStatusUpdate(leave.id, 'Approved')}
                            className="p-1.5 text-emerald hover:bg-emerald/10 rounded-lg transition-all"
                            title="Approve"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(leave.id, 'Rejected')}
                            className="p-1.5 text-muted-red hover:bg-muted-red/10 rounded-lg transition-all"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      ) : (
                        <button className="p-1.5 text-slate-400 hover:text-navy hover:bg-white rounded-lg">
                          <MoreHorizontal size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500">No leave history found.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile List */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="p-10 text-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-navy rounded-full animate-spin mx-auto" />
              </div>
            ) : filteredLeaves.length > 0 ? (
              filteredLeaves.map((leave) => (
                <div key={leave.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-navy">{leave.type}</p>
                      <p className="text-[10px] text-slate-500">{leave.employeeName || 'Unknown'}</p>
                    </div>
                    <span className={`badge ${
                      leave.status === 'Approved' ? 'badge-success' :
                      leave.status === 'Pending' ? 'badge-warning' : 'badge-error'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <Calendar size={12} />
                    {leave.startDate} to {leave.endDate} ({leave.days} days)
                  </div>
                  {(role === 'HR_ADMIN' || role === 'DEPT_HEAD') && leave.status === 'Pending' && (
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => handleStatusUpdate(leave.id, 'Approved')}
                        className="flex-1 py-2 bg-emerald/10 text-emerald text-[10px] font-bold rounded-lg"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(leave.id, 'Rejected')}
                        className="flex-1 py-2 bg-muted-red/10 text-muted-red text-[10px] font-bold rounded-lg"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-500 text-xs">No leave history found.</div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-md p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-navy">Apply for Leave</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-navy">
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leave Type</label>
                    <select 
                      className="input-field"
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                      required
                    >
                      <option value="Sick">Sick</option>
                      <option value="Casual">Casual</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
                      <input 
                        type="date" 
                        className="input-field" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</label>
                      <input 
                        type="date" 
                        className="input-field" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Number of Days</label>
                    <input 
                      type="number" 
                      className={`input-field ${isError ? 'border-muted-red ring-2 ring-muted-red/10' : ''}`}
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                      min="1"
                      required
                    />
                    {isError && (
                      <p className="text-[10px] font-bold text-muted-red flex items-center gap-1 mt-1">
                        <AlertCircle size={12} />
                        Insufficient balance for {leaveType} leave.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason</label>
                    <textarea 
                      className="input-field h-24 resize-none" 
                      placeholder="Briefly explain your reason..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={isError || isSubmitting} className="btn-primary flex-1">
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeaveManagement;
