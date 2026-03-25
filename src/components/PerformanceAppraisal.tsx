import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  TrendingUp, 
  Star,
  MessageSquare,
  ChevronRight,
  AlertCircle,
  XCircle,
  Users,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PerformanceGoal, Appraisal, Employee } from '../types/hr';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from './FirebaseProvider';
import { handleFirestoreError, OperationType } from '../firestoreUtils';

const PerformanceAppraisal: React.FC<{ role: string }> = ({ role }) => {
  const { user } = useFirebase();
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [appraisal, setAppraisal] = useState<Appraisal | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalWeight, setNewGoalWeight] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const currentPeriod = "2026-Annual";

  // Fetch employees if admin/dept head
  useEffect(() => {
    if (!user || (role !== 'HR_ADMIN' && role !== 'DEPT_HEAD')) return;

    const q = query(collection(db, 'users'), where('role', 'in', ['EMPLOYEE', 'DEPT_HEAD']));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      setEmployees(emps);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, [user, role]);

  // Set initial selected employee
  useEffect(() => {
    if (user && (role === 'EMPLOYEE' || role === 'CANDIDATE')) {
      setSelectedEmployeeId(user.uid);
    } else if (employees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [user, role, employees]);

  // Fetch goals and appraisal for selected employee
  useEffect(() => {
    if (!selectedEmployeeId) return;

    setLoading(true);
    const goalsQuery = query(
      collection(db, 'goals'),
      where('employeeId', '==', selectedEmployeeId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => {
      const goalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PerformanceGoal[];
      setGoals(goalsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'goals');
    });

    const appraisalId = `${selectedEmployeeId}_${currentPeriod}`;
    const unsubscribeAppraisal = onSnapshot(doc(db, 'appraisals', appraisalId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Appraisal;
        setAppraisal(data);
        setRemarks(data.managerRemarks || '');
      } else {
        setAppraisal(null);
        setRemarks('');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `appraisals/${appraisalId}`);
    });

    return () => {
      unsubscribeGoals();
      unsubscribeAppraisal();
    };
  }, [selectedEmployeeId]);

  // Initialize appraisal if it doesn't exist (for employees)
  useEffect(() => {
    if (role === 'EMPLOYEE' && user && selectedEmployeeId === user.uid && !appraisal && !loading) {
      const appraisalId = `${user.uid}_${currentPeriod}`;
      setDoc(doc(db, 'appraisals', appraisalId), {
        employeeId: user.uid,
        period: currentPeriod,
        status: 'Draft',
        updatedAt: serverTimestamp(),
        timeline: [
          { label: 'Goal Setting', date: new Date().toLocaleDateString(), status: 'completed' },
          { label: 'Mid-Year Review', date: 'Jun 15, 2026', status: 'pending' },
          { label: 'Annual Appraisal', date: 'Dec 10, 2026', status: 'pending' },
        ]
      }, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `appraisals/${appraisalId}`);
      });
    }
  }, [role, user, selectedEmployeeId, appraisal, loading]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'goals'), {
        employeeId: selectedEmployeeId,
        title: newGoalTitle,
        weight: newGoalWeight,
        score: 0,
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewGoalTitle('');
      setNewGoalWeight(10);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'goals');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateScore = async (goalId: string, score: number) => {
    try {
      await updateDoc(doc(db, 'goals', goalId), { score });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `goals/${goalId}`);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteDoc(doc(db, 'goals', goalId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `goals/${goalId}`);
    }
  };

  const handleSaveAppraisal = async () => {
    if (!selectedEmployeeId) return;
    const appraisalId = `${selectedEmployeeId}_${currentPeriod}`;
    
    try {
      await setDoc(doc(db, 'appraisals', appraisalId), {
        employeeId: selectedEmployeeId,
        period: currentPeriod,
        managerRemarks: remarks,
        overallScore: Number(avgScore),
        status: appraisal?.status || 'Draft',
        updatedAt: serverTimestamp(),
        timeline: appraisal?.timeline || [
          { label: 'Goal Setting', date: new Date().toLocaleDateString(), status: 'completed' },
          { label: 'Mid-Year Review', date: 'Jun 15, 2026', status: 'pending' },
          { label: 'Annual Appraisal', date: 'Dec 10, 2026', status: 'pending' },
        ]
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `appraisals/${appraisalId}`);
    }
  };

  const handleUpdateAppraisalStatus = async (newStatus: Appraisal['status']) => {
    if (!selectedEmployeeId) return;
    const appraisalId = `${selectedEmployeeId}_${currentPeriod}`;
    
    const updatedTimeline = appraisal?.timeline?.map(item => {
      if (newStatus === 'Reviewed' && item.label === 'Mid-Year Review') return { ...item, status: 'completed' as const };
      if (newStatus === 'Closed' && item.label === 'Annual Appraisal') return { ...item, status: 'completed' as const };
      return item;
    });

    try {
      await setDoc(doc(db, 'appraisals', appraisalId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(updatedTimeline && { timeline: updatedTimeline })
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appraisals/${appraisalId}`);
    }
  };

  const totalWeight = goals.reduce((acc, g) => acc + g.weight, 0);
  const avgScore = (goals.reduce((acc, g) => acc + (g.score || 0) * (g.weight / 100), 0)).toFixed(1);

  const getRatingText = (score: number) => {
    if (score >= 4.5) return "Outstanding";
    if (score >= 4.0) return "Exceeds Expectations";
    if (score >= 3.0) return "Meets Expectations";
    if (score >= 2.0) return "Needs Improvement";
    return "Unsatisfactory";
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
      {/* Employee Selector for Admins */}
      {(role === 'HR_ADMIN' || role === 'DEPT_HEAD') && (
        <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
          <div className="card p-4 space-y-4">
            <div className="flex items-center gap-2 text-navy font-bold">
              <Users size={20} />
              <span>Team Members</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search employees..." 
                className="input-field pl-10 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[calc(100vh-300px)] pb-2 lg:pb-0 lg:pr-2 custom-scrollbar">
              {filteredEmployees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployeeId(emp.id)}
                  className={`flex-shrink-0 lg:flex-shrink w-48 lg:w-full text-left p-3 rounded-xl transition-all ${
                    selectedEmployeeId === emp.id 
                      ? 'bg-emerald/10 text-emerald ring-1 ring-emerald/20' 
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <p className="font-bold text-sm truncate">{emp.name}</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-60 truncate">{emp.department}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-navy">
                {selectedEmployee ? `${selectedEmployee.name}'s Appraisal` : 'Performance Appraisal'}
              </h1>
              {appraisal?.status && (
                <span className={`badge ${
                  appraisal.status === 'Closed' ? 'badge-success' : 
                  appraisal.status === 'Reviewed' ? 'badge-info' : 
                  'badge-warning'
                }`}>
                  {appraisal.status}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-1">
              {currentPeriod} Review Cycle
            </p>
          </div>
          {role === 'EMPLOYEE' && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
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
                {loading ? (
                  <div className="p-10 text-center">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-navy rounded-full animate-spin mx-auto" />
                  </div>
                ) : goals.length > 0 ? (
                  goals.map((goal) => (
                    <div key={goal.id} className="p-6 flex items-start justify-between group">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-navy">{goal.title}</span>
                          <span className="badge badge-info">{goal.weight}% Weight</span>
                        </div>
                        {(role === 'HR_ADMIN' || role === 'DEPT_HEAD') && (
                          <div className="flex items-center gap-4 mt-4">
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rating (1-5)</label>
                              <input 
                                type="range" 
                                min="1" 
                                max="5" 
                                step="0.1" 
                                value={goal.score || 1} 
                                onChange={(e) => handleUpdateScore(goal.id, parseFloat(e.target.value))}
                                className="w-full accent-emerald" 
                              />
                            </div>
                            <div className="w-12 h-12 bg-off-white rounded-xl flex items-center justify-center font-bold text-navy">
                              {goal.score || 0}
                            </div>
                          </div>
                        )}
                        {role === 'EMPLOYEE' && goal.score !== undefined && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald transition-all duration-500" 
                                style={{ width: `${(goal.score / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-navy">{goal.score}/5</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {role === 'EMPLOYEE' && (
                          <button 
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="p-2 text-slate-300 hover:text-muted-red transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-slate-500">No goals set yet.</div>
                )}
              </div>
              {role === 'EMPLOYEE' && totalWeight !== 100 && (
                <div className="p-4 bg-soft-amber/10 border-t border-soft-amber/20 flex items-center gap-3">
                  <AlertCircle size={18} className="text-soft-amber" />
                  <p className="text-xs text-soft-amber font-medium">Total weight must equal 100% before submission.</p>
                </div>
              )}
              {role === 'EMPLOYEE' && totalWeight === 100 && appraisal?.status !== 'Submitted' && appraisal?.status !== 'Reviewed' && appraisal?.status !== 'Closed' && (
                <div className="p-4 bg-emerald/10 border-t border-emerald/20 flex items-center justify-between">
                  <p className="text-xs text-emerald font-medium">Goals are ready for review.</p>
                  <button 
                    onClick={() => handleUpdateAppraisalStatus('Submitted')}
                    className="btn-primary py-2 text-xs"
                  >
                    Submit for Review
                  </button>
                </div>
              )}
            </div>

            {(role === 'HR_ADMIN' || role === 'DEPT_HEAD') && (
              <div className="card p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-navy">Manager Remarks</h3>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
                    <select 
                      className="text-xs font-bold bg-slate-50 border-none rounded-lg px-2 py-1 text-navy focus:ring-0"
                      value={appraisal?.status || 'Draft'}
                      onChange={(e) => {
                        const newStatus = e.target.value as Appraisal['status'];
                        setAppraisal(prev => prev ? { ...prev, status: newStatus } : null);
                      }}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Reviewed">Reviewed</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>
                <textarea 
                  className="input-field h-32 resize-none" 
                  placeholder="Provide detailed feedback on performance and areas of improvement..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                ></textarea>
                <div className="flex justify-end pt-2">
                  <button onClick={handleSaveAppraisal} className="btn-primary">Save Review</button>
                </div>
              </div>
            )}

            {role === 'EMPLOYEE' && appraisal?.managerRemarks && (
              <div className="card p-6 space-y-4 bg-emerald/5 border-emerald/10">
                <div className="flex items-center gap-2 text-emerald">
                  <MessageSquare size={20} />
                  <h3 className="font-bold">Manager Feedback</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {appraisal.managerRemarks}
                </p>
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
              <p className="text-xs text-slate-500 italic">"{getRatingText(Number(avgScore))}"</p>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-navy mb-4">Review Timeline</h3>
              <div className="space-y-6 relative">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-100" />
                {(appraisal?.timeline || [
                  { label: 'Goal Setting', date: 'Jan 05, 2026', status: 'completed' },
                  { label: 'Mid-Year Review', date: 'Jun 15, 2026', status: 'pending' },
                  { label: 'Annual Appraisal', date: 'Dec 10, 2026', status: 'pending' },
                ]).map((item, i) => (
                  <div key={i} className="flex items-start gap-4 relative">
                    <div className={`w-4 h-4 rounded-full border-2 border-white z-10 mt-1 ${
                      item.status === 'completed' ? 'bg-emerald' : 'bg-slate-200'
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

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-md p-6 sm:p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-bold text-navy">Add Performance Goal</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-navy">
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleAddGoal} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Goal Title</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Improve platform performance"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weight (%)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      min="1"
                      max={100 - totalWeight + (goals.length > 0 ? 0 : 0)}
                      value={newGoalWeight}
                      onChange={(e) => setNewGoalWeight(Number(e.target.value))}
                      required
                    />
                    <p className="text-[10px] text-slate-400">Remaining weight: {100 - totalWeight}%</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                    {isSubmitting ? 'Adding...' : 'Add Goal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PerformanceAppraisal;
