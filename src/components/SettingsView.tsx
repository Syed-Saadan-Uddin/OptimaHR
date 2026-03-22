import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  Linkedin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../types/hr';
import { UserData } from '../App';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface SettingsViewProps {
  userData: UserData;
}

const SettingsView: React.FC<SettingsViewProps> = ({ userData }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'org' | 'payroll' | 'notifications' | 'security'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Profile State
  const [displayName, setDisplayName] = useState(userData.displayName);
  const [linkedinUrl, setLinkedinUrl] = useState(userData.linkedinUrl);
  const [phone, setPhone] = useState('+1 (555) 123-4567'); // Mock phone for now

  // Sync state if userData changes from App.tsx (e.g. initial load)
  useEffect(() => {
    setDisplayName(userData.displayName);
    setLinkedinUrl(userData.linkedinUrl);
  }, [userData.displayName, userData.linkedinUrl]);

  const isAdmin = userData.role === 'HR_ADMIN';
  const isCandidate = userData.role === 'CANDIDATE';

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', userData.uid);
      await updateDoc(userRef, {
        displayName,
        linkedinUrl
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to save profile changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User, roles: ['HR_ADMIN', 'DEPT_HEAD', 'EMPLOYEE', 'CANDIDATE'] },
    { id: 'org', label: 'Organization', icon: Building2, roles: ['HR_ADMIN'] },
    { id: 'payroll', label: 'Payroll Config', icon: CreditCard, roles: ['HR_ADMIN'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['HR_ADMIN', 'DEPT_HEAD', 'EMPLOYEE', 'CANDIDATE'] },
    { id: 'security', label: 'Security', icon: Shield, roles: ['HR_ADMIN', 'DEPT_HEAD', 'EMPLOYEE', 'CANDIDATE'] },
  ];

  const filteredTabs = tabs.filter(tab => tab.roles.includes(userData.role));

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
            onClick={handleSaveProfile}
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
        <div className="lg:w-64 flex-shrink-0 space-y-1">
          {filteredTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
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
                          src={`https://picsum.photos/seed/${userData.role}/200/200`}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <button title="Change Avatar" className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-slate-100 text-slate-500 hover:text-emerald transition-all">
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
                      <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy" size={16} />
                        <input
                          type="text"
                          className="input-field pl-10"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="email" readOnly className="input-field pl-10 bg-slate-50 text-slate-400 cursor-not-allowed" value={userData.email || ''} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LinkedIn Profile URL</label>
                      <div className="relative group">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy" size={16} />
                        <input
                          type="url"
                          className="input-field pl-10"
                          placeholder="https://linkedin.com/in/username"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                        />
                      </div>
                      {isCandidate && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Tip: We'll use this to pre-fill your job applications.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                      <input
                        type="tel"
                        className="input-field"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Language</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select className="input-field pl-10">
                          <option>English (US)</option>
                          <option>Spanish</option>
                          <option>French</option>
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
                        <input type="text" title="Company Name" className="input-field" defaultValue="OptimaHR Solutions" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registration Number</label>
                        <input type="text" title="Registration Number" className="input-field" defaultValue="REG-12345678" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Headquarters Address</label>
                        <textarea title="Headquarters Address" className="input-field h-24" defaultValue="123 Enterprise Way, Tech City, State, Country - 101010" />
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
                        { label: 'Income Tax (TDS)', value: '10%' },
                        { label: 'Provident Fund (PF)', value: '12%' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-off-white rounded-xl border border-slate-100">
                          <p className="text-sm font-bold text-navy">{item.label}</p>
                          <input type="text" title={item.label} className="input-field w-24 text-right font-bold" defaultValue={item.value} />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h3 className="text-lg font-bold text-navy">Email Preferences</h3>
                  <p className="text-sm text-slate-500">Configure how and when you want to receive emails.</p>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h3 className="text-lg font-bold text-navy">Security Settings</h3>
                  <p className="text-sm text-slate-500">Manage your password and account security options.</p>
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
