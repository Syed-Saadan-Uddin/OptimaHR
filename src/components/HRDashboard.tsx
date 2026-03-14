import React, { useState } from 'react';
import { 
  Filter, 
  MoreHorizontal, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Eye,
  Star,
  Download
} from 'lucide-react';
import { Candidate } from '../types/hr';

const mockCandidates: Candidate[] = [
  { id: '1', name: 'Alice Thompson', email: 'alice.t@example.com', appliedJobId: '1', status: 'Shortlisted', interviewScore: 4.5, appliedDate: '2026-02-20' },
  { id: '2', name: 'Robert Chen', email: 'r.chen@example.com', appliedJobId: '1', status: 'Applied', appliedDate: '2026-02-22' },
  { id: '3', name: 'Sarah Miller', email: 'sarah.m@example.com', appliedJobId: '2', status: 'Rejected', interviewScore: 2.1, appliedDate: '2026-02-18' },
  { id: '4', name: 'David Wilson', email: 'd.wilson@example.com', appliedJobId: '3', status: 'Hired', interviewScore: 4.8, appliedDate: '2026-02-15' },
];

const HRDashboard: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);

  const updateStatus = (id: string, status: Candidate['status']) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const filteredCandidates = candidates.filter(c => filter === 'All' || c.status === filter);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Recruitment Screening</h1>
          <p className="text-slate-500 text-sm mt-1">Manage candidates and hiring pipelines.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-off-white/50">
          <div className="flex gap-2">
            {['All', 'Applied', 'Shortlisted', 'Interviewed', 'Hired', 'Rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f ? 'bg-navy text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search candidates..." 
                className="input-field py-1.5 pl-8 text-xs w-64"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
            <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500">
              <Filter size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
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
              {filteredCandidates.map((candidate) => (
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
                    <span className="text-xs font-medium text-slate-600">#JOB-{candidate.appliedJobId}</span>
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
                    <span className="text-xs text-slate-500">{candidate.appliedDate}</span>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import { Search } from 'lucide-react';
export default HRDashboard;
