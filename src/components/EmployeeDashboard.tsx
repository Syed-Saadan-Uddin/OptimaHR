import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  ChevronRight,
  Megaphone,
  Briefcase
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserData } from '../App';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';

interface EmployeeDashboardProps {
  userData: UserData;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: Timestamp;
  tag: string;
  type: 'Policy' | 'Event' | 'HR' | 'System';
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'completed';
  priority: 'High' | 'Medium' | 'Low';
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ userData }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    // 1. Listen for Announcements
    const annQuery = query(collection(db, 'announcements'), orderBy('date', 'desc'));
    const unsubAnn = onSnapshot(annQuery, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    });

    // 2. Listen for Pending Tasks
    const taskQuery = query(
      collection(db, 'tasks'),
      where('assignedTo', '==', userData.uid),
      where('status', '==', 'pending')
    );
    const unsubTasks = onSnapshot(taskQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
      setLoading(false);
    });

    return () => {
      unsubAnn();
      unsubTasks();
    };
  }, [userData.uid]);

  const handleMarkComplete = async (taskId: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { status: 'completed' });
      console.log("Task marked as complete:", taskId);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const stats = [
    { label: 'Sick Leave', value: '04', total: '12', color: 'text-muted-red' },
    { label: 'Casual Leave', value: '08', total: '15', color: 'text-emerald' },
    { label: 'Unpaid Leave', value: '00', total: '∞', color: 'text-slate-blue' },
  ];

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto text-left">
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-navy">Welcome back, {userData.displayName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge badge-info text-[10px] py-0.5 px-2">{userData.employeeId || 'ID: PENDING'}</span>
            <p className="text-slate-500 text-xs">Designation: <span className="font-bold text-navy">{userData.designation || 'New Hire'}</span></p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Calendar size={18} />
            <span>Apply Leave</span>
          </button>
          <button className="btn-primary flex items-center gap-2">
            <FileText size={18} />
            <span>Submit Goals</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Leave Balance */}
        <div className="card p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-navy">Leave Balance</h3>
            <Clock size={20} className="text-slate-400" />
          </div>
          <div className="space-y-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">{stat.label}</span>
                  <span className="font-bold text-navy">{stat.value} / {stat.total}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${stat.color.replace('text', 'bg')}`}
                    style={{ width: `${(parseInt(stat.value) / (parseInt(stat.total) || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Score */}
        <div className="card p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-navy">Performance Score</h3>
            <TrendingUp size={20} className="text-emerald" />
          </div>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 stroke-current"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald stroke-current"
                  strokeWidth="3"
                  strokeDasharray="85, 100"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-navy">4.2</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Exceeds</span>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-slate-500 mt-2">Cycle: Q1 2026 (In Progress)</p>
        </div>

        {/* Latest Payslip */}
        <div className="card p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-navy">Latest Payslip</h3>
            <CreditCard size={20} className="text-slate-blue" />
          </div>
          <div className="bg-off-white p-4 rounded-xl border border-dashed border-slate-300">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500">January 2026</span>
              <span className="badge badge-success">Paid</span>
            </div>
            <p className="text-xl font-bold text-navy">$4,850.00</p>
            <p className="text-[10px] text-slate-400 mt-1">Net Pay after deductions</p>
            <button className="w-full mt-4 py-2 text-xs font-bold text-slate-blue hover:bg-white rounded-lg border border-slate-200 transition-all">
              View Details
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Megaphone size={18} className="text-slate-blue" />
              <h3 className="font-bold text-navy">Company Announcements</h3>
            </div>
            <button className="text-xs font-bold text-slate-blue hover:underline">View All</button>
          </div>
          <div className="divide-y divide-slate-100 min-h-[300px]">
            {announcements.length > 0 ? announcements.map((ann) => (
              <div key={ann.id} className="p-5 flex items-start gap-4 hover:bg-off-white transition-all cursor-pointer group">
                <div className="w-10 h-10 bg-off-white rounded-lg flex items-center justify-center text-slate-400 group-hover:text-slate-blue transition-colors flex-shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-navy group-hover:text-slate-blue transition-colors line-clamp-1">{ann.title}</p>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-bold uppercase">{ann.type}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{ann.content}</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium italic">{ann.date.toDate().toLocaleDateString()} • Posted by HR</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Megaphone size={40} className="mb-4 opacity-20" />
                <p className="text-sm">No new announcements at this time.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Pending Tasks */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-navy">Pending Tasks</h3>
              <span className="badge badge-error text-[10px] px-2">{tasks.length}</span>
            </div>
            <div className="space-y-3">
              {tasks.length > 0 ? tasks.map((task) => (
                <div key={task.id} className="p-3 bg-off-white rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-muted-red' : 'bg-soft-amber'}`} />
                  <div className="flex-1 text-left">
                    <p className="text-xs font-bold text-navy">{task.title}</p>
                    <p className="text-[9px] text-slate-400">Due: {task.dueDate}</p>
                  </div>
                  <button
                    onClick={() => handleMarkComplete(task.id)}
                    className="p-1 hover:text-emerald text-slate-300 transition-colors"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                </div>
              )) : (
                <div className="text-center py-10">
                  <CheckCircle2 size={30} className="mx-auto text-emerald opacity-20 mb-2" />
                  <p className="text-xs text-slate-400">You're all caught up!</p>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-navy mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Apply Leave', icon: Clock, color: 'bg-emerald/10 text-emerald' },
                { label: 'Submit Goals', icon: TrendingUp, color: 'bg-slate-blue/10 text-slate-blue' },
                { label: 'View Payslip', icon: CreditCard, color: 'bg-navy/10 text-navy' },
                { label: 'Update Profile', icon: Users, color: 'bg-soft-amber/10 text-soft-amber' },
              ].map((action, i) => (
                <button key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-off-white transition-all">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${action.color}`}>
                    <action.icon size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-navy uppercase tracking-wider">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
