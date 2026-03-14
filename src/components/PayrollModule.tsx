import React, { useState } from 'react';
import { 
  CreditCard, 
  Play, 
  Settings, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Download,
  History,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PayrollModule: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [grossSalary, setGrossSalary] = useState(5000);

  const breakdown = {
    basic: grossSalary * 0.5,
    hra: grossSalary * 0.3,
    allowances: grossSalary * 0.2,
  };

  const handleRunPayroll = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setShowSuccess(true);
    }, 3000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Payroll Automation</h1>
          <p className="text-slate-500 text-sm mt-1">Configure salary structures and run monthly batches.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <History size={18} />
            <span>Payroll History</span>
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Settings size={18} />
            <span>Config Rules</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="card p-6">
            <h3 className="font-bold text-navy mb-6">Salary Structure Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gross Monthly Salary ($)</label>
                  <input 
                    type="number" 
                    value={grossSalary}
                    onChange={(e) => setGrossSalary(Number(e.target.value))}
                    className="input-field text-lg font-bold text-navy"
                  />
                </div>
                <div className="p-4 bg-off-white rounded-xl space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Basic (50%)</span>
                    <span className="font-bold text-navy">${breakdown.basic.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">HRA (30%)</span>
                    <span className="font-bold text-navy">${breakdown.hra.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Allowances (20%)</span>
                    <span className="font-bold text-navy">${breakdown.allowances.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center items-center text-center p-6 bg-emerald/5 rounded-2xl border border-emerald/10">
                <div className="w-16 h-16 bg-emerald/10 rounded-full flex items-center justify-center text-emerald mb-4">
                  <CreditCard size={32} />
                </div>
                <h4 className="font-bold text-navy">Auto-Calculated Breakdown</h4>
                <p className="text-xs text-slate-500 mt-2">
                  Breakdown is based on standard statutory compliance rules. You can override these in settings.
                </p>
                <button className="mt-6 text-xs font-bold text-emerald hover:underline">Update Rules</button>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-navy">Payroll Batch Run</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Select Month:</span>
                <select className="input-field py-1 text-xs w-32">
                  <option>February 2026</option>
                  <option>January 2026</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
              <AnimatePresence mode="wait">
                {isRunning ? (
                  <motion.div 
                    key="running"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-4"
                  >
                    <div className="w-16 h-16 border-4 border-slate-200 border-t-emerald rounded-full animate-spin mx-auto" />
                    <div>
                      <p className="font-bold text-navy">Processing Payroll Batch...</p>
                      <p className="text-xs text-slate-500 mt-1">Calculating deductions and unpaid leaves</p>
                    </div>
                  </motion.div>
                ) : showSuccess ? (
                  <motion.div 
                    key="success"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-4"
                  >
                    <div className="w-16 h-16 bg-emerald/10 text-emerald rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <p className="font-bold text-navy">Payroll Batch Completed!</p>
                      <p className="text-xs text-slate-500 mt-1">142 payslips generated successfully.</p>
                    </div>
                    <button onClick={() => setShowSuccess(false)} className="btn-secondary text-xs">Run Another Batch</button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="idle"
                    className="text-center space-y-6"
                  >
                    <div className="w-16 h-16 bg-navy/5 text-navy rounded-full flex items-center justify-center mx-auto">
                      <Play size={32} />
                    </div>
                    <div>
                      <p className="font-bold text-navy">Ready to Process February 2026</p>
                      <p className="text-xs text-slate-500 mt-1">Ensure all leave approvals are completed before running.</p>
                    </div>
                    <button onClick={handleRunPayroll} className="btn-primary flex items-center gap-2 mx-auto">
                      <Play size={18} />
                      <span>Run Payroll Batch</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-bold text-navy mb-4">Payroll Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-off-white rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-slate-400"><Users size={18} /></div>
                  <span className="text-xs font-medium text-slate-500">Total Employees</span>
                </div>
                <span className="font-bold text-navy">142</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-off-white rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-slate-400"><CreditCard size={18} /></div>
                  <span className="text-xs font-medium text-slate-500">Total Payout</span>
                </div>
                <span className="font-bold text-navy">$688,450.00</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-off-white rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-slate-400"><AlertCircle size={18} /></div>
                  <span className="text-xs font-medium text-slate-500">Pending Approvals</span>
                </div>
                <span className="font-bold text-muted-red">03</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-navy mb-4">Quick Links</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 hover:bg-off-white rounded-xl transition-all group">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-slate-400 group-hover:text-slate-blue" />
                  <span className="text-xs font-bold text-navy">Tax Reports</span>
                </div>
                <Download size={14} className="text-slate-300" />
              </button>
              <button className="w-full flex items-center justify-between p-3 hover:bg-off-white rounded-xl transition-all group">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-slate-400 group-hover:text-slate-blue" />
                  <span className="text-xs font-bold text-navy">Statutory Compliance</span>
                </div>
                <Download size={14} className="text-slate-300" />
              </button>
              <button className="w-full flex items-center justify-between p-3 hover:bg-off-white rounded-xl transition-all group">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-slate-400 group-hover:text-slate-blue" />
                  <span className="text-xs font-bold text-navy">Bank Transfer List</span>
                </div>
                <Download size={14} className="text-slate-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollModule;
