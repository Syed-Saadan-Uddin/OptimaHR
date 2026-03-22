import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, Filter, ChevronRight, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JobListing, UserRole } from '../types/hr';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase';

interface JobPortalProps {
  role: UserRole;
  onSelectJob: (job: JobListing) => void;
}

const JobPortal: React.FC<JobPortalProps> = ({ role, onSelectJob }) => {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    department: 'Engineering',
    location: 'Remote',
    description: ''
  });

  const canManageJobs = role === 'HR_ADMIN' || role === 'DEPT_HEAD';
  const isCandidate = role === 'CANDIDATE';

  const formatRelativeDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate();
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          department: data.department,
          location: data.location,
          description: data.description,
          postedDate: formatRelativeDate(data.createdAt as Timestamp),
          status: data.status || 'open'
        } as JobListing & { status: string };
      });

      setJobs(jobList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching jobs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePostJob = async () => {
    if (!newJob.title || !newJob.description) return;

    try {
      await addDoc(collection(db, 'jobs'), {
        ...newJob,
        status: 'open',
        createdAt: serverTimestamp(),
        postedBy: auth.currentUser?.uid || 'anonymous'
      });
      setShowPostModal(false);
      setNewJob({ title: '', department: 'Engineering', location: 'Remote', description: '' });
    } catch (error) {
      console.error("Error posting job:", error);
      alert("Failed to post job. Please try again.");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to delete this job listing?")) return;

    try {
      await deleteDoc(doc(db, 'jobs', jobId));
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Failed to delete job.");
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.description.toLowerCase().includes(search.toLowerCase());
    const isOpen = (job as any).status === 'open';

    if (isCandidate) return matchesSearch && isOpen;
    return matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div className="text-left space-y-2">
          <h1 className="text-4xl font-bold text-navy">
            {canManageJobs ? 'Job Management' : 'Join the OptimaHR Team'}
          </h1>
          <p className="text-slate-500 max-w-2xl">
            {canManageJobs
              ? 'Create, edit, and manage active job listings across departments.'
              : 'Help us build the future of human capital management. Explore our open positions.'}
          </p>
        </div>
        {canManageJobs && (
          <button onClick={() => setShowPostModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            <span>Post New Job</span>
          </button>
        )}
      </div>

      <div className="card p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by job title or keyword..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select title="Department Filter" className="input-field w-40">
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Product</option>
            <option>Human Resources</option>
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
            <Loader2 className="w-10 h-10 text-emerald animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading active listings...</p>
          </div>
        ) : filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={job.id}
              className="card p-6 hover:border-emerald/30 transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-navy group-hover:text-emerald transition-colors">{job.title}</h3>
                    <span className="badge badge-info">{job.department}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase size={14} />
                      <span>Full-time</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Search size={14} />
                      <span>Posted {job.postedDate}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-4 line-clamp-2">{job.description}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {isCandidate && (
                    <button
                      onClick={() => onSelectJob(job)}
                      className="btn-primary flex items-center gap-2 whitespace-nowrap"
                    >
                      <span>Apply Now</span>
                      <ChevronRight size={18} />
                    </button>
                  )}
                  {canManageJobs && (
                    <div className="flex gap-2">
                      <button className="btn-secondary text-xs">Edit</button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-2 text-slate-400 hover:text-muted-red hover:bg-muted-red/5 rounded-lg border border-slate-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-navy">No listings found</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
              {search ? "Try adjusting your search filters." : "Start by posting your first job opening to the board."}
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-lg p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-navy">Post New Job Opening</h3>
                <button onClick={() => setShowPostModal(false)} className="text-slate-400 hover:text-navy">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job Title</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Senior Backend Engineer"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</label>
                    <select title="Select Department"
                      className="input-field"
                      value={newJob.department}
                      onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                    >
                      <option>Engineering</option>
                      <option>Product</option>
                      <option>Design</option>
                      <option>Human Resources</option>
                      <option>Marketing</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Remote or City"
                      value={newJob.location}
                      onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job Description</label>
                  <textarea
                    className="input-field h-32 resize-none"
                    placeholder="Describe the role and requirements..."
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowPostModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handlePostJob} className="btn-primary flex-1">Publish Job</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const XCircle: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = "" }) => (
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
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

export default JobPortal;
