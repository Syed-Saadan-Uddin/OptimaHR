import React, { useState } from 'react';
import { Search, MapPin, Briefcase, Filter, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JobListing, UserRole } from '../types/hr';

const mockJobs: JobListing[] = [
  { id: '1', title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote', description: 'We are looking for a React expert to lead our core UI team.', postedDate: '2 days ago' },
  { id: '2', title: 'Product Manager', department: 'Product', location: 'New York, NY', description: 'Drive the vision and execution of our HCM platform.', postedDate: '1 week ago' },
  { id: '3', title: 'HR Operations Specialist', department: 'Human Resources', location: 'London, UK', description: 'Manage day-to-day HR operations and employee relations.', postedDate: '3 days ago' },
  { id: '4', title: 'Backend Developer (Node.js)', department: 'Engineering', location: 'Remote', description: 'Build scalable APIs and microservices for our enterprise clients.', postedDate: '5 days ago' },
];

interface JobPortalProps {
  role: UserRole;
  onApply: (job: JobListing) => void;
}

const JobPortal: React.FC<JobPortalProps> = ({ role, onApply }) => {
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

  const handlePostJob = () => {
    // In a real app, this would update state/backend
    setShowPostModal(false);
    setNewJob({ title: '', department: 'Engineering', location: 'Remote', description: '' });
  };

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
          <select className="input-field w-40">
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
        {mockJobs.map((job) => (
          <div key={job.id} className="card p-6 hover:border-emerald/30 transition-all group">
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
                    onClick={() => onApply(job)}
                    className="btn-primary flex items-center gap-2 whitespace-nowrap"
                  >
                    <span>Apply Now</span>
                    <ChevronRight size={18} />
                  </button>
                )}
                {canManageJobs && (
                  <div className="flex gap-2">
                    <button className="btn-secondary text-xs">Edit</button>
                    <button className="btn-secondary text-xs text-muted-red hover:bg-muted-red/5 border-muted-red/20">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
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
