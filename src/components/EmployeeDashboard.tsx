import React from 'react';
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

const EmployeeDashboard: React.FC = () => {
  const stats = [
    { label: 'Sick Leave', value: '04', total: '12', color: 'text-muted-red' },
    { label: 'Casual Leave', value: '08', total: '15', color: 'text-emerald' },
    { label: 'Unpaid Leave', value: '00', total: '∞', color: 'text-slate-blue' },
  ];

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Welcome back, John</h1>
          <p className="text-slate-500 text-sm mt-1">Here's your overview for February 2026.</p>
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
            <h3 className="font-bold text-navy">Company Announcements</h3>
            <button className="text-xs font-bold text-slate-blue hover:underline">View All</button>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { title: 'New Remote Work Policy Update', date: 'Feb 24, 2026', tag: 'Policy', icon: FileText },
              { title: 'Annual Town Hall Meeting', date: 'Feb 20, 2026', tag: 'Event', icon: Users },
              { title: 'Q1 Performance Review Cycle Starts', date: 'Feb 15, 2026', tag: 'HR', icon: AlertCircle },
            ].map((item, i) => (
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
            ))}
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
  );
};

export default EmployeeDashboard;
