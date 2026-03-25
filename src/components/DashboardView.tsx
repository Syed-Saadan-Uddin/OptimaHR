import React from 'react';
import { useFirebase } from './FirebaseProvider';
import EmployeeDashboard from './EmployeeDashboard';
import HRDashboard from './HRDashboard';

const DashboardView: React.FC<{ onNavigate?: (tab: string, data?: any) => void }> = ({ onNavigate }) => {
  const { role } = useFirebase();

  if (role === 'HR_ADMIN' || role === 'DEPT_HEAD') {
    return <HRDashboard onNavigate={onNavigate} />;
  }

  return <EmployeeDashboard onNavigate={onNavigate} />;
};

export default DashboardView;
