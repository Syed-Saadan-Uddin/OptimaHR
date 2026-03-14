import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  Bell, 
  Shield, 
  CreditCard, 
  Globe, 
  Mail, 
  Lock,
  Save,
  Camera,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../types/hr';

interface SettingsViewProps {
  role: UserRole;
}

const SettingsView: React.FC<SettingsViewProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'org' | 'payroll' | 'notifications' | 'security'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isAdmin = role === 'HR_ADMIN';

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User, roles: ['HR_ADMIN', 'DEPT_HEAD', 'EMPLOYEE', 'CANDIDATE'] },
    { id: 'org', label: 'Organization', icon: Building2, roles: ['HR_ADMIN'] },
    { id: 'payroll', label: 'Payroll Config', icon: CreditCard, roles: ['HR_ADMIN'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['HR_ADMIN', 'DEPT_HEAD', 'EMPLOYEE', 'CANDIDATE'] },
    { id: 'security', label: 'Security', icon: Shield, roles: ['HR_ADMIN', 'DEPT_HEAD', 'EMPLOYEE', 'CANDIDATE'] },
  ];

  const filteredTabs = tabs.filter(tab => tab.roles.includes(role));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your account preferences and system configurations.</p>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {showSuccess && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 text-emerald font-bold text-sm"
              >
                <CheckCircle2 size={18} />
                <span>Changes saved!</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary flex items-center gap-2 min-w-[140px] justify-center"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0 space-y-1">
          {filteredTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-white text-navy shadow-sm border border-slate-200' 
                    : 'text-slate-500 hover:bg-white/50 hover:text-navy'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-emerald' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="card p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div 
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-6 pb-8 border-b border-slate-100">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-md">
                        <img 
                          src={`https://picsum.photos/seed/${role}/200/200`} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-slate-100 text-slate-500 hover:text-emerald transition-all">
                        <Camera size={16} />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-navy">Profile Picture</h3>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG or GIF. Max size of 800K.</p>
                      <div className="flex gap-2 mt-3">
                        <button className="text-[10px] font-bold text-emerald hover:underline">Upload New</button>
                        <button className="text-[10px] font-bold text-muted-red hover:underline">Remove</button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" className="input-field pl-10" defaultValue="John Doe" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="email" className="input-field pl-10" defaultValue="john.doe@optimahr.com" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                      <input type="tel" className="input-field" defaultValue="+1 (555) 123-4567" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Language</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select className="input-field pl-10">
                          <option>English (US)</option>
                          <option>Spanish</option>
                          <option>French</option>
                          <option>German</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'org' && isAdmin && (
                <motion.div 
                  key="org"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-navy">Company Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Company Name</label>
                        <input type="text" className="input-field" defaultValue="OptimaHR Solutions" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registration Number</label>
                        <input type="text" className="input-field" defaultValue="REG-12345678" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Headquarters Address</label>
                        <textarea className="input-field h-24" defaultValue="123 Enterprise Way, Tech City, State, Country - 101010" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-8 border-t border-slate-100">
                    <h3 className="text-lg font-bold text-navy">Branding</h3>
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-emerald rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald/20">
                        <Building2 size={32} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy">Company Logo</p>
                        <p className="text-xs text-slate-500">This will appear on all payslips and reports.</p>
                        <button className="mt-2 text-xs font-bold text-emerald hover:underline">Change Logo</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'payroll' && isAdmin && (
                <motion.div 
                  key="payroll"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-navy">Statutory Compliance</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Income Tax (TDS)', value: '10%', desc: 'Standard deduction for all employees' },
                        { label: 'Provident Fund (PF)', value: '12%', desc: 'Employee contribution rate' },
                        { label: 'Professional Tax', value: '$20', desc: 'Fixed monthly deduction' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-off-white rounded-xl border border-slate-100">
                          <div>
                            <p className="text-sm font-bold text-navy">{item.label}</p>
                            <p className="text-[10px] text-slate-500">{item.desc}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <input type="text" className="input-field w-24 text-right font-bold" defaultValue={item.value} />
                            <button className="p-2 text-slate-400 hover:text-navy transition-all"><Lock size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div 
                  key="notifications"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-navy">Email Preferences</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Payroll Notifications', desc: 'Receive email when payslip is generated', checked: true },
                        { label: 'Leave Approvals', desc: 'Notify when leave request status changes', checked: true },
                        { label: 'Performance Reviews', desc: 'Alerts for upcoming appraisal cycles', checked: false },
                        { label: 'Company Announcements', desc: 'Stay updated with company-wide news', checked: true },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-off-white rounded-xl border border-slate-100">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-navy">{item.label}</p>
                            <p className="text-[10px] text-slate-500">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked={item.checked} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div 
                  key="security"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-navy">Password & Authentication</h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Password</label>
                        <input type="password" title="Current Password" placeholder="••••••••" className="input-field" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Password</label>
                          <input type="password" title="New Password" placeholder="••••••••" className="input-field" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm New Password</label>
                          <input type="password" title="Confirm New Password" placeholder="••••••••" className="input-field" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-navy/5 rounded-xl border border-navy/10 flex items-start gap-4">
                      <Shield className="text-navy mt-1" size={20} />
                      <div>
                        <p className="text-sm font-bold text-navy">Two-Factor Authentication (2FA)</p>
                        <p className="text-xs text-slate-500 mt-1">Add an extra layer of security to your account by enabling 2FA.</p>
                        <button className="mt-3 btn-secondary text-xs px-4 py-1.5">Enable 2FA</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
