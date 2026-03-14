import React from 'react';
import { ArrowUpRight, ArrowDownRight, Users, Briefcase, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Stat } from '../types';

const stats: Stat[] = [
  { label: 'Total Projects', value: 12, change: 8, trend: 'up' },
  { label: 'Active Tasks', value: 48, change: 12, trend: 'up' },
  { label: 'Team Members', value: 8, change: 0, trend: 'neutral' },
  { label: 'Completion Rate', value: '94%', change: -2, trend: 'down' },
];

const DashboardView: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, Alex</h1>
        <p className="text-slate-500 text-sm mt-1">Here's what's happening with your projects today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 card-hover"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                {stat.label === 'Total Projects' && <Briefcase size={20} />}
                {stat.label === 'Active Tasks' && <CheckCircle2 size={20} />}
                {stat.label === 'Team Members' && <Users size={20} />}
                {stat.label === 'Completion Rate' && <Clock size={20} />}
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                stat.trend === 'up' ? 'text-emerald-600' : 
                stat.trend === 'down' ? 'text-rose-600' : 'text-slate-500'
              }`}>
                {stat.change !== 0 && (stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />)}
                {stat.change !== 0 ? `${Math.abs(stat.change)}%` : 'Stable'}
              </div>
            </div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 h-80 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">Project Velocity</h3>
            <select className="text-xs bg-slate-50 border-none rounded-lg px-2 py-1 outline-none">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="flex-1 flex items-end gap-2 px-2">
            {[40, 70, 45, 90, 65, 80, 55].map((height, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: 0.5 + i * 0.05, duration: 0.8 }}
                className="flex-1 bg-brand-500/20 hover:bg-brand-500 rounded-t-md transition-colors relative group"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {height} tasks
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-4 px-2 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {[
              { user: 'Sarah K.', action: 'completed', target: 'Design System', time: '2m ago' },
              { user: 'James W.', action: 'commented on', target: 'API Docs', time: '15m ago' },
              { user: 'Alex R.', action: 'created', target: 'Q3 Roadmap', time: '1h ago' },
              { user: 'Mila V.', action: 'joined', target: 'Marketing Team', time: '3h ago' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden">
                  <img src={`https://picsum.photos/seed/${item.user}/100/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <p className="text-xs text-slate-900">
                    <span className="font-bold">{item.user}</span> {item.action} <span className="font-medium text-brand-600">{item.target}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-2 text-xs font-bold text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
