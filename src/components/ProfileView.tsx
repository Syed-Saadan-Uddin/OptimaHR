import React, { useState } from 'react';
import {
    User,
    Mail,
    Linkedin,
    Phone,
    ShieldAlert,
    Briefcase,
    Building2,
    CalendarDays,
    Save,
    Loader2,
    CheckCircle2,
    MapPin,
    ArrowUpCircle,
    DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserData } from '../App';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface ProfileViewProps {
    userData: UserData;
}

const ProfileView: React.FC<ProfileViewProps> = ({ userData }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [formData, setFormData] = useState({
        displayName: userData.displayName || '',
        phoneNumber: userData.phoneNumber || '',
        emergencyContact: userData.emergencyContact || '',
        address: userData.address || '',
        designation: userData.designation || '',
        department: userData.department || '',
    });

    // Reactive Sync: When userData changes (e.g. HR update), update local form state
    React.useEffect(() => {
        setFormData({
            displayName: userData.displayName || '',
            phoneNumber: userData.phoneNumber || '',
            emergencyContact: userData.emergencyContact || '',
            address: userData.address || '',
            designation: userData.designation || '',
            department: userData.department || '',
        });
    }, [userData]);

    const isAdmin = userData.role === 'HR_ADMIN';

    const handleSave = async (isPromotion: boolean = false) => {
        setIsSaving(true);
        try {
            const userRef = doc(db, 'users', userData.uid);

            const updates: any = {
                phoneNumber: formData.phoneNumber,
                emergencyContact: formData.emergencyContact,
                address: formData.address,
                lastProfileUpdate: serverTimestamp()
            };

            // Only HR can update these fields
            if (isAdmin && isPromotion) {
                updates.designation = formData.designation;
                updates.department = formData.department;
            }

            await updateDoc(userRef, updates);

            setShowSuccess(true);
            setIsEditing(false);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile. Check your permissions.");
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '---';
        try {
            return timestamp.toDate().toLocaleDateString();
        } catch {
            return '---';
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 text-left">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-navy">My Digital Identity</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage your professional record and personal information.</p>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="btn-primary px-8"
                    >
                        Edit Information
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <button onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
                        <button
                            onClick={() => handleSave(false)}
                            disabled={isSaving}
                            className="btn-primary flex items-center gap-2"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            <span>Save Changes</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="card p-8 flex flex-col items-center text-center space-y-4 h-fit">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-50 shadow-xl">
                            <img
                                src={`https://picsum.photos/seed/${userData.uid}/200/200`}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute bottom-1 right-1 w-8 h-8 bg-emerald text-white rounded-full flex items-center justify-center border-4 border-white">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-navy">{userData.displayName}</h2>
                        <p className="text-sm font-medium text-slate-500">{userData.designation || 'New Hire'}</p>
                    </div>
                    <div className="badge badge-info uppercase text-[10px] tracking-widest px-4">{userData.role}</div>
                    <div className="w-full pt-4 space-y-3">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <Mail size={14} />
                            <span>{userData.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 capitalize">
                            <Briefcase size={14} />
                            <span>{userData.department || 'General'}</span>
                        </div>
                        {userData.dob && (
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                <CalendarDays size={14} />
                                <span>DOB: {userData.dob}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Grid */}
                <div className="md:col-span-2 space-y-6">
                    {/* Professional Info Section */}
                    <div className="card p-8 space-y-6 relative overflow-hidden">
                        {isAdmin && (
                            <div className="absolute top-0 right-0 p-4">
                                <span className="text-[10px] font-bold text-emerald border border-emerald/20 bg-emerald/5 px-2 py-1 rounded uppercase">HR Admin Mode</span>
                            </div>
                        )}
                        <h3 className="text-lg font-bold text-navy border-b border-slate-100 pb-4">Professional Record</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Briefcase size={12} />
                                    Current Designation
                                </label>
                                {isAdmin && isEditing ? (
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.designation}
                                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                    />
                                ) : (
                                    <p className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-navy">{userData.designation || 'Team Member'}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Building2 size={12} />
                                    Department
                                </label>
                                {isAdmin && isEditing ? (
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    />
                                ) : (
                                    <p className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-navy">{userData.department || 'General'}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <CalendarDays size={12} />
                                    Joining Date
                                </label>
                                <p className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-navy">{formatDate(userData.onboardingDate || userData.joiningDate)}</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-3 h-3 bg-navy rounded-full" />
                                    Employee ID
                                </label>
                                <p className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-navy">{userData.employeeId || 'PENDING'}</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <DollarSign size={12} className="text-emerald" />
                                    Monthly Gross Salary
                                </label>
                                <p className="p-3 bg-emerald/5 border border-emerald/10 rounded-xl text-sm font-bold text-emerald">
                                    ${userData.salary?.toLocaleString() || '0'}
                                </p>
                            </div>
                        </div>

                        {/* Promotion Power Button for HR */}
                        {isAdmin && isEditing && (
                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={() => handleSave(true)}
                                    disabled={isSaving}
                                    className="btn-primary bg-emerald hover:bg-emerald-dark flex items-center gap-2 !px-6"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpCircle size={16} />}
                                    <span>Update Employment Details</span>
                                </button>
                            </div>
                        )}
                        {!isAdmin && isEditing && (
                            <p className="text-[10px] text-slate-400 italic bg-off-white p-3 rounded-lg border border-slate-200">
                                <ShieldAlert size={12} className="inline mr-1" />
                                Employment records (ID, Dept, Title) are managed by Human Resources and cannot be modified by employees.
                            </p>
                        )}
                    </div>

                    {/* Personal Info Section */}
                    <div className="card p-8 space-y-6">
                        <h3 className="text-lg font-bold text-navy border-b border-slate-100 pb-4">Personal Contact Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Phone size={12} />
                                    Phone Number
                                </label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        className="input-field"
                                        placeholder="+1 (555) 000-0000"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    />
                                ) : (
                                    <p className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-navy">{userData.phoneNumber || 'Not provided'}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldAlert size={12} />
                                    Emergency Contact
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Name & Relationship"
                                        value={formData.emergencyContact}
                                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                                    />
                                ) : (
                                    <p className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-navy">{userData.emergencyContact || 'Not provided'}</p>
                                )}
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={12} />
                                    Residential Address
                                </label>
                                {isEditing ? (
                                    <textarea
                                        className="input-field h-20 resize-none"
                                        placeholder="Enter your complete home address..."
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                ) : (
                                    <p className="p-3 bg-slate-50 rounded-xl text-sm font-bold text-navy">{userData.address || 'Address not listed'}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="fixed bottom-8 right-8 bg-emerald text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50"
                    >
                        <CheckCircle2 size={18} />
                        <span className="text-sm font-bold">Profile synchronized with core systems!</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfileView;
