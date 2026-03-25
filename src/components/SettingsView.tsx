import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  Bell, 
  Shield, 
  ShieldCheck,
  CreditCard, 
  Globe, 
  Mail, 
  Phone,
  Hash,
  Lock,
  Save,
  Camera,
  CheckCircle2,
  Database,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../types/hr';
import { seedDatabase } from '../seedData';
import { useFirebase } from './FirebaseProvider';
import { doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { handleFirestoreError, OperationType } from '../firestoreUtils';

interface SettingsViewProps {
  role: UserRole;
}

const SettingsView: React.FC<SettingsViewProps> = ({ role }) => {
  const { user, userProfile } = useFirebase();
  const [activeTab, setActiveTab] = useState<'profile' | 'org' | 'payroll' | 'notifications' | 'security'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Profile State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    language: 'English (US)',
    photoURL: ''
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm({
          ...profileForm,
          photoURL: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Org State
  const [orgForm, setOrgForm] = useState({
    companyName: '',
    registrationNumber: '',
    headquartersAddress: '',
    logoURL: ''
  });
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOrgForm({
          ...orgForm,
          logoURL: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDeptName, setNewDeptName] = useState('');

  // Payroll State
  const [payrollForm, setPayrollForm] = useState({
    incomeTax: '10%',
    providentFund: '12%',
    professionalTax: '$20'
  });

  // Notifications State
  const [notificationPrefs, setNotificationPrefs] = useState({
    payroll: true,
    leave: true,
    performance: false,
    announcements: true
  });

  // Security State
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const isAdmin = role === 'HR_ADMIN';

  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        language: userProfile.language || 'English (US)',
        photoURL: userProfile.photoURL || `https://picsum.photos/seed/${role}/200/200`
      });
      if (userProfile.notifications) {
        setNotificationPrefs(userProfile.notifications);
      }
    }
  }, [userProfile]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (isAdmin) {
        const orgSnap = await getDoc(doc(db, 'settings', 'organization'));
        if (orgSnap.exists()) {
          const data = orgSnap.data();
          setOrgForm({
            companyName: data.companyName || '',
            registrationNumber: data.registrationNumber || '',
            headquartersAddress: data.headquartersAddress || '',
            logoURL: data.logoURL || ''
          });
          setDepartments(data.departments || []);
        }

        const payrollSnap = await getDoc(doc(db, 'settings', 'payroll'));
        if (payrollSnap.exists()) setPayrollForm(payrollSnap.data() as any);
      }
    };
    fetchSettings();
  }, [isAdmin]);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedDatabase();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Seeding failed', error);
      setError('Seeding failed. Check console.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);
    try {
      if (activeTab === 'profile') {
        await updateDoc(doc(db, 'users', user.uid), {
          ...profileForm,
          updatedAt: serverTimestamp()
        });
      } else if (activeTab === 'org' && isAdmin) {
        await setDoc(doc(db, 'settings', 'organization'), {
          ...orgForm,
          departments,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else if (activeTab === 'payroll' && isAdmin) {
        await setDoc(doc(db, 'settings', 'payroll'), {
          ...payrollForm,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else if (activeTab === 'notifications') {
        await updateDoc(doc(db, 'users', user.uid), {
          notifications: notificationPrefs,
          updatedAt: serverTimestamp()
        });
      } else if (activeTab === 'security') {
        if (securityForm.newPassword !== securityForm.confirmPassword) {
          throw new Error('New passwords do not match');
        }
        if (securityForm.newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        // Re-authenticate user before password update
        const credential = EmailAuthProvider.credential(user.email!, securityForm.currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, securityForm.newPassword);
        setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      const path = activeTab === 'profile' || activeTab === 'notifications' ? `users/${user.uid}` : `settings/${activeTab === 'org' ? 'organization' : 'payroll'}`;
      const op = activeTab === 'profile' || activeTab === 'notifications' ? OperationType.UPDATE : OperationType.WRITE;
      
      handleFirestoreError(err, op, path);
      setError(err.message || 'Failed to save changes');
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

  const filteredTabs = tabs.filter(tab => tab.roles.includes(role));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your account preferences and system configurations.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <AnimatePresence>
            {(error || showSuccess) && (
              <div className="flex flex-col gap-1">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-2 text-muted-red font-bold text-sm"
                  >
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </motion.div>
                )}
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
              </div>
            )}
          </AnimatePresence>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary w-full sm:w-auto flex items-center gap-2 min-w-[140px] justify-center"
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
        <div className="lg:w-64 flex-shrink-0 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
          {filteredTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-shrink-0 lg:flex-shrink flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
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
          <div className="card p-4 sm:p-8">
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
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-slate-100">
                        <img 
                          src={profileForm.photoURL} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-slate-100 text-slate-500 hover:text-emerald transition-all"
                      >
                        <Camera size={16} />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-navy">Profile Picture</h3>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG or GIF. Max size of 800K.</p>
                      <div className="flex gap-2 mt-3">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[10px] font-bold text-emerald hover:underline"
                        >
                          Upload New
                        </button>
                        <button 
                          onClick={() => setProfileForm({ ...profileForm, photoURL: `https://picsum.photos/seed/${role}/200/200` })}
                          className="text-[10px] font-bold text-muted-red hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="text" 
                            className="input-field !pl-12" 
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="email" 
                            className="input-field !pl-12 bg-slate-50" 
                            value={profileForm.email}
                            disabled
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Email cannot be changed directly.</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="tel" 
                            className="input-field !pl-12" 
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Language</label>
                        <div className="relative">
                          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <select 
                            className="input-field !pl-12"
                            value={profileForm.language}
                            onChange={(e) => setProfileForm({ ...profileForm, language: e.target.value })}
                          >
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
                        <div className="relative">
                          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="text" 
                            className="input-field !pl-12" 
                            value={orgForm.companyName}
                            onChange={(e) => setOrgForm({ ...orgForm, companyName: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registration Number</label>
                        <div className="relative">
                          <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="text" 
                            className="input-field !pl-12" 
                            value={orgForm.registrationNumber}
                            onChange={(e) => setOrgForm({ ...orgForm, registrationNumber: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Headquarters Address</label>
                        <textarea 
                          className="input-field h-24" 
                          value={orgForm.headquartersAddress}
                          onChange={(e) => setOrgForm({ ...orgForm, headquartersAddress: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-8 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-navy">Departments</h3>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="New department..." 
                          className="input-field py-1.5 text-xs w-48"
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                        />
                        <button 
                          onClick={() => {
                            if (newDeptName.trim() && !departments.includes(newDeptName.trim())) {
                              setDepartments([...departments, newDeptName.trim()]);
                              setNewDeptName('');
                            }
                          }}
                          className="btn-primary py-1.5 px-4 text-xs"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {departments.map((dept, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 group">
                          <span className="text-xs font-medium text-navy">{dept}</span>
                          <button 
                            onClick={() => setDepartments(departments.filter((_, index) => index !== i))}
                            className="text-slate-400 hover:text-muted-red opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      ))}
                      {departments.length === 0 && (
                        <p className="col-span-full text-center py-4 text-xs text-slate-400 italic">No departments added yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-8 border-t border-slate-100">
                    <h3 className="text-lg font-bold text-navy">Branding</h3>
                    <div className="flex items-center gap-6">
                      <input 
                        type="file" 
                        ref={logoInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                      <div className="w-16 h-16 bg-emerald rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald/20 overflow-hidden">
                        {orgForm.logoURL ? (
                          <img src={orgForm.logoURL} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 size={32} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy">Company Logo</p>
                        <p className="text-xs text-slate-500">This will appear on all payslips and reports.</p>
                        <button 
                          onClick={() => logoInputRef.current?.click()}
                          className="mt-2 text-xs font-bold text-emerald hover:underline"
                        >
                          Change Logo
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-8 border-t border-slate-100">
                    <h3 className="text-lg font-bold text-navy">System Utilities</h3>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-navy/10 rounded-xl flex items-center justify-center text-navy">
                          <Database size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy">Seed Dummy Data</p>
                          <p className="text-xs text-slate-500">Populate the system with sample jobs and users for testing.</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleSeed}
                        disabled={isSeeding}
                        className="btn-secondary text-xs px-6 py-2 flex items-center gap-2"
                      >
                        {isSeeding ? (
                          <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                        ) : (
                          <>
                            <Database size={14} />
                            <span>Seed Now</span>
                          </>
                        )}
                      </button>
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
                        { id: 'incomeTax', label: 'Income Tax (TDS)', value: payrollForm.incomeTax, desc: 'Standard deduction for all employees' },
                        { id: 'providentFund', label: 'Provident Fund (PF)', value: payrollForm.providentFund, desc: 'Employee contribution rate' },
                        { id: 'professionalTax', label: 'Professional Tax', value: payrollForm.professionalTax, desc: 'Fixed monthly deduction' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-off-white rounded-xl border border-slate-100">
                          <div>
                            <p className="text-sm font-bold text-navy">{item.label}</p>
                            <p className="text-[10px] text-slate-500">{item.desc}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <input 
                              type="text" 
                              className="input-field w-24 text-right font-bold" 
                              value={item.value}
                              onChange={(e) => setPayrollForm({ ...payrollForm, [item.id]: e.target.value })}
                            />
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
                        { id: 'payroll', label: 'Payroll Notifications', desc: 'Receive email when payslip is generated', checked: notificationPrefs.payroll },
                        { id: 'leave', label: 'Leave Approvals', desc: 'Notify when leave request status changes', checked: notificationPrefs.leave },
                        { id: 'performance', label: 'Performance Reviews', desc: 'Alerts for upcoming appraisal cycles', checked: notificationPrefs.performance },
                        { id: 'announcements', label: 'Company Announcements', desc: 'Stay updated with company-wide news', checked: notificationPrefs.announcements },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-off-white rounded-xl border border-slate-100">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-navy">{item.label}</p>
                            <p className="text-[10px] text-slate-500">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={item.checked}
                              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, [item.id]: e.target.checked })}
                            />
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
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="password" 
                            title="Current Password" 
                            placeholder="••••••••" 
                            className="input-field !pl-12" 
                            value={securityForm.currentPassword}
                            onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Password</label>
                          <div className="relative">
                            <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                              type="password" 
                              title="New Password" 
                              placeholder="••••••••" 
                              className="input-field !pl-12" 
                              value={securityForm.newPassword}
                              onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm New Password</label>
                          <div className="relative">
                            <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                              type="password" 
                              title="Confirm New Password" 
                              placeholder="••••••••" 
                              className="input-field !pl-12" 
                              value={securityForm.confirmPassword}
                              onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                            />
                          </div>
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
