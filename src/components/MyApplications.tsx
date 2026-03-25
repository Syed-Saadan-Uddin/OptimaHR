import React, { useEffect, useState } from 'react';
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
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firestoreUtils';

interface Application {
  id: string;
  jobTitle: string;
  department: string;
  location: string;
  appliedDate: string;
  status: 'Applied' | 'Shortlisted' | 'Interviewing' | 'Rejected' | 'Hired';
  lastUpdate?: string;
}

const MyApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'applications'),
      where('candidateId', '==', auth.currentUser.uid),
      orderBy('appliedDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Application[];
      setApplications(apps);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">My Applications</h1>
        <p className="text-slate-500 text-sm mt-1">Track the status of your job applications and upcoming interviews.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {applications.map((app, idx) => (
          <motion.div 
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card p-6 hover:border-slate-300 transition-all group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-off-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-navy transition-colors shrink-0">
                  <Briefcase size={24} />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-navy truncate">{app.jobTitle}</h3>
                    <span className={`badge ${
                      app.status === 'Hired' ? 'badge-success' :
                      app.status === 'Rejected' ? 'badge-error' :
                      app.status === 'Interviewing' ? 'badge-info' : 'badge-warning'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin size={14} /> {app.location || 'Remote'}</span>
                    <span className="flex items-center gap-1"><Calendar size={14} /> Applied on {new Date(app.appliedDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                <div className="hidden lg:block text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Activity</p>
                  <p className="text-xs font-medium text-navy mt-0.5">{app.lastUpdate || 'Recently'}</p>
                </div>
                <div className="h-10 w-px bg-slate-100 hidden lg:block" />
                <div className="flex gap-2 w-full sm:w-auto">
                  <button className="btn-secondary text-xs flex items-center gap-2 flex-1 sm:flex-none justify-center">
                    <FileText size={16} />
                    <span>View Details</span>
                  </button>
                  {app.status === 'Interviewing' && (
                    <button className="btn-primary text-xs flex items-center gap-2 flex-1 sm:flex-none justify-center">
                      <MessageSquare size={16} />
                      <span>Join Interview</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Application Progress Timeline */}
            <div className="mt-8 pt-6 border-t border-slate-100 overflow-x-auto custom-scrollbar pb-2">
              <div className="flex justify-between items-center relative px-2 min-w-[400px]">
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

        {applications.length === 0 && (
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
