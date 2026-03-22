import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Briefcase,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface Application {
  id: string;
  jobTitle: string;
  department: string;
  location: string;
  status: 'Applied' | 'Shortlisted' | 'Interviewing' | 'Rejected' | 'Hired';
  appliedAt: Timestamp | null;
  lastUpdate?: Timestamp | null;
}

const MyApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || !db) return;

    const q = query(
      collection(db, 'applications'),
      where('candidateId', '==', auth.currentUser.uid),
      orderBy('appliedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Application[];
      setApplications(apps);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching applications:", error);
      // If index is missing, Firebase usually provides a link in console
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'Just now';
    return timestamp.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeAgo = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'Just now';
    const seconds = Math.floor((new Date().getTime() - timestamp.toDate().getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">My Applications</h1>
        <p className="text-slate-500 text-sm mt-1">Track the status of your job applications and upcoming interviews in real-time.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
            <Loader2 className="w-10 h-10 text-emerald animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Syncing with tracking system...</p>
          </div>
        ) : applications.length > 0 ? (
          applications.map((app, idx) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="card p-6 hover:border-slate-300 transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 text-left">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-off-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-navy transition-colors">
                    <Briefcase size={24} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-navy">{app.jobTitle}</h3>
                      <span className={`badge ${app.status === 'Hired' ? 'badge-success' :
                          app.status === 'Rejected' ? 'badge-error' :
                            app.status === 'Interviewing' ? 'badge-info' : 'badge-warning'
                        }`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin size={14} /> {app.location}</span>
                      <span className="flex items-center gap-1"><Calendar size={14} /> Applied on {formatDate(app.appliedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="hidden sm:block text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Activity</p>
                    <p className="text-xs font-medium text-navy mt-0.5">{getTimeAgo(app.lastUpdate || app.appliedAt)}</p>
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
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${step.status === 'completed' ? 'bg-emerald border-emerald text-white' : 'bg-white border-slate-200 text-slate-300'
                        }`}>
                        {step.status === 'completed' ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${step.status === 'completed' ? 'text-navy' : 'text-slate-400'
                        }`}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 text-center card bg-off-white/20 border-dashed border-2">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
              <Plus className="text-slate-200" size={32} />
            </div>
            <h3 className="text-xl font-bold text-navy">No applications found</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">Your journey starts here. Explore open positions and find your perfect role.</p>
            <button
              onClick={() => window.location.reload()} // Simplified for now
              className="btn-primary mt-6 px-8 flex items-center gap-2 mx-auto"
            >
              <span>Browse Jobs</span>
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Plus: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default MyApplications;
