import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { UserRole } from '../types/hr';
import { UserData } from '../App';

interface HeaderProps {
  userData: UserData | null;
  collapsed: boolean;
  activeView: string;
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ userData, collapsed }) => {
  const roleLabels: Record<UserRole, string> = {
    HR_ADMIN: 'HR Administrator',
    DEPT_HEAD: 'Department Head',
    EMPLOYEE: 'Employee',
    CANDIDATE: 'Candidate',
  };

  const role = userData?.role || null;
  const currentRoleLabel = role ? roleLabels[role] : 'Guest';
  const displayName = userData?.displayName || (role === 'CANDIDATE' ? 'Guest Candidate' : 'New User');
  const email = userData?.email || 'No email';

  return (
    <header className={`h-16 bg-white border-b border-slate-200 fixed top-0 right-0 z-40 flex items-center justify-between px-8 transition-all duration-300 ${collapsed ? 'left-20' : 'left-64'}`}>
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search employees, tasks, or documents..."
          className="w-full pl-10 pr-4 py-2 bg-off-white border-none rounded-xl text-sm focus:ring-2 focus:ring-slate-blue/10 outline-none"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className={`badge ${role === 'HR_ADMIN' ? 'badge-info' :
            role === 'DEPT_HEAD' ? 'badge-warning' :
              role === 'EMPLOYEE' ? 'badge-success' : 'badge-info'
            }`}>
            {currentRoleLabel}
          </span>
        </div>

        <button className="p-2 text-slate-400 hover:bg-off-white rounded-full relative transition-all">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-muted-red rounded-full border-2 border-white" />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <button className="flex items-center gap-3 pl-2 pr-1 py-1 hover:bg-off-white rounded-full transition-all">
          <div className="text-right">
            <p className="text-xs font-bold text-navy">
              {displayName}
            </p>
            <p className="text-[10px] text-slate-500 overflow-hidden text-ellipsis max-w-[120px] whitespace-nowrap">
              {email}
            </p>
          </div>
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden border border-slate-200">
            <img
              src={`https://picsum.photos/seed/${role || 'guest'}/100/100`}
              alt="User"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </button>
      </div>
    </header>
  );
};

export default Header;
