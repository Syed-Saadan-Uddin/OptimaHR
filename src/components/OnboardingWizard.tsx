import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from './FirebaseProvider';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firestoreUtils';

const steps = [
  { id: 'personal', title: 'Personal Details', icon: User },
  { id: 'contact', title: 'Emergency Contact', icon: Phone },
  { id: 'documents', title: 'Upload ID Proof', icon: FileText },
  { id: 'review', title: 'Review & Confirm', icon: CheckCircle2 },
];

const OnboardingWizard: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { user, userProfile } = useFirebase();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: userProfile?.name?.split(' ')[0] || '',
    lastName: userProfile?.name?.split(' ')[1] || '',
    dob: '',
    emergencyContact: {
      name: '',
      relationship: 'Spouse',
      phone: ''
    },
    idProof: null as { name: string, size: number, type: string, base64: string } | null
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          idProof: {
            name: file.name,
            size: file.size,
            type: file.type,
            base64: reader.result as string
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (currentStep === steps.length - 1) {
      handleComplete();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleComplete = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: `${formData.firstName} ${formData.lastName}`,
        dob: formData.dob,
        emergencyContact: formData.emergencyContact,
        idProof: formData.idProof,
        onboardingCompleted: true,
        status: 'Active'
      });
      onComplete?.();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-navy">Welcome to OptimaHR</h1>
        <p className="text-slate-500 text-sm mt-1">Let's get your profile set up in just a few steps.</p>
      </div>

      <div className="flex justify-between items-center relative px-2 sm:px-4">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-10 mx-8 sm:mx-12" />
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          
          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive ? 'bg-emerald text-white shadow-lg shadow-emerald/20 scale-110' :
                isCompleted ? 'bg-navy text-white' : 'bg-white border-2 border-slate-200 text-slate-400'
              }`}>
                {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              </div>
              <span className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-center max-w-[60px] sm:max-w-none ${
                isActive ? 'text-emerald' : 'text-slate-400'
              }`}>{step.title}</span>
            </div>
          );
        })}
      </div>

      <div className="card p-4 sm:p-8 min-h-[400px] flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1"
          >
            {currentStep === 0 && (
              <div className="space-y-6">
                <h3 className="font-bold text-navy">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">First Name</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="John" 
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Name</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Doe" 
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date of Birth</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      value={formData.dob}
                      onChange={(e) => setFormData({...formData, dob: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="font-bold text-navy">Emergency Contact</h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Name</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Jane Doe" 
                      value={formData.emergencyContact.name}
                      onChange={(e) => setFormData({
                        ...formData, 
                        emergencyContact: {...formData.emergencyContact, name: e.target.value}
                      })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Relationship</label>
                    <select 
                      className="input-field"
                      value={formData.emergencyContact.relationship}
                      onChange={(e) => setFormData({
                        ...formData, 
                        emergencyContact: {...formData.emergencyContact, relationship: e.target.value}
                      })}
                    >
                      <option>Spouse</option>
                      <option>Parent</option>
                      <option>Sibling</option>
                      <option>Friend</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                    <input 
                      type="tel" 
                      className="input-field" 
                      placeholder="+1 (555) 000-0000" 
                      value={formData.emergencyContact.phone}
                      onChange={(e) => setFormData({
                        ...formData, 
                        emergencyContact: {...formData.emergencyContact, phone: e.target.value}
                      })}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="font-bold text-navy">Identity Verification</h3>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-2xl p-6 sm:p-12 text-center space-y-4 hover:border-emerald/50 transition-all cursor-pointer group"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-off-white rounded-full flex items-center justify-center mx-auto text-slate-400 group-hover:text-emerald transition-colors">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-navy text-sm sm:text-base">
                      {formData.idProof ? formData.idProof.name : 'Upload ID Proof'}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                      {formData.idProof ? `${(formData.idProof.size / 1024).toFixed(0)} KB` : "Passport, Driver's License, or National ID (PDF/JPG)"}
                    </p>
                  </div>
                  <button className="btn-secondary text-[10px] sm:text-xs">
                    {formData.idProof ? 'Change File' : 'Browse Files'}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 text-center py-4 sm:py-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald/10 text-emerald rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-navy">All Set!</h3>
                  <p className="text-slate-500 text-xs sm:text-sm mt-2">
                    Please review your information before submitting. Once confirmed, your profile will be sent for HR verification.
                  </p>
                </div>
                <div className="bg-off-white p-4 rounded-xl text-left space-y-2">
                  <p className="text-[10px] sm:text-xs text-slate-600"><span className="font-bold">Name:</span> {formData.firstName} {formData.lastName}</p>
                  <p className="text-[10px] sm:text-xs text-slate-600"><span className="font-bold">Contact:</span> {formData.emergencyContact.name} ({formData.emergencyContact.relationship})</p>
                  <p className="text-[10px] sm:text-xs text-slate-600"><span className="font-bold">ID Proof:</span> {formData.idProof?.name || 'Not uploaded'}</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 sm:mt-12 flex justify-between">
          <button 
            onClick={prevStep}
            disabled={currentStep === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-0 px-4 sm:px-6"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Back</span>
          </button>
          <button 
            onClick={nextStep}
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2 px-4 sm:px-6"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-sm sm:text-base">{currentStep === steps.length - 1 ? 'Complete Onboarding' : 'Next Step'}</span>
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
