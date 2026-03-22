import React from 'react';
import {
  Users,
  UserPlus,
  Calendar,
  BarChart2,
  CreditCard,
  Briefcase,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap
} from 'lucide-react';
import { UserRole } from '../types/hr';

import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface SidebarProps {
  role: UserRole | null;
  onboardingComplete?: boolean;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  activeView: string;
  setActiveView: (v: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, onboardingComplete, collapsed, setCollapsed, activeView, setActiveView }) => {
  const handleSignOut = () => signOut(auth);
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['HR_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'] },
    { id: 'job-portal', label: 'Job Portal', icon: Briefcase, roles: ['CANDIDATE', 'HR_ADMIN', 'DEPT_HEAD'] },
    { id: 'applications', label: 'My Applications', icon: CreditCard, roles: ['CANDIDATE'] },
    { id: 'recruitment', label: 'Recruitment', icon: UserPlus, roles: ['HR_ADMIN', 'DEPT_HEAD'] },
    { id: 'onboarding', label: 'Onboarding', icon: UserPlus, roles: ['EMPLOYEE'] },
    { id: 'leave', label: 'Leave Management', icon: Calendar, roles: ['HR_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'] },
    { id: 'performance', label: 'Performance', icon: BarChart2, roles: ['HR_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'] },
    { id: 'payroll', label: 'Payroll', icon: CreditCard, roles: ['HR_ADMIN'] },
    { id: 'payslips', label: 'My Payslips', icon: CreditCard, roles: ['HR_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'] },
    { id: 'employees', label: 'Employees', icon: Users, roles: ['HR_ADMIN', 'DEPT_HEAD'] },
    { id: 'profile', label: 'My Profile', icon: Users, roles: ['CANDIDATE', 'HR_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['HR_ADMIN', 'DEPT_HEAD', 'EMPLOYEE', 'CANDIDATE'] },
  ];

  const filteredItems = menuItems.filter(item => {
    if (!role) return false;
    const hasRole = item.roles.includes(role);
    if (!hasRole) return false;

    // Enforcement Gate: If employee hasn't finished onboarding, hide other functional tabs
    if (role === 'EMPLOYEE' && !onboardingComplete) {
      return ['onboarding', 'settings', 'profile'].includes(item.id);
    }

    return true;
  });

  return (
    <div className={`bg-navy text-white transition-all duration-300 flex flex-col h-screen fixed left-0 top-0 z-50 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald/20">
          <Zap size={20} className="text-white fill-white" />
        </div>
        {!collapsed && <span className="text-xl font-bold tracking-tight">OptimaHR</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1 hover:bg-white/10 rounded-lg transition-colors ${collapsed ? 'mx-auto' : 'ml-auto'}`}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                ? 'bg-emerald text-white shadow-lg shadow-emerald/20'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-muted-red/10 hover:text-muted-red transition-all"
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
