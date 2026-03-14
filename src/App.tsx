import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import EmployeeDashboard from './components/EmployeeDashboard';
import JobPortal from './components/JobPortal';
import HRDashboard from './components/HRDashboard';
import PayrollModule from './components/PayrollModule';
import OnboardingWizard from './components/OnboardingWizard';
import LeaveManagement from './components/LeaveManagement';
import PerformanceAppraisal from './components/PerformanceAppraisal';
import PayslipView from './components/PayslipView';
import CandidateRegistration from './components/CandidateRegistration';
import EmployeesView from './components/EmployeesView';
import MyApplications from './components/MyApplications';
import SettingsView from './components/SettingsView';
import { UserRole } from './types/hr';

export default function App() {
  const [role, setRole] = useState<UserRole>('HR_ADMIN');
  const [collapsed, setCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <EmployeeDashboard />;
      case 'job-portal':
        return <JobPortal role={role} onApply={(job) => setActiveView('candidate-reg')} />;
      case 'candidate-reg':
        return <CandidateRegistration onComplete={() => setActiveView('applications')} />;
      case 'applications':
        return <MyApplications />;
      case 'recruitment':
        return <HRDashboard />;
      case 'payroll':
        return <PayrollModule />;
      case 'onboarding':
        return <OnboardingWizard />;
      case 'leave':
        return <LeaveManagement />;
      case 'performance':
        return <PerformanceAppraisal role={role} />;
      case 'employees':
        return <EmployeesView role={role} />;
      case 'settings':
        return <SettingsView role={role} />;
      case 'payslips':
        return (
          <PayslipView 
            payslip={{
              id: 'PS-2026-02-001',
              month: 'February',
              year: 2026,
              gross: 6500,
              basic: 3250,
              hra: 1950,
              allowances: 1300,
              deductions: 650,
              tax: 410,
              net: 5850
            }} 
          />
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-navy rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-navy">Module Under Development</h2>
            <p className="text-slate-500 text-sm mt-2 max-w-xs">
              We're building the {activeView.replace('-', ' ')} module to meet enterprise standards.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-off-white flex">
      <Sidebar 
        role={role} 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        activeView={activeView} 
        setActiveView={setActiveView} 
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <Header role={role} collapsed={collapsed} />
        
        <main className="flex-1 mt-16 p-8 overflow-y-auto">
          {/* Role Switcher for Demo */}
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 bg-white p-3 rounded-2xl shadow-2xl border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Switch Role (Demo)</p>
            <div className="flex gap-2">
              {(['HR_ADMIN', 'DEPT_HEAD', 'EMPLOYEE', 'CANDIDATE'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setActiveView(r === 'CANDIDATE' ? 'job-portal' : 'dashboard');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                    role === r ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeView + role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
