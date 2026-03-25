import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, Filter, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JobListing, UserRole } from '../types/hr';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firestoreUtils';

interface JobPortalProps {
  role: UserRole;
  onApply: (job: JobListing) => void;
}

const JobPortal: React.FC<JobPortalProps> = ({ role, onApply }) => {
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

  useEffect(() => {
    const q = query(collection(db, 'jobs'), orderBy('postedDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as JobListing[];
      setJobs(jobsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'jobs');
    });

    return () => unsubscribe();
  }, []);

  const canManageJobs = role === 'HR_ADMIN' || role === 'DEPT_HEAD';
  const isCandidate = role === 'CANDIDATE';

  const handlePostJob = async () => {
    try {
      await addDoc(collection(db, 'jobs'), {
        ...newJob,
        status: 'Open',
        postedDate: new Date().toISOString()
      });
      setShowPostModal(false);
      setNewJob({ title: '', department: 'Engineering', location: 'Remote', description: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'jobs');
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'jobs', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `jobs/${id}`);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div className="text-left space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-navy">
            {canManageJobs ? 'Job Management' : 'Join the OptimaHR Team'}
          </h1>
          <p className="text-slate-500 max-w-2xl text-sm sm:text-base">
            {canManageJobs 
              ? 'Create, edit, and manage active job listings across departments.' 
              : 'Help us build the future of human capital management. Explore our open positions.'}
          </p>
        </div>
        {canManageJobs && (
          <button onClick={() => setShowPostModal(true)} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
            <Plus size={18} />
            <span>Post New Job</span>
          </button>
        )}
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by job title or keyword..." 
            className="input-field !pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 sm:gap-4">
          <select className="input-field flex-1 sm:w-40">
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Product</option>
            <option>Human Resources</option>
          </select>
          <button className="btn-secondary flex items-center gap-2 px-4">
            <Filter size={18} />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-navy rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <div key={job.id} className="card p-4 sm:p-6 hover:border-emerald/30 transition-all group">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h3 className="text-lg sm:text-xl font-bold text-navy group-hover:text-emerald transition-colors">{job.title}</h3>
                    <span className="badge badge-info">{job.department}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] sm:text-sm text-slate-500">
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
                      <span>{new Date(job.postedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-3 line-clamp-2">{job.description}</p>
                </div>
                <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                  {isCandidate && (
                    <button 
                      onClick={() => onApply(job)}
                      className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <span>Apply</span>
                      <ChevronRight size={18} />
                    </button>
                  )}
                  {canManageJobs && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button className="btn-secondary flex-1 sm:flex-none text-xs">Edit</button>
                      <button 
                        onClick={() => handleDeleteJob(job.id)}
                        className="btn-secondary flex-1 sm:flex-none text-xs text-muted-red hover:bg-muted-red/5 border-muted-red/20"
                      >
                        <Trash2 size={14} className="mx-auto" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center card">
            <p className="text-slate-500">No jobs found matching your criteria.</p>
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
                  <Trash2 size={24} className="rotate-45" />
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
                    onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</label>
                    <select 
                      className="input-field"
                      value={newJob.department}
                      onChange={(e) => setNewJob({...newJob, department: e.target.value})}
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
                      onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job Description</label>
                  <textarea 
                    className="input-field h-32 resize-none" 
                    placeholder="Describe the role and requirements..."
                    value={newJob.description}
                    onChange={(e) => setNewJob({...newJob, description: e.target.value})}
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

export default JobPortal;
