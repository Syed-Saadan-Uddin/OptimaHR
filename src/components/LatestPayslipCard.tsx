import React, { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Payslip } from '../types/hr';
import { handleFirestoreError, OperationType } from '../firestoreUtils';

interface LatestPayslipCardProps {
  userId: string;
  onNavigate?: (tab: string, data?: any) => void;
}

const LatestPayslipCard: React.FC<LatestPayslipCardProps> = ({ userId, onNavigate }) => {
  const [latestPayslip, setLatestPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const payslipQuery = query(
      collection(db, 'payslips'),
      where('employeeId', '==', userId),
      orderBy('processedAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(payslipQuery, (snapshot) => {
      if (!snapshot.empty) {
        setLatestPayslip({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Payslip);
      } else {
        setLatestPayslip(null);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'payslips');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-4 w-24 bg-slate-100 rounded mb-4" />
        <div className="h-20 bg-slate-50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-navy">Your Latest Payslip</h3>
        <CreditCard size={20} className="text-slate-blue" />
      </div>
      {latestPayslip ? (
        <div className="bg-off-white p-4 rounded-xl border border-dashed border-slate-300">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500">{latestPayslip.month}</span>
            <span className="badge badge-success">Paid</span>
          </div>
          <p className="text-xl font-bold text-navy">${latestPayslip.netSalary.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-1">Net Pay after deductions</p>
          <button 
            onClick={() => onNavigate?.('payslip', latestPayslip)}
            className="w-full mt-4 py-2 text-xs font-bold text-slate-blue hover:bg-white rounded-lg border border-slate-200 transition-all"
          >
            View Details
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-32 text-slate-400">
          <CreditCard size={24} className="mb-2 opacity-20" />
          <p className="text-xs">No payslips found for you</p>
        </div>
      )}
    </div>
  );
};

export default LatestPayslipCard;
