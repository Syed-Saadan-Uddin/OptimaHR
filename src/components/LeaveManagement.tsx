import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LeaveRequest, UserRole } from '../types/hr';

interface LeaveManagementProps {
  role: UserRole;
}

const mockLeaves: LeaveRequest[] = [
  { id: '1', employeeId: 'EMP001', type: 'Sick', startDate: '2026-02-10', endDate: '2026-02-11', status: 'Approved', reason: 'Flu' },
  { id: '2', employeeId: 'EMP001', type: 'Casual', startDate: '2026-02-25', endDate: '2026-02-26', status: 'Pending', reason: 'Family event' },
  { id: '3', employeeId: 'EMP001', type: 'Unpaid', startDate: '2026-01-15', endDate: '2026-01-15', status: 'Rejected', reason: 'Critical project delivery' },
];

const LeaveManagement: React.FC<LeaveManagementProps> = ({ role }) => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-leaves' | 'approvals'>(
    (role === 'DEPT_HEAD' || role === 'HR_ADMIN') ? 'approvals' : 'my-leaves'
  );
  const [leaveType, setLeaveType] = useState('Sick');
  const [days, setDays] = useState(1);
  const balance = { Sick: 12, Casual: 15, Unpaid: 0 };

  const isReviewer = role === 'DEPT_HEAD' || role === 'HR_ADMIN';
  const isError = days > (balance[leaveType as keyof typeof balance] || 0) && leaveType !== 'Unpaid';

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Leave Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isReviewer ? 'Review and manage leave applications.' : 'Track your leave balances and history.'}
          </p>
        </div>
        {role !== 'HR_ADMIN' && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            <span>Apply Leave</span>
          </button>
        )}
      </div>

      {isReviewer && (
        <div className="flex gap-4 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`pb-3 px-2 text-sm font-bold transition-all relative ${activeTab === 'approvals' ? 'text-navy' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Pending Approvals
            <span className="ml-2 px-1.5 py-0.5 bg-muted-red text-white text-[10px] rounded-full">2</span>
            {activeTab === 'approvals' && <motion.div layoutId="leave-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy" />}
          </button>
          <button
            onClick={() => setActiveTab('my-leaves')}
            className={`pb-3 px-2 text-sm font-bold transition-all relative ${activeTab === 'my-leaves' ? 'text-navy' : 'text-slate-400 hover:text-slate-600'}`}
          >
            My Leave History
            {activeTab === 'my-leaves' && <motion.div layoutId="leave-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy" />}
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'my-leaves' ? (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { label: 'Sick Leave', value: 4, total: 12, color: 'text-muted-red' },
                { label: 'Casual Leave', value: 8, total: 15, color: 'text-emerald' },
                { label: 'Unpaid Leave', value: 0, total: '∞', color: 'text-slate-blue' },
              ].map((stat) => (
                <div key={stat.label} className="card p-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <div className="flex items-end gap-2 mt-2">
                    <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
                    <span className="text-slate-400 text-sm mb-1">/ {stat.total} available</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="card overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-off-white/50">
                <h3 className="font-bold text-navy">Leave History</h3>
                <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all">
                  <Filter size={18} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-off-white text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mockLeaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-off-white transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-navy">{leave.type}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Calendar size={14} />
                            {leave.startDate} to {leave.endDate}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge ${leave.status === 'Approved' ? 'badge-success' :
                              leave.status === 'Pending' ? 'badge-warning' : 'badge-error'
                            }`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-500 italic">"{leave.reason}"</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-1.5 text-slate-400 hover:text-navy hover:bg-white rounded-lg">
                            <MoreHorizontal size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="approvals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {[
              { id: 'L-001', name: 'Alice Wong', type: 'Sick', date: 'Mar 10-12', reason: 'Flu symptoms' },
              { id: 'L-002', name: 'Bob Vance', type: 'Casual', date: 'Mar 15-16', reason: 'Family business' },
            ].map((req) => (
              <div key={req.id} className="card p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-navy">
                    {req.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy">{req.name}</p>
                    <p className="text-xs text-slate-500">{req.type} • {req.date} • {req.reason}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-muted-red hover:bg-muted-red/5 rounded-lg border border-muted-red/20">
                    <XCircle size={18} />
                  </button>
                  <button className="btn-primary py-2 px-4 text-xs">Approve</button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

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

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leave Type</label>
                  <select
                    className="input-field"
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                  >
                    <option>Sick</option>
                    <option>Casual</option>
                    <option>Unpaid</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
                    <input type="date" className="input-field" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</label>
                    <input type="date" className="input-field" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Number of Days</label>
                  <input
                    type="number"
                    className={`input-field ${isError ? 'border-muted-red ring-2 ring-muted-red/10' : ''}`}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
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
                  <textarea className="input-field h-24 resize-none" placeholder="Briefly explain your reason..."></textarea>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button disabled={isError} className="btn-primary flex-1">Submit Application</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeaveManagement;
