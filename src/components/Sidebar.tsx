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
import { useFirebase } from './FirebaseProvider';

interface SidebarProps {
  role: UserRole;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  activeView: string;
  setActiveView: (v: string) => void;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (v: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  role, 
  collapsed, 
  setCollapsed, 
  activeView, 
  setActiveView,
  mobileMenuOpen,
  setMobileMenuOpen
}) => {
  const { logout, userProfile } = useFirebase();
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['HR_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'] },
    { id: 'job-portal', label: 'Job Portal', icon: Briefcase, roles: ['CANDIDATE', 'HR_ADMIN', 'DEPT_HEAD'] },
    { id: 'applications', label: 'My Applications', icon: CreditCard, roles: ['CANDIDATE'] },
    { id: 'recruitment', label: 'Recruitment', icon: UserPlus, roles: ['HR_ADMIN', 'DEPT_HEAD'] },
    { id: 'onboarding', label: 'Onboarding', icon: UserPlus, roles: ['HR_ADMIN', 'EMPLOYEE'], hideIfOnboarded: true },
    { id: 'leave', label: 'Leave Management', icon: Calendar, roles: ['HR_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'] },
    { id: 'performance', label: 'Performance', icon: BarChart2, roles: ['HR_ADMIN', 'DEPT_HEAD', 'EMPLOYEE'] },
    { id: 'payroll', label: 'Payroll', icon: CreditCard, roles: ['HR_ADMIN'] },
    { id: 'employees', label: 'Employees', icon: Users, roles: ['HR_ADMIN', 'DEPT_HEAD'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['HR_ADMIN', 'DEPT_HEAD', 'EMPLOYEE', 'CANDIDATE'] },
  ];

  const filteredItems = menuItems.filter(item => {
    const hasRole = item.roles.includes(role);
    if (!hasRole) return false;
    if ((item as any).hideIfOnboarded && userProfile?.onboardingCompleted) return false;
    return true;
  });

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-[55] md:hidden"
          onClick={() => setMobileMenuOpen?.(false)}
        />
      )}

      <div className={`
        bg-navy text-white transition-all duration-300 flex flex-col h-screen fixed left-0 top-0 z-[60] print:hidden
        ${collapsed ? 'w-20' : 'w-64'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className={`${collapsed ? 'p-4' : 'p-6'} flex ${collapsed ? 'flex-col gap-4 items-center' : 'items-center gap-3'}`}>
          <div className="w-8 h-8 bg-emerald rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald/20">
            <Zap size={20} className="text-white fill-white" />
          </div>
          {!collapsed && <span className="text-xl font-bold tracking-tight truncate">OptimaHR</span>}
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className={`p-1 hover:bg-white/10 rounded-lg transition-colors hidden md:block ${collapsed ? '' : 'ml-auto'}`}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          
          {/* Mobile Close Button */}
          <button 
            onClick={() => setMobileMenuOpen?.(false)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors md:hidden ml-auto"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                setMobileMenuOpen?.(false);
              }}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-4 px-3'} py-3 rounded-xl text-sm font-medium transition-all ${
                isActive 
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
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-4 px-3'} py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-muted-red/10 hover:text-muted-red transition-all`}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  </>
);
};

export default Sidebar;
