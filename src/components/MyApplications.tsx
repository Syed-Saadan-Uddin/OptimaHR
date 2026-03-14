import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Briefcase, 
  MapPin, 
  Calendar,
  FileText,
  MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';

interface Application {
  id: string;
  jobTitle: string;
  department: string;
  location: string;
  appliedDate: string;
  status: 'Applied' | 'Shortlisted' | 'Interviewing' | 'Rejected' | 'Hired';
  lastUpdate: string;
}

const mockApplications: Application[] = [
  { 
    id: 'APP-001', 
    jobTitle: 'Senior Frontend Engineer', 
    department: 'Engineering', 
    location: 'Remote', 
    appliedDate: 'Feb 24, 2026', 
    status: 'Interviewing', 
    lastUpdate: '2 hours ago' 
  },
  { 
    id: 'APP-002', 
    jobTitle: 'Product Designer', 
    department: 'Design', 
    location: 'New York, NY', 
    appliedDate: 'Feb 20, 2026', 
    status: 'Applied', 
    lastUpdate: '1 day ago' 
  },
  { 
    id: 'APP-003', 
    jobTitle: 'QA Engineer', 
    department: 'Engineering', 
    location: 'Remote', 
    appliedDate: 'Feb 15, 2026', 
    status: 'Rejected', 
    lastUpdate: '3 days ago' 
  },
];

const MyApplications: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">My Applications</h1>
        <p className="text-slate-500 text-sm mt-1">Track the status of your job applications and upcoming interviews.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {mockApplications.map((app, idx) => (
          <motion.div 
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card p-6 hover:border-slate-300 transition-all group"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-off-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-navy transition-colors">
                  <Briefcase size={24} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-navy">{app.jobTitle}</h3>
                    <span className={`badge ${
                      app.status === 'Hired' ? 'badge-success' :
                      app.status === 'Rejected' ? 'badge-error' :
                      app.status === 'Interviewing' ? 'badge-info' : 'badge-warning'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin size={14} /> {app.location}</span>
                    <span className="flex items-center gap-1"><Calendar size={14} /> Applied on {app.appliedDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Activity</p>
                  <p className="text-xs font-medium text-navy mt-0.5">{app.lastUpdate}</p>
                </div>
                <div className="h-10 w-px bg-slate-100 hidden lg:block" />
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs flex items-center gap-2">
                    <FileText size={16} />
                    <span>View Details</span>
                  </button>
                  {app.status === 'Interviewing' && (
                    <button className="btn-primary text-xs flex items-center gap-2">
                      <MessageSquare size={16} />
                      <span>Join Interview</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Application Progress Timeline */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center relative px-2">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 -z-10 mx-8" />
                {[
                  { label: 'Applied', status: 'completed' },
                  { label: 'Shortlisted', status: app.status !== 'Applied' ? 'completed' : 'pending' },
                  { label: 'Interview', status: (app.status === 'Interviewing' || app.status === 'Hired') ? 'completed' : 'pending' },
                  { label: 'Decision', status: (app.status === 'Hired' || app.status === 'Rejected') ? 'completed' : 'pending' },
                ].map((step, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 bg-white px-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                      step.status === 'completed' ? 'bg-emerald border-emerald text-white' : 'bg-white border-slate-200 text-slate-300'
                    }`}>
                      {step.status === 'completed' ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      step.status === 'completed' ? 'text-navy' : 'text-slate-400'
                    }`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        {mockApplications.length === 0 && (
          <div className="py-20 text-center card">
            <div className="w-20 h-20 bg-off-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Briefcase size={32} />
            </div>
            <h3 className="text-xl font-bold text-navy">No applications yet</h3>
            <p className="text-slate-500 text-sm mt-2">Start your journey by exploring our open positions.</p>
            <button className="btn-primary mt-6">Browse Jobs</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
