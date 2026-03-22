import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  TrendingUp,
  Star,
  MessageSquare,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { PerformanceGoal } from '../types/hr';

const PerformanceAppraisal: React.FC<{ role: string }> = ({ role }) => {
  const isReviewer = role === 'DEPT_HEAD' || role === 'HR_ADMIN';
  const isEmployee = role === 'EMPLOYEE';

  const [goals, setGoals] = useState<PerformanceGoal[]>([
    { id: '1', title: 'Improve platform performance by 20%', weight: 40, score: 4.5 },
    { id: '2', title: 'Implement new onboarding wizard', weight: 30, score: 4.0 },
    { id: '3', title: 'Mentor 2 junior developers', weight: 30, score: 4.8 },
  ]);

  const totalWeight = goals.reduce((acc, g) => acc + g.weight, 0);
  const avgScore = (goals.reduce((acc, g) => acc + (g.score || 0) * (g.weight / 100), 0)).toFixed(1);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Performance Appraisal</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isEmployee ? 'Set your goals and track your progress.' : 'Review and rate team performance.'}
          </p>
        </div>
        {isEmployee && (
          <button className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            <span>Add New Goal</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-off-white/50">
              <h3 className="font-bold text-navy">Key Result Areas (KRAs)</h3>
              <div className={`text-xs font-bold ${totalWeight === 100 ? 'text-emerald' : 'text-muted-red'}`}>
                Total Weight: {totalWeight}%
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {goals.map((goal) => (
                <div key={goal.id} className="p-6 flex items-start justify-between group">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-navy">{goal.title}</span>
                      <span className="badge badge-info">{goal.weight}% Weight</span>
                    </div>
                    {isReviewer && (
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rating (1-5)</label>
                          <input type="range" min="1" max="5" step="0.1" defaultValue={goal.score} className="w-full accent-emerald" />
                        </div>
                        <div className="w-12 h-12 bg-off-white rounded-xl flex items-center justify-center font-bold text-navy">
                          {goal.score}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {isEmployee && (
                      <button className="p-2 text-slate-300 hover:text-muted-red transition-all">
                        <Trash2 size={18} />
                      </button>
                    )}
                    <button className="p-2 text-slate-300 hover:text-navy transition-all">
                      <MessageSquare size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {isEmployee && totalWeight !== 100 && (
              <div className="p-4 bg-soft-amber/10 border-t border-soft-amber/20 flex items-center gap-3">
                <AlertCircle size={18} className="text-soft-amber" />
                <p className="text-xs text-soft-amber font-medium">Total weight must equal 100% before submission.</p>
              </div>
            )}
          </div>

          {isReviewer && (
            <div className="card p-6 space-y-4">
              <h3 className="font-bold text-navy">Manager Remarks</h3>
              <textarea className="input-field h-32 resize-none" placeholder="Provide detailed feedback on performance and areas of improvement..."></textarea>
              <div className="flex justify-end pt-2">
                <button className="btn-primary">Submit Review</button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6 text-center space-y-4">
            <div className="w-20 h-20 bg-emerald/10 text-emerald rounded-full flex items-center justify-center mx-auto">
              <TrendingUp size={40} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Calculated Score</p>
              <p className="text-4xl font-bold text-navy mt-1">{avgScore}</p>
            </div>
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={16} className={s <= Math.round(Number(avgScore)) ? 'text-soft-amber fill-soft-amber' : 'text-slate-200'} />
              ))}
            </div>
            <p className="text-xs text-slate-500 italic">"Exceeds Expectations"</p>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-navy mb-4">Review Timeline</h3>
            <div className="space-y-6 relative">
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-100" />
              {[
                { label: 'Goal Setting', date: 'Jan 05, 2026', status: 'completed' },
                { label: 'Mid-Year Review', date: 'Jun 15, 2026', status: 'pending' },
                { label: 'Annual Appraisal', date: 'Dec 10, 2026', status: 'pending' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 relative">
                  <div className={`w-4 h-4 rounded-full border-2 border-white z-10 mt-1 ${item.status === 'completed' ? 'bg-emerald' : 'bg-slate-200'
                    }`} />
                  <div>
                    <p className="text-xs font-bold text-navy">{item.label}</p>
                    <p className="text-[10px] text-slate-400">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAppraisal;
