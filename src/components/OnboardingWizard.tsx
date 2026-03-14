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

const steps = [
  { id: 'personal', title: 'Personal Details', icon: User },
  { id: 'contact', title: 'Emergency Contact', icon: Phone },
  { id: 'documents', title: 'Upload ID Proof', icon: FileText },
  { id: 'review', title: 'Review & Confirm', icon: CheckCircle2 },
];

const OnboardingWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-navy">Welcome to OptimaHR</h1>
        <p className="text-slate-500 text-sm mt-1">Let's get your profile set up in just a few steps.</p>
      </div>

      <div className="flex justify-between items-center relative px-4">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-10 mx-12" />
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          
          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive ? 'bg-emerald text-white shadow-lg shadow-emerald/20 scale-110' :
                isCompleted ? 'bg-navy text-white' : 'bg-white border-2 border-slate-200 text-slate-400'
              }`}>
                {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                isActive ? 'text-emerald' : 'text-slate-400'
              }`}>{step.title}</span>
            </div>
          );
        })}
      </div>

      <div className="card p-8 min-h-[400px] flex flex-col">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">First Name</label>
                    <input type="text" className="input-field" placeholder="John" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Name</label>
                    <input type="text" className="input-field" placeholder="Doe" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date of Birth</label>
                    <input type="date" className="input-field" />
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
                    <input type="text" className="input-field" placeholder="Jane Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Relationship</label>
                    <select className="input-field">
                      <option>Spouse</option>
                      <option>Parent</option>
                      <option>Sibling</option>
                      <option>Friend</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                    <input type="tel" className="input-field" placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="font-bold text-navy">Identity Verification</h3>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-4 hover:border-emerald/50 transition-all cursor-pointer group">
                  <div className="w-16 h-16 bg-off-white rounded-full flex items-center justify-center mx-auto text-slate-400 group-hover:text-emerald transition-colors">
                    <Upload size={32} />
                  </div>
                  <div>
                    <p className="font-bold text-navy">Upload ID Proof</p>
                    <p className="text-xs text-slate-500 mt-1">Passport, Driver's License, or National ID (PDF/JPG)</p>
                  </div>
                  <button className="btn-secondary text-xs">Browse Files</button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 text-center py-8">
                <div className="w-20 h-20 bg-emerald/10 text-emerald rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={40} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-navy">All Set!</h3>
                  <p className="text-slate-500 text-sm mt-2">
                    Please review your information before submitting. Once confirmed, your profile will be sent for HR verification.
                  </p>
                </div>
                <div className="bg-off-white p-4 rounded-xl text-left space-y-2">
                  <p className="text-xs text-slate-600"><span className="font-bold">Name:</span> John Doe</p>
                  <p className="text-xs text-slate-600"><span className="font-bold">Contact:</span> Jane Doe (Spouse)</p>
                  <p className="text-xs text-slate-600"><span className="font-bold">ID Proof:</span> uploaded_passport.pdf</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex justify-between">
          <button 
            onClick={prevStep}
            disabled={currentStep === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-0"
          >
            <ChevronLeft size={18} />
            <span>Back</span>
          </button>
          <button 
            onClick={nextStep}
            className="btn-primary flex items-center gap-2"
          >
            <span>{currentStep === steps.length - 1 ? 'Complete Onboarding' : 'Next Step'}</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
