import React from 'react';
import { Download, Printer, Shield, FileText, Zap } from 'lucide-react';
import { Payslip } from '../types/hr';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PayslipView: React.FC<{ payslip: Payslip }> = ({ payslip }) => {
  const totalDeductions = payslip.deductions.tax + payslip.deductions.providentFund + (payslip.deductions.unpaidLeave || 0);

  const downloadPDF = () => {
    const doc = new jsPDF();
    
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
        ['Basic Salary', `$${payslip.breakdown.basic.toLocaleString()}`, 'Income Tax (TDS)', `$${payslip.deductions.tax.toLocaleString()}`],
        ['HRA', `$${payslip.breakdown.hra.toLocaleString()}`, 'Provident Fund', `$${payslip.deductions.providentFund.toLocaleString()}`],
        ['Allowances', `$${payslip.breakdown.allowances.toLocaleString()}`, 'Unpaid Leave', `$${(payslip.deductions.unpaidLeave || 0).toLocaleString()}`],
        [{ content: 'Total Earnings', styles: { fontStyle: 'bold' } }, { content: `$${payslip.grossSalary.toLocaleString()}`, styles: { fontStyle: 'bold' } }, { content: 'Total Deductions', styles: { fontStyle: 'bold' } }, { content: `$${totalDeductions.toLocaleString()}`, styles: { fontStyle: 'bold' } }]
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
    doc.text(`$${payslip.netSalary.toLocaleString()}`, 20, finalY + 22);
    
    doc.setFontSize(8);
    doc.text('Digitally Verified', 160, finalY + 22);
    
    // Footer
    doc.setTextColor(150);
    doc.setFontSize(8);
    doc.text('This is a system-generated payslip and does not require a physical signature.', 105, 280, { align: 'center' });
    
    doc.save(`Payslip_${payslip.employeeName}_${payslip.month}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-navy">Payslip Detail</h1>
          <p className="text-slate-500 text-sm mt-1">Reference: {payslip.id}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => {
              window.focus();
              window.print();
            }}
            className="btn-secondary flex items-center gap-2 flex-1 sm:flex-none justify-center"
          >
            <Printer size={18} />
            <span>Print</span>
          </button>
          <button 
            onClick={downloadPDF}
            className="btn-primary flex items-center gap-2 flex-1 sm:flex-none justify-center"
          >
            <Download size={18} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      <div className="card bg-white p-6 sm:p-12 shadow-2xl relative overflow-hidden print:shadow-none print:p-0 print:border-none">
        {/* Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none rotate-[-30deg]">
          <h2 className="text-6xl sm:text-9xl font-bold text-navy">OptimaHR</h2>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-100 pb-8 mb-8 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald rounded-lg flex items-center justify-center shadow-lg shadow-emerald/20">
                <Zap size={24} className="text-white fill-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-navy">OptimaHR</span>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p>123 Enterprise Way, Tech City</p>
              <p>State, Country - 101010</p>
              <p>support@optimahr.com</p>
            </div>
          </div>
          <div className="text-left sm:text-right space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy uppercase tracking-tighter">Payslip</h2>
            <p className="text-sm font-bold text-slate-400">{payslip.month}</p>
            <span className={`badge ${payslip.status === 'Paid' ? 'badge-success' : 'bg-amber-100 text-amber-700'}`}>
              {payslip.status === 'Paid' ? 'Paid' : 'Pending'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 mb-12">
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Employee Details</h4>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <span className="text-slate-500">Name:</span>
              <span className="font-bold text-navy">{payslip.employeeName}</span>
              <span className="text-slate-500">Employee ID:</span>
              <span className="font-bold text-navy">{payslip.employeeId.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Payment Info</h4>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-bold text-navy">Direct Deposit</span>
              <span className="text-slate-500">Status:</span>
              <span className="font-bold text-navy">{payslip.status}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 mb-12">
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-emerald uppercase tracking-widest border-b border-emerald/10 pb-2">Earnings</h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Basic Salary</span>
                <span className="font-bold text-navy">${payslip.breakdown.basic.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">HRA (House Rent Allowance)</span>
                <span className="font-bold text-navy">${payslip.breakdown.hra.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Special Allowances</span>
                <span className="font-bold text-navy">${payslip.breakdown.allowances.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-100 font-bold text-sm">
                <span className="text-navy">Total Earnings</span>
                <span className="text-navy">${payslip.grossSalary.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-muted-red uppercase tracking-widest border-b border-muted-red/10 pb-2">Deductions</h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Income Tax (TDS)</span>
                <span className="font-bold text-navy">${payslip.deductions.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Provident Fund</span>
                <span className="font-bold text-navy">${payslip.deductions.providentFund.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Unpaid Leave Deduction</span>
                <span className="font-bold text-muted-red">${(payslip.deductions.unpaidLeave || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-100 font-bold text-sm">
                <span className="text-navy">Total Deductions</span>
                <span className="text-navy">${totalDeductions.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-navy text-white p-6 sm:p-8 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Net Payable Amount</p>
            <p className="text-3xl sm:text-4xl font-bold mt-1">${payslip.netSalary.toLocaleString()}</p>
          </div>
          <div className="text-left sm:text-right space-y-1 w-full sm:w-auto">
            <div className="flex items-center gap-2 justify-start sm:justify-end mt-0 sm:mt-4">
              <Shield size={16} className="text-emerald" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Digitally Verified</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400">This is a system-generated payslip and does not require a physical signature.</p>
        </div>
      </div>
    </div>
  );
};

export default PayslipView;
