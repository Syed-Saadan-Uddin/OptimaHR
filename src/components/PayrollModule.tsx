import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Play, 
  Settings, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Download,
  History,
  Users,
  X,
  Eye,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, query, where, getDocs, serverTimestamp, doc, setDoc, getDoc, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firestoreUtils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PayrollModule: React.FC<{ role?: string }> = ({ role }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [grossSalary, setGrossSalary] = useState(5000);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalPayout, setTotalPayout] = useState(0);
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState('March 2026');
  
  // New States
  const [showHistory, setShowHistory] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [payrollHistory, setPayrollHistory] = useState<any[]>([]);
  const [payrollConfig, setPayrollConfig] = useState({
    incomeTax: 10,
    providentFund: 5,
    professionalTax: 2
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  useEffect(() => {
    if (!role || role !== 'HR_ADMIN') {
      return;
    }

    // Fetch payroll settings
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'payroll'));
        if (settingsSnap.exists()) {
          setPayrollConfig(settingsSnap.data() as any);
        }
      } catch (error) {
        console.error('Error fetching payroll settings:', error);
      }
    };
    fetchSettings();

    // Fetch total employees
    const employeesQuery = query(collection(db, 'users'), where('role', 'in', ['EMPLOYEE', 'HR_ADMIN']));
    const unsubscribeEmployees = onSnapshot(employeesQuery, (snapshot) => {
      setTotalEmployees(snapshot.size);
      let payout = 0;
      snapshot.docs.forEach(doc => {
        payout += (doc.data().salary || 0);
      });
      setTotalPayout(payout);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // Fetch pending leaves
    const leavesQuery = query(collection(db, 'leaves'), where('status', '==', 'Pending'));
    const unsubscribeLeaves = onSnapshot(leavesQuery, (snapshot) => {
      setPendingLeavesCount(snapshot.size);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leaves');
    });

    // Fetch payroll history
    const historyQuery = query(collection(db, 'payslips'), orderBy('processedAt', 'desc'));
    const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
      setPayrollHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeEmployees();
      unsubscribeLeaves();
      unsubscribeHistory();
    };
  }, [role]);

  const breakdown = {
    basic: grossSalary * 0.5,
    hra: grossSalary * 0.3,
    allowances: grossSalary * 0.2,
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      await setDoc(doc(db, 'settings', 'payroll'), payrollConfig);
      setShowConfig(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleRunPayroll = async () => {
    setIsRunning(true);
    try {
      // Fetch all employees
      const employeesSnapshot = await getDocs(query(collection(db, 'users'), where('role', 'in', ['EMPLOYEE', 'HR_ADMIN'])));
      
      // Create payslips for each employee
      const batchPromises = employeesSnapshot.docs.map(async (employeeDoc) => {
        const empData = employeeDoc.data();
        const salary = empData.salary || 5000;
        const tax = (payrollConfig.incomeTax / 100) * salary;
        const pf = (payrollConfig.providentFund / 100) * salary;
        const profTax = (payrollConfig.professionalTax / 100) * salary;
        
        await addDoc(collection(db, 'payslips'), {
          employeeId: employeeDoc.id,
          employeeName: empData.name,
          month: selectedMonth,
          grossSalary: salary,
          breakdown: {
            basic: salary * 0.5,
            hra: salary * 0.3,
            allowances: salary * 0.2
          },
          deductions: {
            tax: tax,
            providentFund: pf,
            professionalTax: profTax
          },
          netSalary: salary - (tax + pf + profTax),
          status: 'Paid',
          processedAt: serverTimestamp()
        });

        // Create notification for the employee
        return addDoc(collection(db, 'notifications'), {
          userId: employeeDoc.id,
          title: 'Payroll Processed',
          message: `Your payslip for ${selectedMonth} has been generated and payment is processed.`,
          type: 'PAYROLL',
          read: false,
          createdAt: serverTimestamp()
        });
      });

      await Promise.all(batchPromises);
      setShowSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'payslips');
    } finally {
      setIsRunning(false);
    }
  };

  const downloadReport = (type: string) => {
    const filteredHistory = payrollHistory.filter(p => p.month === selectedMonth);
    if (filteredHistory.length === 0) {
      return;
    }

    let csv = '';
    if (type === 'tax') {
      csv = 'Employee Name,Month,Gross Salary,Tax Deducted\n';
      filteredHistory.forEach(p => {
        csv += `${p.employeeName},${p.month},${p.grossSalary},${p.deductions?.tax || 0}\n`;
      });
    } else if (type === 'compliance') {
      csv = 'Employee Name,Month,PF Contribution,Prof Tax\n';
      filteredHistory.forEach(p => {
        csv += `${p.employeeName},${p.month},${p.deductions?.providentFund || 0},${p.deductions?.professionalTax || 0}\n`;
      });
    } else {
      csv = 'Employee Name,Month,Net Salary,Status\n';
      filteredHistory.forEach(p => {
        csv += `${p.employeeName},${p.month},${p.netSalary},${p.status}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${type}_report_${selectedMonth.replace(' ', '_')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadPayslipPDF = (payslip: any) => {
    const doc = new jsPDF();
    const totalDeductions = (payslip.deductions?.tax || 0) + (payslip.deductions?.providentFund || 0) + (payslip.deductions?.professionalTax || 0);
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(20, 30, 70); // Navy
    doc.text('OptimaHR', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('123 Enterprise Way, Tech City', 14, 28);
    doc.text('support@optimahr.com', 14, 33);
    
    doc.setFontSize(24);
    doc.setTextColor(20, 30, 70);
    doc.text('PAYSLIP', 140, 25);
    
    doc.setFontSize(12);
    doc.text(payslip.month, 140, 35);
    
    // Employee Details
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('EMPLOYEE DETAILS', 14, 50);
    doc.line(14, 52, 100, 52);
    
    doc.setTextColor(20, 30, 70);
    doc.text(`Name: ${payslip.employeeName}`, 14, 60);
    doc.text(`Employee ID: ${payslip.employeeId.toUpperCase()}`, 14, 65);
    
    // Payment Info
    doc.setTextColor(150);
    doc.text('PAYMENT INFO', 110, 50);
    doc.line(110, 52, 196, 52);
    
    doc.setTextColor(20, 30, 70);
    doc.text(`Payment Mode: Direct Deposit`, 110, 60);
    doc.text(`Status: ${payslip.status}`, 110, 65);
    
    // Earnings & Deductions Table
    autoTable(doc, {
      startY: 80,
      head: [['Earnings', 'Amount', 'Deductions', 'Amount']],
      body: [
        ['Basic Salary', `$${payslip.breakdown?.basic?.toLocaleString() || 0}`, 'Income Tax (TDS)', `$${payslip.deductions?.tax?.toLocaleString() || 0}`],
        ['HRA', `$${payslip.breakdown?.hra?.toLocaleString() || 0}`, 'Provident Fund', `$${payslip.deductions?.providentFund?.toLocaleString() || 0}`],
        ['Allowances', `$${payslip.breakdown?.allowances?.toLocaleString() || 0}`, 'Prof Tax', `$${payslip.deductions?.professionalTax?.toLocaleString() || 0}`],
        [{ content: 'Total Earnings', styles: { fontStyle: 'bold' } }, { content: `$${payslip.grossSalary?.toLocaleString() || 0}`, styles: { fontStyle: 'bold' } }, { content: 'Total Deductions', styles: { fontStyle: 'bold' } }, { content: `$${totalDeductions.toLocaleString()}`, styles: { fontStyle: 'bold' } }]
      ],
      theme: 'striped',
      headStyles: { fillColor: [20, 30, 70] }
    });
    
    // Net Salary
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFillColor(20, 30, 70);
    doc.rect(14, finalY, 182, 30, 'F');
    
    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.text('NET PAYABLE AMOUNT', 20, finalY + 10);
    doc.setFontSize(24);
    doc.text(`$${payslip.netSalary?.toLocaleString() || 0}`, 20, finalY + 22);
    
    doc.setFontSize(8);
    doc.text('Digitally Verified', 160, finalY + 22);
    
    // Footer
    doc.setTextColor(150);
    doc.setFontSize(8);
    doc.text('This is a system-generated payslip and does not require a physical signature.', 105, 280, { align: 'center' });
    
    doc.save(`Payslip_${payslip.employeeName}_${payslip.month}.pdf`);
  };

  if (role !== 'HR_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
        <div className="w-16 h-16 bg-muted-red/10 text-muted-red rounded-full flex items-center justify-center">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-navy">Access Denied</h2>
        <p className="text-slate-500 max-w-md">You do not have permission to access the Payroll Automation module. Please contact your HR administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Payroll Automation</h1>
          <p className="text-slate-500 text-sm mt-1">Configure salary structures and run monthly batches.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setShowHistory(true)}
            className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2"
          >
            <History size={18} />
            <span>History</span>
          </button>
          <button 
            onClick={() => setShowConfig(true)}
            className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2"
          >
            <Settings size={18} />
            <span>Config</span>
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

              <div className="p-4 bg-emerald/5 rounded-2xl border border-emerald/10 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-emerald/10 rounded-full flex items-center justify-center text-emerald mb-4">
                  <CreditCard size={24} />
                </div>
                <h4 className="font-bold text-navy text-sm">Auto-Calculated Breakdown</h4>
                <p className="text-[10px] text-slate-500 mt-2">
                  Breakdown is based on standard statutory compliance rules.
                </p>
                <button 
                  onClick={() => setShowConfig(true)}
                  className="mt-4 text-[10px] font-bold text-emerald hover:underline"
                >
                  Update Rules
                </button>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-navy">Payroll Batch Run</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Select Month:</span>
                <select 
                  className="input-field py-1 text-xs w-32"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option>March 2026</option>
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
                      <p className="text-xs text-slate-500 mt-1">{totalEmployees} payslips generated successfully.</p>
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
                      <p className="font-bold text-navy">Ready to Process {selectedMonth}</p>
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
                <span className="font-bold text-navy">{totalEmployees}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-off-white rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-slate-400"><CreditCard size={18} /></div>
                  <span className="text-xs font-medium text-slate-500">Total Payout</span>
                </div>
                <span className="font-bold text-navy">${totalPayout.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-off-white rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-slate-400"><AlertCircle size={18} /></div>
                  <span className="text-xs font-medium text-slate-500">Pending Approvals</span>
                </div>
                <span className={`font-bold ${pendingLeavesCount > 0 ? 'text-muted-red' : 'text-emerald'}`}>
                  {pendingLeavesCount.toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-navy mb-4">Quick Links</h3>
            <div className="space-y-2">
              <button 
                onClick={() => downloadReport('tax')}
                className="w-full flex items-center justify-between p-3 hover:bg-off-white rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-slate-400 group-hover:text-slate-blue" />
                  <span className="text-xs font-bold text-navy">Tax Reports</span>
                </div>
                <Download size={14} className="text-slate-300" />
              </button>
              <button 
                onClick={() => downloadReport('compliance')}
                className="w-full flex items-center justify-between p-3 hover:bg-off-white rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-slate-400 group-hover:text-slate-blue" />
                  <span className="text-xs font-bold text-navy">Statutory Compliance</span>
                </div>
                <Download size={14} className="text-slate-300" />
              </button>
              <button 
                onClick={() => downloadReport('bank')}
                className="w-full flex items-center justify-between p-3 hover:bg-off-white rounded-xl transition-all group"
              >
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

      {/* Modals */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-off-white/50">
                <div>
                  <h3 className="text-xl font-bold text-navy">Payroll History</h3>
                  <p className="text-xs text-slate-500">View all processed payslips across the organization.</p>
                </div>
                <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-navy">
                  <X size={24} />
                </button>
              </div>

              <div className="p-4 border-b border-slate-100 bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by employee name or month..." 
                    className="input-field !pl-10 py-2 text-sm"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar">
                {/* Desktop Table */}
                <table className="hidden md:table w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-off-white z-10">
                    <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Month</th>
                      <th className="px-6 py-4">Gross</th>
                      <th className="px-6 py-4">Net Salary</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payrollHistory
                      .filter(p => 
                        p.employeeName.toLowerCase().includes(historySearch.toLowerCase()) || 
                        p.month.toLowerCase().includes(historySearch.toLowerCase())
                      )
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-off-white transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-navy">{p.employeeName}</span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600">{p.month}</td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-600">${p.grossSalary.toLocaleString()}</td>
                          <td className="px-6 py-4 text-xs font-bold text-emerald">${p.netSalary.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className="badge badge-success">{p.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setSelectedPayslip(p)}
                              className="p-2 text-slate-400 hover:text-slate-blue hover:bg-slate-blue/5 rounded-lg transition-all"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {/* Mobile List */}
                <div className="md:hidden divide-y divide-slate-100">
                  {payrollHistory
                    .filter(p => 
                      p.employeeName.toLowerCase().includes(historySearch.toLowerCase()) || 
                      p.month.toLowerCase().includes(historySearch.toLowerCase())
                    )
                    .map((p) => (
                      <div key={p.id} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-navy">{p.employeeName}</p>
                          <p className="text-[10px] text-slate-500">{p.month} • <span className="text-emerald font-bold">${p.netSalary.toLocaleString()}</span></p>
                        </div>
                        <button 
                          onClick={() => setSelectedPayslip(p)}
                          className="p-2 text-slate-400"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {selectedPayslip && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-2xl p-4 sm:p-8 space-y-6 sm:space-y-8 max-h-[90vh] overflow-auto"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-3 sm:gap-4 items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald/10 text-emerald rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-navy">Payslip - {selectedPayslip.month}</h3>
                    <p className="text-xs sm:text-sm text-slate-500">{selectedPayslip.employeeName}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPayslip(null)} className="text-slate-400 hover:text-navy">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Earnings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Basic Salary</span>
                      <span className="font-bold text-navy">${selectedPayslip.breakdown?.basic?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">HRA</span>
                      <span className="font-bold text-navy">${selectedPayslip.breakdown?.hra?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Allowances</span>
                      <span className="font-bold text-navy">${selectedPayslip.breakdown?.allowances?.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-bold">
                      <span className="text-navy">Gross Total</span>
                      <span className="text-navy">${selectedPayslip.grossSalary?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deductions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Income Tax</span>
                      <span className="font-bold text-muted-red">-${selectedPayslip.deductions?.tax?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Provident Fund</span>
                      <span className="font-bold text-muted-red">-${selectedPayslip.deductions?.providentFund?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Professional Tax</span>
                      <span className="font-bold text-muted-red">-${selectedPayslip.deductions?.professionalTax?.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-bold">
                      <span className="text-navy">Total Deductions</span>
                      <span className="text-muted-red">
                        -${((selectedPayslip.deductions?.tax || 0) + (selectedPayslip.deductions?.providentFund || 0) + (selectedPayslip.deductions?.professionalTax || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 bg-emerald/5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] font-bold text-emerald uppercase tracking-widest">Net Payable Salary</p>
                  <p className="text-2xl sm:text-3xl font-bold text-navy mt-1">${selectedPayslip.netSalary?.toLocaleString()}</p>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-[10px] text-slate-500">Status</p>
                  <span className="badge badge-success mt-1">{selectedPayslip.status}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => downloadPayslipPDF(selectedPayslip)}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  <span>Download PDF</span>
                </button>
                <button onClick={() => setSelectedPayslip(null)} className="btn-primary flex-1">Close</button>
              </div>
            </motion.div>
          </div>
        )}

        {showConfig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-md p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-navy">Payroll Configuration</h3>
                <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-navy">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Income Tax (%)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={payrollConfig.incomeTax}
                    onChange={(e) => setPayrollConfig({ ...payrollConfig, incomeTax: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Provident Fund (%)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={payrollConfig.providentFund}
                    onChange={(e) => setPayrollConfig({ ...payrollConfig, providentFund: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Professional Tax (%)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={payrollConfig.professionalTax}
                    onChange={(e) => setPayrollConfig({ ...payrollConfig, professionalTax: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowConfig(false)} className="btn-secondary flex-1">Cancel</button>
                <button 
                  onClick={handleSaveConfig} 
                  disabled={isSavingConfig}
                  className="btn-primary flex-1"
                >
                  {isSavingConfig ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PayrollModule;
