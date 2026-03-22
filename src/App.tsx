import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, query, collection, where, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import Auth from './components/Auth';
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
import ProfileView from './components/ProfileView';
import { JobListing, UserRole, Payslip } from './types/hr';
import { Loader2 } from 'lucide-react';

export interface UserData {
  uid: string;
  email: string | null;
  displayName: string;
  role: UserRole;
  linkedinUrl: string;
  department?: string;
  employeeId?: string;
  designation?: string;
  phoneNumber?: string;
  emergencyContact?: string;
  joiningDate?: Timestamp;
  onboardingDate?: Timestamp;
  onboardingComplete?: boolean;
  address?: string;
  salary?: number;
  firstName?: string;
  lastName?: string;
  dob?: string;
}

const ROLE_ACCESS: Record<UserRole, string[]> = {
  CANDIDATE: ['job-portal', 'candidate-reg', 'applications', 'settings', 'profile'],
  EMPLOYEE: ['dashboard', 'leave', 'performance', 'payslips', 'settings', 'onboarding', 'profile'],
  DEPT_HEAD: ['dashboard', 'leave', 'performance', 'payslips', 'settings', 'recruitment', 'employees', 'profile'],
  HR_ADMIN: ['dashboard', 'leave', 'performance', 'payslips', 'settings', 'recruitment', 'employees', 'payroll', 'profile']
};

const DEFAULT_VIEWS: Record<UserRole, string> = {
  CANDIDATE: 'job-portal',
  EMPLOYEE: 'dashboard',
  DEPT_HEAD: 'dashboard',
  HR_ADMIN: 'dashboard'
};

const mockPayslip: Payslip = {
  id: 'PS-2026-001',
  employeeId: 'EMP-DEFAULT',
  month: 'January',
  year: 2026,
  gross: 4850,
  basic: 3000,
  hra: 1500,
  allowances: 350,
  deductions: 720,
  tax: 480,
  net: 4130
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  useEffect(() => {
    let unsubDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const role = data.role as UserRole;
            console.log(`User data sync: ${data.displayName} | Role: ${role}`);
            setUserData({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: data.displayName || 'User',
              role: role,
              linkedinUrl: data.linkedinUrl || '',
              department: data.department,
              employeeId: data.employeeId,
              designation: data.designation,
              phoneNumber: data.phoneNumber,
              emergencyContact: data.emergencyContact,
              joiningDate: data.joiningDate,
              onboardingDate: data.onboardingDate,
              onboardingComplete: data.onboardingComplete || false,
              address: data.address,
              salary: data.salary || 0,
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              dob: data.dob || ''
            });

            setActiveView(prev => {
              if (prev === 'dashboard' && role === 'CANDIDATE') return 'job-portal';

              // Force onboarding for new employees who haven't completed it
              if (role === 'EMPLOYEE' && !data.onboardingComplete) return 'onboarding';

              // Auto-transition out of onboarding once complete
              if (role === 'EMPLOYEE' && data.onboardingComplete && prev === 'onboarding') return 'dashboard';

              if (!ROLE_ACCESS[role] || !ROLE_ACCESS[role].includes(prev)) return DEFAULT_VIEWS[role] || 'dashboard';
              return prev;
            });
          } else {
            console.log("No user document found. Initializing as Candidate.");
            setUserData({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || 'New User',
              role: 'CANDIDATE',
              linkedinUrl: ''
            });
            setActiveView('job-portal');
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user doc:", error);
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  useEffect(() => {
    if (!user || !userData || userData.role !== 'CANDIDATE') return;

    const q = query(
      collection(db, 'applications'),
      where('candidateId', '==', user.uid),
      where('status', '==', 'Hired')
    );

    const checkHired = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty && userData.role === 'CANDIDATE') {
        const hireDoc = snapshot.docs[0].data();
        console.log("Self-promotion triggered! Candidate has been hired.");
        const userRef = doc(db, 'users', user.uid);

        const generatedId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

        updateDoc(userRef, {
          role: 'EMPLOYEE',
          status: 'Active',
          department: hireDoc.department || 'General',
          onboardingDate: serverTimestamp(),
          employeeId: generatedId,
          designation: hireDoc.jobTitle || 'Team Member'
        }).catch(err => console.error("Self-promotion failed:", err));
      }
    });

    return () => checkHired();
  }, [user, userData?.role]);

  useEffect(() => {
    // Force onboarding gate for employees
    if (userData?.role === 'EMPLOYEE' && !userData.onboardingComplete) {
      if (activeView !== 'onboarding' && activeView !== 'settings' && activeView !== 'profile') {
        console.warn("Mandatory onboarding: Redirecting to onboarding wizard.");
        setActiveView('onboarding');
      }
      return;
    }

    if (userData?.role && !ROLE_ACCESS[userData.role].includes(activeView)) {
      console.warn(`Unauthorized access attempt to ${activeView} by ${userData.role}`);
      setActiveView(DEFAULT_VIEWS[userData.role]);
    }
  }, [userData?.role, userData?.onboardingComplete, activeView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-navy animate-spin mb-4" />
        <p className="text-slate-500 font-medium anim-pulse">Initializing OptimaHR...</p>
      </div>
    );
  }

  if (!user || !userData) {
    return <Auth />;
  }

  const role = userData.role;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <EmployeeDashboard userData={userData} />;
      case 'job-portal':
        return <JobPortal role={role} onSelectJob={(job) => {
          setSelectedJob(job);
          setActiveView('candidate-reg');
        }} />;
      case 'candidate-reg':
        return <CandidateRegistration
          selectedJob={selectedJob}
          userData={userData}
          onComplete={() => setActiveView('applications')}
        />;
      case 'applications':
        return <MyApplications />;
      case 'recruitment':
        return <HRDashboard userData={userData} />;
      case 'payroll':
        return <PayrollModule />;
      case 'onboarding':
        return <OnboardingWizard role={role} />;
      case 'leave':
        return <LeaveManagement role={role} />;
      case 'performance':
        return <PerformanceAppraisal role={role} />;
      case 'payslips':
        return <PayslipView payslip={mockPayslip} />;
      case 'employees':
        return <EmployeesView role={role} />;
      case 'profile':
        return <ProfileView userData={userData} />;
      case 'settings':
        return <SettingsView userData={userData} />;
      default:
        return <EmployeeDashboard userData={userData} />;
    }
  };

  return (
    <div className="min-h-screen bg-off-white flex">
      <Sidebar
        role={role}
        onboardingComplete={userData.onboardingComplete}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        activeView={activeView}
        setActiveView={setActiveView}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <Header
          userData={userData}
          collapsed={collapsed}
          activeView={activeView}
          onSignOut={() => auth.signOut()}
        />
        <main className="flex-1 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
