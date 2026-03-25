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
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { useFirebase } from './FirebaseProvider';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Payslip, PerformanceGoal } from '../types/hr';
import { handleFirestoreError, OperationType } from '../firestoreUtils';

const EmployeeDashboard: React.FC<{ onNavigate?: (tab: string, data?: any) => void }> = ({ onNavigate }) => {
  const { user, userProfile } = useFirebase();
  const [latestPayslip, setLatestPayslip] = useState<Payslip | null>(null);
  const [performanceScore, setPerformanceScore] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch latest payslip
    const payslipQuery = query(
      collection(db, 'payslips'),
      where('employeeId', '==', user.uid),
      orderBy('processedAt', 'desc'),
      limit(1)
    );

    const unsubscribePayslip = onSnapshot(payslipQuery, (snapshot) => {
      if (!snapshot.empty) {
        setLatestPayslip({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Payslip);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'payslips');
    });

    // Fetch performance goals for score calculation
    const goalsQuery = query(
      collection(db, 'goals'),
      where('employeeId', '==', user.uid)
    );

    const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => {
      const goals = snapshot.docs.map(doc => doc.data() as PerformanceGoal);
      if (goals.length > 0) {
        const totalWeight = goals.reduce((acc, g) => acc + g.weight, 0);
        const weightedScore = goals.reduce((acc, g) => acc + ((g.score || 0) * g.weight), 0);
        setPerformanceScore(totalWeight > 0 ? Number((weightedScore / totalWeight).toFixed(1)) : 0);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'goals');
    });

    // Fetch announcements
    const announcementsQuery = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
      const announcementsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        icon: doc.data().tag === 'Policy' ? FileText : doc.data().tag === 'Event' ? Users : AlertCircle
      }));
      setAnnouncements(announcementsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'announcements');
    });

    return () => {
      unsubscribePayslip();
      unsubscribeGoals();
      unsubscribeAnnouncements();
    };
  }, [user]);

  const stats = [
    { label: 'Sick Leave', value: userProfile?.leaveBalance?.sick || 0, total: 12, color: 'text-muted-red' },
    { label: 'Casual Leave', value: userProfile?.leaveBalance?.casual || 0, total: 15, color: 'text-emerald' },
    { label: 'Unpaid Leave', value: userProfile?.leaveBalance?.unpaid || 0, total: '∞', color: 'text-slate-blue' },
  ];

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Welcome back, {userProfile?.name || 'User'}</h1>
          <p className="text-slate-500 text-sm mt-1">Here's your overview for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => onNavigate?.('leave')}
            className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2"
          >
            <Calendar size={18} />
            <span>Apply Leave</span>
          </button>
          <button 
            onClick={() => onNavigate?.('performance')}
            className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2"
          >
            <FileText size={18} />
            <span>Submit Goals</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-navy">Leave Balance</h3>
            <Clock size={20} className="text-slate-400" />
          </div>
          <div className="space-y-4">
            {stats.map((stat) => {
              const isUnpaid = stat.label === 'Unpaid Leave';
              const displayValue = isUnpaid ? stat.value : stat.value;
              const displayTotal = isUnpaid ? '∞' : stat.total;
              const barWidth = isUnpaid ? '100%' : `${(stat.value / (stat.total as number)) * 100}%`;
              const barColor = isUnpaid ? 'bg-slate-blue' : stat.color.replace('text', 'bg');

              return (
                <div key={stat.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">{stat.label}</span>
                    <span className="font-bold text-navy">{isUnpaid ? `${stat.value} Taken` : `${stat.value} / ${stat.total}`}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${barColor}`} 
                      style={{ width: barWidth }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
                  strokeDasharray={`${(performanceScore / 5) * 100}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-navy">{performanceScore}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                  {performanceScore >= 4 ? 'Exceeds' : performanceScore >= 3 ? 'Meets' : 'Below'}
                </span>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-slate-500 mt-2">Cycle: Q1 2026 (In Progress)</p>
        </div>

        <div className="card p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-navy">Latest Payslip</h3>
            <CreditCard size={20} className="text-slate-blue" />
          </div>
          {latestPayslip ? (
            <div className="bg-off-white p-4 rounded-xl border border-dashed border-slate-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500">{latestPayslip.month}</span>
                <span className="badge badge-success">Paid</span>
              </div>
              <p className="text-xl font-bold text-navy">${latestPayslip.netSalary.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 mt-1">Net Pay after deductions</p>
              <button 
                onClick={() => onNavigate?.('payslip', latestPayslip)}
                className="w-full mt-4 py-2 text-xs font-bold text-slate-blue hover:bg-white rounded-lg border border-slate-200 transition-all"
              >
                View Details
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <CreditCard size={24} className="mb-2 opacity-20" />
              <p className="text-xs">No payslips found</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-navy">Company Announcements</h3>
            <button className="text-xs font-bold text-slate-blue hover:underline">View All</button>
          </div>
          <div className="divide-y divide-slate-100">
            {announcements.length > 0 ? announcements.map((item, i) => (
              <div key={i} className="p-4 flex items-center gap-4 hover:bg-off-white transition-all cursor-pointer group">
                <div className="w-10 h-10 bg-off-white rounded-lg flex items-center justify-center text-slate-400 group-hover:text-slate-blue transition-colors">
                  <item.icon size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-navy group-hover:text-slate-blue transition-colors">{item.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.date} • {item.tag}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            )) : (
              <div className="p-12 text-center text-slate-400">
                <AlertCircle size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs">No announcements yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-navy mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Apply Leave', icon: Clock, color: 'bg-emerald/10 text-emerald', tab: 'leave' },
              { label: 'Submit Goals', icon: TrendingUp, color: 'bg-slate-blue/10 text-slate-blue', tab: 'performance' },
              { label: 'View Payslip', icon: CreditCard, color: 'bg-navy/10 text-navy', tab: 'payslip' },
              { label: 'Update Profile', icon: Users, color: 'bg-soft-amber/10 text-soft-amber', tab: 'settings' },
            ].map((action, i) => (
              <button 
                key={i} 
                onClick={() => onNavigate?.(action.tab)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-off-white transition-all"
              >
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
  );
};

export default EmployeeDashboard;
