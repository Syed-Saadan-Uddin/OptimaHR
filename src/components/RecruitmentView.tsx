import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  MoreHorizontal, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Eye,
  Star,
  Download,
  Search,
  Calendar,
  FileText,
  X,
  Send,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Candidate } from '../types/hr';
import { db } from '../firebase';
import { collection, onSnapshot, updateDoc, doc, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firestoreUtils';

const RecruitmentView: React.FC<{ role?: string }> = ({ role }) => {
  const [filter, setFilter] = useState('All');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Modals
  const [schedulingInterview, setSchedulingInterview] = useState<Candidate | null>(null);
  const [addingScore, setAddingScore] = useState<Candidate | null>(null);
  
  // Form states
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [score, setScore] = useState('');
  const [scoreRemarks, setScoreRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!role || (role !== 'HR_ADMIN' && role !== 'DEPT_HEAD')) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'applications'), orderBy('appliedDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const candidatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setCandidates(candidatesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });

    return () => unsubscribe();
  }, [role]);

  const updateStatus = async (id: string, status: Candidate['status']) => {
    try {
      await updateDoc(doc(db, 'applications', id), { status });
      setActiveDropdown(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${id}`);
    }
  };

  const handleScheduleInterview = async () => {
    if (!schedulingInterview || !interviewDate || !interviewTime) return;
    setIsSubmitting(true);
    try {
      const interviewDateTime = `${interviewDate}T${interviewTime}`;
      
      // Update application status
      await updateDoc(doc(db, 'applications', schedulingInterview.id), {
        status: 'Interviewing',
        interviewDate: interviewDateTime
      });

      // Send notification to candidate
      await addDoc(collection(db, 'notifications'), {
        userId: schedulingInterview.candidateId,
        title: 'Interview Scheduled',
        message: `Your interview for ${schedulingInterview.jobTitle} has been scheduled for ${new Date(interviewDateTime).toLocaleString()}.`,
        type: 'INTERVIEW',
        read: false,
        createdAt: serverTimestamp()
      });

      setSchedulingInterview(null);
      setInterviewDate('');
      setInterviewTime('');
      setActiveDropdown(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notifications');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddScore = async () => {
    if (!addingScore || !score) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'applications', addingScore.id), {
        interviewScore: Number(score),
        scoreRemarks: scoreRemarks,
        status: 'Interviewed'
      });
      setAddingScore(null);
      setScore('');
      setScoreRemarks('');
      setActiveDropdown(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${addingScore.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCandidates = candidates.filter(c => 
    (filter === 'All' || c.status === filter) &&
    (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const exportCSV = () => {
    if (candidates.length === 0) return;
    let csv = 'Candidate Name,Email,Job Title,Status,Interview Score,Applied Date\n';
    candidates.forEach(c => {
      csv += `${c.name},${c.email},${c.jobTitle || 'N/A'},${c.status},${c.interviewScore || 'N/A'},${c.appliedDate}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `candidates_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Recruitment Screening</h1>
          <p className="text-slate-500 text-sm mt-1">Manage candidates and hiring pipelines.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={exportCSV}
            className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-off-white/50">
          <div className="flex flex-wrap gap-2">
            {['All', 'Applied', 'Shortlisted', 'Interviewed', 'Hired', 'Rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                  filter === f ? 'bg-navy text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-64">
              <input 
                type="text" 
                placeholder="Search candidates..." 
                className="input-field py-1.5 !pl-8 text-xs w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
            <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500">
              <Filter size={16} />
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-off-white text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4">Candidate Name</th>
                <th className="px-6 py-4">Job ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Interview Score</th>
                <th className="px-6 py-4">Applied Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-navy rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-off-white transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-navy font-bold text-xs">
                          {candidate.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy">{candidate.name}</p>
                          <p className="text-[10px] text-slate-400">{candidate.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-600">{candidate.jobTitle || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${
                        candidate.status === 'Hired' ? 'badge-success' :
                        candidate.status === 'Shortlisted' ? 'badge-info' :
                        candidate.status === 'Rejected' ? 'badge-error' : 'badge-warning'
                      }`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {candidate.interviewScore ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-navy">
                          <Star size={14} className="text-soft-amber fill-soft-amber" />
                          {candidate.interviewScore}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500">{new Date(candidate.appliedDate).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity relative">
                        {candidate.status === 'Applied' && (
                          <button 
                            onClick={() => updateStatus(candidate.id, 'Shortlisted')}
                            className="p-1.5 text-slate-400 hover:text-slate-blue hover:bg-white rounded-lg border border-transparent hover:border-slate-200" title="Shortlist"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        {candidate.status === 'Shortlisted' && (
                          <button 
                            onClick={() => setSchedulingInterview(candidate)}
                            className="p-1.5 text-slate-400 hover:text-soft-amber hover:bg-white rounded-lg border border-transparent hover:border-slate-200" title="Schedule Interview"
                          >
                            <Calendar size={16} />
                          </button>
                        )}
                        {candidate.status === 'Interviewing' && (
                          <button 
                            onClick={() => setAddingScore(candidate)}
                            className="p-1.5 text-slate-400 hover:text-emerald hover:bg-white rounded-lg border border-transparent hover:border-slate-200" title="Add Score"
                          >
                            <Star size={16} />
                          </button>
                        )}
                        {candidate.status === 'Interviewed' && (
                          <button 
                            onClick={() => updateStatus(candidate.id, 'Hired')}
                            className="p-1.5 text-slate-400 hover:text-emerald hover:bg-white rounded-lg border border-transparent hover:border-slate-200" title="Hire"
                          >
                            <UserCheck size={16} />
                          </button>
                        )}
                        {candidate.status !== 'Rejected' && candidate.status !== 'Hired' && (
                          <button 
                            onClick={() => updateStatus(candidate.id, 'Rejected')}
                            className="p-1.5 text-slate-400 hover:text-muted-red hover:bg-white rounded-lg border border-transparent hover:border-slate-200" title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        
                        <div className="relative">
                          <button 
                            onClick={() => setActiveDropdown(activeDropdown === candidate.id ? null : candidate.id)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              activeDropdown === candidate.id ? 'bg-navy text-white border-navy' : 'text-slate-400 hover:text-navy hover:bg-white border-transparent hover:border-slate-200'
                            }`}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          
                          <AnimatePresence>
                            {activeDropdown === candidate.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-[60]" 
                                  onClick={() => setActiveDropdown(null)}
                                />
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-[70] text-left"
                                >
                                  <button 
                                    onClick={() => {
                                      if (candidate.resume) {
                                        const link = document.createElement('a');
                                        link.href = candidate.resume.base64;
                                        link.download = candidate.resume.name;
                                        link.click();
                                      }
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-off-white rounded-lg transition-colors"
                                  >
                                    <Download size={14} />
                                    Download Resume
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setSchedulingInterview(candidate);
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-off-white rounded-lg transition-colors"
                                  >
                                    <Calendar size={14} />
                                    Schedule Interview
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setAddingScore(candidate);
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-off-white rounded-lg transition-colors"
                                  >
                                    <Star size={14} />
                                    Add Interview Score
                                  </button>
                                  <div className="h-px bg-slate-100 my-1" />
                                  <button 
                                    onClick={() => updateStatus(candidate.id, 'Rejected')}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-muted-red hover:bg-muted-red/5 rounded-lg transition-colors"
                                  >
                                    <XCircle size={14} />
                                    Reject Candidate
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">No candidates found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-10 text-center">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-navy rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredCandidates.length > 0 ? (
            filteredCandidates.map((candidate) => (
              <div key={candidate.id} className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-navy font-bold text-sm">
                      {candidate.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-navy">{candidate.name}</p>
                      <p className="text-[10px] text-slate-400">{candidate.email}</p>
                    </div>
                  </div>
                  <span className={`badge ${
                    candidate.status === 'Hired' ? 'badge-success' :
                    candidate.status === 'Shortlisted' ? 'badge-info' :
                    candidate.status === 'Rejected' ? 'badge-error' : 'badge-warning'
                  }`}>
                    {candidate.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                  <div>
                    <p className="mb-1">Job Title</p>
                    <p className="text-navy normal-case font-bold text-xs">{candidate.jobTitle || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="mb-1">Applied Date</p>
                    <p className="text-navy normal-case font-bold text-xs">{new Date(candidate.appliedDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {candidate.interviewScore ? (
                    <div className="flex items-center gap-1 text-xs font-bold text-navy">
                      <Star size={14} className="text-soft-amber fill-soft-amber" />
                      <span>Score: {candidate.interviewScore}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300">No Score</span>
                  )}
                  
                  <div className="flex gap-2">
                    {candidate.status === 'Applied' && (
                      <button 
                        onClick={() => updateStatus(candidate.id, 'Shortlisted')}
                        className="p-2 bg-off-white text-slate-blue rounded-lg"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    {candidate.status === 'Shortlisted' && (
                      <button 
                        onClick={() => updateStatus(candidate.id, 'Hired')}
                        className="p-2 bg-off-white text-emerald rounded-lg"
                      >
                        <UserCheck size={16} />
                      </button>
                    )}
                    {candidate.status !== 'Rejected' && candidate.status !== 'Hired' && (
                      <button 
                        onClick={() => updateStatus(candidate.id, 'Rejected')}
                        className="p-2 bg-off-white text-muted-red rounded-lg"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-slate-500 text-sm">No candidates found.</div>
          )}
        </div>
      </div>

      {/* Schedule Interview Modal */}
      <AnimatePresence>
        {schedulingInterview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-md p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-navy">Schedule Interview</h3>
                <button 
                  onClick={() => setSchedulingInterview(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-navy font-bold shadow-sm">
                  {schedulingInterview.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-navy">{schedulingInterview.name}</p>
                  <p className="text-[10px] text-slate-500">{schedulingInterview.jobTitle}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interview Date</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interview Time</label>
                  <input 
                    type="time" 
                    className="input-field" 
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setSchedulingInterview(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleScheduleInterview}
                  disabled={isSubmitting || !interviewDate || !interviewTime}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <Send size={16} />}
                  <span>Schedule</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Score Modal */}
      <AnimatePresence>
        {addingScore && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-md p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-navy">Interview Feedback</h3>
                <button 
                  onClick={() => setAddingScore(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interview Score (1-5)</label>
                  <div className="flex justify-between gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setScore(String(s))}
                        className={`flex-1 py-3 rounded-xl border font-bold transition-all ${
                          score === String(s) 
                            ? 'bg-soft-amber text-white border-soft-amber shadow-lg shadow-soft-amber/20 scale-105' 
                            : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interview Remarks</label>
                  <textarea 
                    className="input-field h-32 resize-none" 
                    placeholder="Provide detailed feedback about the candidate's performance..."
                    value={scoreRemarks}
                    onChange={(e) => setScoreRemarks(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setAddingScore(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddScore}
                  disabled={isSubmitting || !score}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <Trophy size={16} />}
                  <span>Save Feedback</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecruitmentView;
