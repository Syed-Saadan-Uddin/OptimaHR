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
  Lock,
  Loader2,
  ExternalLink,
  MessageSquare,
  Award,
  Zap,
  X,
  PartyPopper
} from 'lucide-react';
import { UserRole } from '../types/hr';
import { UserData } from '../App';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
  where,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

interface HRDashboardProps {
  userData: UserData;
}

interface ApplicationData {
  id: string;
  candidateId: string;
  jobId: string;
  jobTitle: string;
  department: string;
  location: string;
  displayName: string;
  email: string;
  linkedinUrl: string;
  status: 'Applied' | 'Shortlisted' | 'Interviewing' | 'Interviewed' | 'Rejected' | 'Hired';
  appliedAt: Timestamp | null;
  interviewScore?: number;
  technicalScore?: number;
  softSkillsScore?: number;
  interviewRemarks?: string;
  jobDepartment?: string;
}

const HRDashboard: React.FC<HRDashboardProps> = ({ userData }) => {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);

  // Evaluation Modal State
  const [evaluatingApp, setEvaluatingApp] = useState<ApplicationData | null>(null);
  const [evaluationData, setEvaluationData] = useState({
    technicalScore: 5,
    softSkillsScore: 5,
    remarks: ''
  });

  // Success Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHireSuccess, setShowHireSuccess] = useState(false);
  const [hiredName, setHiredName] = useState('');

  const role = userData.role;
  const isManager = role === 'DEPT_HEAD';
  const isAdmin = role === 'HR_ADMIN';

  useEffect(() => {
    if ((!isAdmin && !isManager) || !db) return;

    let q = query(collection(db, 'applications'), orderBy('appliedAt', 'desc'));

    if (isManager) {
      q = query(
        collection(db, 'applications'),
        where('status', 'in', ['Shortlisted', 'Interviewing', 'Interviewed']),
        orderBy('appliedAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ApplicationData[];

      if (isManager && userData.department) {
        data = data.filter(app =>
          (app.department === userData.department) || (app.jobDepartment === userData.department)
        );
      }

      setApplications(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching applications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role, userData.department]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const appRef = doc(db, 'applications', id);
      await updateDoc(appRef, { status: newStatus, lastUpdate: serverTimestamp() });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  const handleFinalHire = async (appId: string, candidateId: string, department: string, name: string) => {
    if (!candidateId) {
      console.error("Missing candidateId for application:", appId);
      alert("Error: Candidate ID is missing. Cannot proceed with hire.");
      return;
    }

    console.log(`Starting Final Hire migration for ${name} (${candidateId})...`);
    setIsSubmitting(true);
    try {
      // 1. Update Application status to Hired
      const appRef = doc(db, 'applications', appId);
      await updateDoc(appRef, { status: 'Hired', lastUpdate: serverTimestamp() });
      console.log("Application status updated to Hired.");

      // 2. Perform Data Migration: Convert Candidate user to Employee user
      const userRef = doc(db, 'users', candidateId);
      await updateDoc(userRef, {
        role: 'EMPLOYEE',
        status: 'Active',
        department: department,
        onboardingDate: serverTimestamp(),
        hiredAt: serverTimestamp()
      });
      console.log("User role migrated to EMPLOYEE.");

      setHiredName(name);
      setShowHireSuccess(true);
      setTimeout(() => setShowHireSuccess(false), 5000);
    } catch (error) {
      console.error("Critical error in Final Hire migration:", error);
      alert("Migration failed! This is usually due to missing database permissions for the HR Admin to update other users. Check your browser console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!evaluatingApp) return;

    setIsSubmitting(true);
    try {
      const avgScore = (evaluationData.technicalScore + evaluationData.softSkillsScore) / 2;
      const appRef = doc(db, 'applications', evaluatingApp.id);

      await updateDoc(appRef, {
        technicalScore: evaluationData.technicalScore,
        softSkillsScore: evaluationData.softSkillsScore,
        interviewRemarks: evaluationData.remarks,
        interviewScore: avgScore,
        status: 'Interviewed',
        feedbackBy: auth.currentUser?.uid,
        feedbackAt: serverTimestamp(),
        lastUpdate: serverTimestamp()
      });

      setEvaluatingApp(null);
      setEvaluationData({ technicalScore: 5, softSkillsScore: 5, remarks: '' });
    } catch (error) {
      console.error("Error saving evaluation:", error);
      alert("Failed to save evaluation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return '---';
    return timestamp.toDate().toLocaleDateString();
  };

  if (!isAdmin && !isManager) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
        <div className="w-20 h-20 bg-muted-red/10 text-muted-red rounded-full flex items-center justify-center shadow-inner">
          <Lock size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-navy">Access Denied</h2>
          <p className="text-slate-500 max-w-xs mx-auto text-sm">
            This module is restricted to HR and Department Heads.
          </p>
        </div>
      </div>
    );
  }

  const filteredApps = applications.filter(app => {
    const matchesFilter = filter === 'All' || app.status === filter;
    const matchesSearch = app.displayName.toLowerCase().includes(search.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 relative">
      <div className="flex justify-between items-center text-left">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {isManager ? `${userData.department} Recruitment` : 'Recruitment Screening'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isManager
              ? 'Evaluate shortlisted candidates and provide technical feedback.'
              : 'Manage candidates and hiring pipelines in real-time.'}
          </p>
        </div>
        {!isManager && (
          <div className="flex gap-3">
            <button className="btn-secondary flex items-center gap-2">
              <Download size={18} />
              <span>Export CSV</span>
            </button>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-off-white/50">
          <div className="flex flex-wrap gap-2">
            {(isManager ? ['All', 'Shortlisted', 'Interviewed'] : ['All', 'Applied', 'Shortlisted', 'Interviewed', 'Hired', 'Rejected']).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-navy text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <input
                type="text"
                placeholder="Search by name or job..."
                className="input-field py-1.5 pl-8 text-xs w-full md:w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-navy animate-spin mb-4" />
              <p className="text-slate-500 text-sm font-medium">Syncing applications...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-off-white text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Candidate Name</th>
                  <th className="px-6 py-4">Position</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Avg Score</th>
                  <th className="px-6 py-4">Applied Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-off-white transition-colors group">
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-navy font-bold text-xs uppercase">
                          {app.displayName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy">{app.displayName}</p>
                          <p className="text-[10px] text-slate-400">{app.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <span className="text-xs font-medium text-slate-600">{app.jobTitle}</span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <span className={`badge ${app.status === 'Hired' ? 'badge-success' :
                        app.status === 'Shortlisted' ? 'badge-info' :
                          app.status === 'Interviewed' ? 'badge-info' :
                            app.status === 'Rejected' ? 'badge-error' : 'badge-warning'
                        }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      {app.interviewScore ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-navy">
                          <Star size={14} className="text-soft-amber fill-soft-amber" />
                          {app.interviewScore.toFixed(1)}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <span className="text-xs text-slate-500">{formatDate(app.appliedAt)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => app.linkedinUrl && window.open(app.linkedinUrl, '_blank')}
                          className="p-1.5 text-slate-400 hover:text-navy hover:bg-white rounded-lg border border-transparent hover:border-slate-200"
                          title="View LinkedIn Profile"
                          disabled={!app.linkedinUrl}
                        >
                          <Eye size={16} />
                        </button>

                        {isManager && (app.status === 'Shortlisted' || app.status === 'Interviewing') && (
                          <button
                            onClick={() => setEvaluatingApp(app)}
                            className="btn-primary text-[10px] py-1.5 px-3 flex items-center gap-1.5"
                          >
                            <MessageSquare size={12} />
                            <span>Evaluate</span>
                          </button>
                        )}

                        {isAdmin && (
                          <>
                            {app.status === 'Applied' && (
                              <button
                                onClick={() => updateStatus(app.id, 'Shortlisted')}
                                className="p-1.5 text-slate-400 hover:text-slate-blue hover:bg-white rounded-lg border border-transparent hover:border-slate-200" title="Shortlist"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            )}
                            {(app.status === 'Shortlisted' || app.status === 'Interviewed') && (
                              <button
                                onClick={() => handleFinalHire(app.id, app.candidateId, app.department, app.displayName)}
                                className="p-1.5 text-slate-400 hover:text-emerald hover:bg-white rounded-lg border border-transparent hover:border-slate-200" title="Confirm Hire"
                              >
                                <UserCheck size={16} />
                              </button>
                            )}
                            {app.status !== 'Rejected' && app.status !== 'Hired' && (
                              <button
                                onClick={() => updateStatus(app.id, 'Rejected')}
                                className="p-1.5 text-slate-400 hover:text-muted-red hover:bg-white rounded-lg border border-transparent hover:border-slate-200" title="Reject"
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                          </>
                        )}
                        <button className="p-1.5 text-slate-400 hover:text-navy hover:bg-white rounded-lg border border-transparent hover:border-slate-200">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filteredApps.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-slate-400 text-sm">No candidates visible in your dashboard.</p>
            </div>
          )}
        </div>
      </div>

      {/* Success Toast / Confetti-like Notification */}
      <AnimatePresence>
        {showHireSuccess && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110]"
          >
            <div className="bg-emerald text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/20">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <PartyPopper size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Hiring Successful!</p>
                <p className="text-[10px] opacity-90">{hiredName} has been officially onboarded as an Employee.</p>
              </div>
              <button onClick={() => setShowHireSuccess(false)} className="ml-4 hover:opacity-70">
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evaluation Modal */}
      <AnimatePresence>
        {evaluatingApp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-lg p-8 space-y-6"
            >
              <div className="flex justify-between items-center text-left">
                <div>
                  <h3 className="text-xl font-bold text-navy">Interview Feedback</h3>
                  <p className="text-xs text-slate-500 mt-1">Evaluating: <span className="font-bold">{evaluatingApp.displayName}</span></p>
                </div>
                <button onClick={() => setEvaluatingApp(null)} className="text-slate-400 hover:text-muted-red">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 text-left">
                      <Zap size={12} className="text-soft-amber" />
                      Technical Proficiency (1-5)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button
                          key={num}
                          onClick={() => setEvaluationData({ ...evaluationData, technicalScore: num })}
                          className={`flex-1 py-3 rounded-xl border-2 transition-all font-bold ${evaluationData.technicalScore === num
                            ? 'bg-navy border-navy text-white shadow-lg'
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                            }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 text-left">
                      <Award size={12} className="text-emerald" />
                      Soft Skills & Culture Fit (1-5)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button
                          key={num}
                          onClick={() => setEvaluationData({ ...evaluationData, softSkillsScore: num })}
                          className={`flex-1 py-3 rounded-xl border-2 transition-all font-bold ${evaluationData.softSkillsScore === num
                            ? 'bg-navy border-navy text-white shadow-lg'
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                            }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left block">Interview Remarks</label>
                  <textarea
                    className="input-field h-32 py-3 resize-none text-left"
                    placeholder="Provide constructive feedback on technical skills and overall performance..."
                    value={evaluationData.remarks}
                    onChange={(e) => setEvaluationData({ ...evaluationData, remarks: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setEvaluatingApp(null)} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={handleSubmitEvaluation}
                  disabled={isSubmitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
                  <span>Submit Scores</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HRDashboard;
