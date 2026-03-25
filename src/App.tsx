import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import EmployeeDashboard from './components/EmployeeDashboard';
import DashboardView from './components/DashboardView';
import JobPortal from './components/JobPortal';
import RecruitmentView from './components/RecruitmentView';
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
import { FirebaseProvider, useFirebase } from './components/FirebaseProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';
import { Zap } from 'lucide-react';

function AppContent() {
  const { user, loading, role, setRole, userProfile, signUp, signIn } = useFirebase();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  
  // Auth states
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Force onboarding for new employees
  React.useEffect(() => {
    if (user && role === 'EMPLOYEE' && userProfile && !userProfile.onboardingCompleted && activeView !== 'onboarding') {
      setActiveView('onboarding');
    }
  }, [user, role, userProfile, activeView]);

  // Redirect CANDIDATE away from dashboard if they land there
  React.useEffect(() => {
    if (user && role === 'CANDIDATE' && activeView === 'dashboard') {
      setActiveView('job-portal');
    }
  }, [user, role, activeView]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);
    try {
      if (authMode === 'signup') {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white p-4">
        <div className="card p-8 max-w-md w-full text-center space-y-6">
          <div className="space-y-2 flex flex-col items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald rounded-lg flex items-center justify-center shadow-lg shadow-emerald/20">
                <Zap size={24} className="text-white fill-white" />
              </div>
              <h1 className="text-3xl font-bold text-navy">OptimaHR</h1>
            </div>
            <p className="text-slate-500">Enterprise Human Resource Management</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMode === 'login' ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMode === 'signup' ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
            {authMode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                className="input-field" 
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {authError && (
              <p className="text-[10px] font-bold text-muted-red bg-muted-red/5 p-2 rounded-lg border border-muted-red/10">
                {authError}
              </p>
            )}

            <button 
              type="submit" 
              disabled={isAuthLoading}
              className="btn-primary w-full py-3"
            >
              {isAuthLoading ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold"><span className="bg-white px-2 text-slate-400">Or continue with</span></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="btn-secondary w-full flex items-center justify-center gap-3 py-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
        </div>
      </div>
    );
  }

  const handleNavigate = (view: string, data?: any) => {
    setMobileMenuOpen(false);
    if (view === 'payslip' && data) {
      setSelectedPayslip(data);
      setActiveView('payslips');
    } else {
      setActiveView(view);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />;
      case 'job-portal':
        return <JobPortal role={role} onApply={(job: any) => { setSelectedJob(job); setActiveView('candidate-reg'); }} />;
      case 'candidate-reg':
        return <CandidateRegistration job={selectedJob} onComplete={() => setActiveView('applications')} />;
      case 'applications':
        return <MyApplications />;
      case 'recruitment':
        return <RecruitmentView role={role} />;
      case 'payroll':
        return <PayrollModule role={role} />;
      case 'onboarding':
        return <OnboardingWizard onComplete={() => setActiveView('dashboard')} />;
      case 'leave':
        return <LeaveManagement />;
      case 'performance':
        return <PerformanceAppraisal role={role} />;
      case 'employees':
        return <EmployeesView role={role} />;
      case 'settings':
        return <SettingsView role={role} />;
      case 'payslips':
        return selectedPayslip ? <PayslipView payslip={selectedPayslip} /> : <div className="text-center p-12 text-slate-500">No payslip selected</div>;
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
    <div className="min-h-screen bg-off-white flex overflow-x-hidden">
      <Sidebar 
        role={role} 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        activeView={activeView} 
        setActiveView={handleNavigate}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 print:ml-0 ${collapsed ? 'md:ml-20' : 'md:ml-64'} ml-0`}>
        <Header role={role} collapsed={collapsed} setMobileMenuOpen={setMobileMenuOpen} />
        
        <main className="flex-1 mt-16 p-4 md:p-8 overflow-y-auto print:mt-0 print:p-0">
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

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <AppContent />
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
