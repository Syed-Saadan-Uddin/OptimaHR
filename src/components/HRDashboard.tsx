import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Plus, 
  Bell,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, limit, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firestoreUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useFirebase } from './FirebaseProvider';
import LatestPayslipCard from './LatestPayslipCard';

const HRDashboard: React.FC<{ onNavigate?: (tab: string, data?: any) => void }> = ({ onNavigate }) => {
  const { user } = useFirebase();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    openPositions: 0,
    pendingLeaves: 0,
    recentApplications: 0
  });
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [chartData, setChartData] = useState<any[]>([]);
  const [workforceDistribution, setWorkforceDistribution] = useState<any[]>([]);

  useEffect(() => {
    // 1. Total Employees
    const unsubEmployees = onSnapshot(query(collection(db, 'users'), where('role', '!=', 'CANDIDATE')), (snapshot) => {
      setStats(prev => ({ ...prev, totalEmployees: snapshot.size }));
      
      // Process Hiring Trends (Hires)
      const hiresByMonth: { [key: string]: number } = {};
      const deptCounts: { [key: string]: number } = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Hires aggregation
        if (data.joiningDate) {
          const date = new Date(data.joiningDate);
          const monthYear = date.toLocaleString('en-US', { month: 'short' });
          hiresByMonth[monthYear] = (hiresByMonth[monthYear] || 0) + 1;
        }

        // Department aggregation
        if (data.department) {
          deptCounts[data.department] = (deptCounts[data.department] || 0) + 1;
        }
      });

      updateChartData(hiresByMonth, null);

      // Update Workforce Distribution
      const colors = ['bg-navy', 'bg-emerald', 'bg-slate-blue', 'bg-soft-amber', 'bg-brand-500'];
      const distribution = Object.entries(deptCounts).map(([label, count], i) => ({
        label,
        count,
        color: colors[i % colors.length]
      }));
      setWorkforceDistribution(distribution);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // 2. Open Positions
    const unsubJobs = onSnapshot(query(collection(db, 'jobs'), where('status', '==', 'Open')), (snapshot) => {
      setStats(prev => ({ ...prev, openPositions: snapshot.size }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'jobs');
    });

    // 3. Pending Leaves
    const unsubLeaves = onSnapshot(query(collection(db, 'leaves'), where('status', '==', 'Pending')), (snapshot) => {
      setStats(prev => ({ ...prev, pendingLeaves: snapshot.size }));
      setRecentLeaves(snapshot.docs.slice(0, 5).map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leaves');
    });

    // 4. Recent Applications
    const unsubApps = onSnapshot(collection(db, 'applications'), (snapshot) => {
      setStats(prev => ({ ...prev, recentApplications: snapshot.size }));

      // Process Hiring Trends (Applications)
      const appsByMonth: { [key: string]: number } = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.appliedDate) {
          const date = new Date(data.appliedDate);
          const monthYear = date.toLocaleString('en-US', { month: 'short' });
          appsByMonth[monthYear] = (appsByMonth[monthYear] || 0) + 1;
        }
      });
      updateChartData(null, appsByMonth);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });

    // Helper to merge hires and apps into chart data
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d.toLocaleString('en-US', { month: 'short' });
    });

    let currentHires: any = {};
    let currentApps: any = {};

    const updateChartData = (hires: any, apps: any) => {
      if (hires) currentHires = hires;
      if (apps) currentApps = apps;

      const newChartData = last6Months.map(month => ({
        name: month,
        hires: currentHires[month] || 0,
        applications: currentApps[month] || 0
      }));
      setChartData(newChartData);
    };

    return () => {
      unsubEmployees();
      unsubJobs();
      unsubLeaves();
      unsubApps();
    };
  }, []);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement.trim() || isPosting) return;

    setIsPosting(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title: announcement,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        tag: 'HR',
        createdAt: serverTimestamp()
      });

      // Create notification for all users
      await addDoc(collection(db, 'notifications'), {
        userId: 'ALL',
        title: 'New Announcement',
        message: announcement,
        type: 'ANNOUNCEMENT',
        read: false,
        createdAt: serverTimestamp()
      });

      setAnnouncement('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'announcements');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">HR Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time metrics and workforce analytics.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => onNavigate?.('recruitment')}
            className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-4"
          >
            <Briefcase size={18} />
            <span>Recruitment</span>
          </button>
          <button 
            onClick={() => onNavigate?.('employees')}
            className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-4"
          >
            <Plus size={18} />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Employees', value: stats.totalEmployees, icon: Users, color: 'bg-navy/10 text-navy', trend: '+2' },
          { label: 'Open Positions', value: stats.openPositions, icon: Briefcase, color: 'bg-emerald/10 text-emerald', trend: '0' },
          { label: 'Pending Leaves', value: stats.pendingLeaves, icon: Calendar, color: 'bg-muted-red/10 text-muted-red', trend: '+5' },
          { label: 'New Applications', value: stats.recentApplications, icon: TrendingUp, color: 'bg-slate-blue/10 text-slate-blue', trend: '+12' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald">
                <ArrowUpRight size={12} />
                {stat.trend}%
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-bold text-navy mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-navy">Hiring Trends</h3>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2 text-navy">
                <div className="w-2 h-2 rounded-full bg-navy" />
                Applications
              </div>
              <div className="flex items-center gap-2 text-emerald">
                <div className="w-2 h-2 rounded-full bg-emerald" />
                Hires
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="applications" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="hires" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 flex flex-col">
          <h3 className="font-bold text-navy mb-6">Post Announcement</h3>
          <form onSubmit={handlePostAnnouncement} className="flex-1 flex flex-col gap-4">
            <textarea 
              className="input-field flex-1 resize-none p-4 text-sm"
              placeholder="Type company-wide announcement here..."
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              required
            />
            <button 
              type="submit" 
              disabled={isPosting}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              <Bell size={18} />
              <span>{isPosting ? 'Posting...' : 'Broadcast to All'}</span>
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-navy">Pending Approvals</h3>
            <span className="badge badge-warning">{stats.pendingLeaves} Pending</span>
          </div>
          <div className="divide-y divide-slate-100">
            {recentLeaves.length > 0 ? recentLeaves.map((leave, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-off-white transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-navy font-bold text-xs">
                    {leave.employeeName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy">{leave.employeeName}</p>
                    <p className="text-[10px] text-slate-400">{leave.type} Leave • {leave.days} days</p>
                  </div>
                </div>
                <button 
                  onClick={() => onNavigate?.('leave')}
                  className="text-xs font-bold text-slate-blue hover:underline"
                >
                  Review
                </button>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-400">
                <Clock size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs">No pending leave requests</p>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-navy mb-6">Workforce Distribution</h3>
          <div className="space-y-6">
            {workforceDistribution.length > 0 ? workforceDistribution.map((dept, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-bold text-navy">{dept.label}</span>
                  <span className="text-slate-500">{dept.count} Employees</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(dept.count / stats.totalEmployees) * 100}%` }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className={`h-full rounded-full ${dept.color}`}
                  />
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-slate-400">
                <p className="text-xs">No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {user && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <LatestPayslipCard userId={user.uid} onNavigate={onNavigate} />
          </div>
          <div className="md:col-span-2 card p-6 flex items-center justify-center bg-slate-50/50 border-dashed">
            <div className="text-center space-y-2">
              <p className="text-sm font-bold text-navy">Need to process payroll for others?</p>
              <button 
                onClick={() => onNavigate?.('payroll')}
                className="btn-primary text-xs px-6"
              >
                Go to Payroll Management
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;
