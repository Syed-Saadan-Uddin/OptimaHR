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
  Search
} from 'lucide-react';
import { Candidate } from '../types/hr';
import { db } from '../firebase';
import { collection, onSnapshot, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firestoreUtils';

const RecruitmentView: React.FC<{ role?: string }> = ({ role }) => {
  const [filter, setFilter] = useState('All');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${id}`);
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
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        <button className="p-1.5 text-slate-400 hover:text-navy hover:bg-white rounded-lg border border-transparent hover:border-slate-200">
                          <MoreHorizontal size={16} />
                        </button>
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
    </div>
  );
};

export default RecruitmentView;
