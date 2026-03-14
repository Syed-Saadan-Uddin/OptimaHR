import React from 'react';
import { Download, Printer, Shield, FileText, Zap } from 'lucide-react';
import { Payslip } from '../types/hr';

const PayslipView: React.FC<{ payslip: Payslip }> = ({ payslip }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Payslip Detail</h1>
          <p className="text-slate-500 text-sm mt-1">Reference: {payslip.id}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Printer size={18} />
            <span>Print</span>
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download size={18} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      <div className="card bg-white p-12 shadow-2xl relative overflow-hidden">
        {/* Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none rotate-[-30deg]">
          <h2 className="text-9xl font-bold text-navy">OptimaHR</h2>
        </div>

        <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
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
          <div className="text-right space-y-2">
            <h2 className="text-3xl font-bold text-navy uppercase tracking-tighter">Payslip</h2>
            <p className="text-sm font-bold text-slate-400">{payslip.month} {payslip.year}</p>
            <span className="badge badge-success">Paid on Feb 01, 2026</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12">
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Employee Details</h4>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <span className="text-slate-500">Name:</span>
              <span className="font-bold text-navy">John Doe</span>
              <span className="text-slate-500">Employee ID:</span>
              <span className="font-bold text-navy">EMP-2026-042</span>
              <span className="text-slate-500">Department:</span>
              <span className="font-bold text-navy">Engineering</span>
              <span className="text-slate-500">Designation:</span>
              <span className="font-bold text-navy">Senior Developer</span>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Payment Info</h4>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <span className="text-slate-500">Bank Name:</span>
              <span className="font-bold text-navy">Global Trust Bank</span>
              <span className="text-slate-500">Account No:</span>
              <span className="font-bold text-navy">**** **** 4582</span>
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-bold text-navy">Direct Deposit</span>
              <span className="text-slate-500">Days Worked:</span>
              <span className="font-bold text-navy">22 / 22</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12">
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-emerald uppercase tracking-widest border-b border-emerald/10 pb-2">Earnings</h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Basic Salary</span>
                <span className="font-bold text-navy">${payslip.basic.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">HRA (House Rent Allowance)</span>
                <span className="font-bold text-navy">${payslip.hra.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Special Allowances</span>
                <span className="font-bold text-navy">${payslip.allowances.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-100 font-bold text-sm">
                <span className="text-navy">Total Earnings</span>
                <span className="text-navy">${payslip.gross.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-muted-red uppercase tracking-widest border-b border-muted-red/10 pb-2">Deductions</h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Income Tax (TDS)</span>
                <span className="font-bold text-navy">${payslip.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Provident Fund</span>
                <span className="font-bold text-navy">$240.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Unpaid Leave Deduction</span>
                <span className="font-bold text-muted-red">$0.00</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-100 font-bold text-sm">
                <span className="text-navy">Total Deductions</span>
                <span className="text-navy">${(payslip.tax + 240).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-navy text-white p-8 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Net Payable Amount</p>
            <p className="text-4xl font-bold mt-1">${payslip.net.toLocaleString()}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs font-medium opacity-80 italic">"Five Thousand Eight Hundred Fifty Dollars Only"</p>
            <div className="flex items-center gap-2 justify-end mt-4">
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
