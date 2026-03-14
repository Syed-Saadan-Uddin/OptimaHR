import React, { useState } from 'react';
import { Upload, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CandidateRegistration: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(1);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-navy">Complete Your Application</h1>
        <p className="text-slate-500 mt-2">Provide your details to apply for the position.</p>
      </div>

      <div className="card p-8 space-y-8 relative overflow-hidden">
        {/* Progress Bar Background */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
          <motion.div 
            className="h-full bg-emerald"
            initial={{ width: '33%' }}
            animate={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-4">
          {[
            { id: 1, label: 'Resume' },
            { id: 2, label: 'Details' },
            { id: 3, label: 'Success' }
          ].map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s.id ? 'bg-navy text-white scale-110 shadow-lg shadow-navy/20' : 
                step > s.id ? 'bg-emerald text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {step > s.id ? <CheckCircle2 size={20} /> : s.id}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                step === s.id ? 'text-navy' : 'text-slate-400'
              }`}>{s.label}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-navy">Upload Your Resume</h3>
                <p className="text-sm text-slate-500">We'll use this to pre-fill your application details.</p>
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-4 hover:border-navy/50 transition-all cursor-pointer group bg-off-white/30">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-slate-400 group-hover:text-navy transition-all shadow-sm group-hover:shadow-md">
                  <Upload size={32} />
                </div>
                <div>
                  <p className="font-bold text-navy">Drag & Drop Resume</p>
                  <p className="text-xs text-slate-500 mt-1">PDF, DOCX (Max 5MB)</p>
                </div>
                <button onClick={() => setStep(2)} className="btn-primary px-8">Browse Files</button>
              </div>
              <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <FileText size={20} className="text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-navy">Already have a profile?</p>
                  <p className="text-[10px] text-slate-500">Sign in to apply with your saved resume.</p>
                </div>
                <button className="text-xs font-bold text-slate-blue hover:underline">Sign In</button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-navy">Personal Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input type="text" className="input-field" placeholder="John Doe" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input type="email" className="input-field" placeholder="john@example.com" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LinkedIn Profile</label>
                  <input type="url" className="input-field" placeholder="https://linkedin.com/in/johndoe" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cover Letter (Optional)</label>
                  <textarea className="input-field min-h-[120px] py-3" placeholder="Tell us why you're a great fit..." />
                </div>
              </div>
              <div className="flex justify-between items-center pt-4">
                <button onClick={() => setStep(1)} className="text-sm font-bold text-slate-400 hover:text-navy transition-colors">Back</button>
                <button onClick={() => setStep(3)} className="btn-primary px-10">Submit Application</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center py-12"
            >
              <div className="w-24 h-24 bg-emerald/10 text-emerald rounded-full flex items-center justify-center mx-auto shadow-inner">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                >
                  <CheckCircle2 size={48} />
                </motion.div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-navy">Application Received!</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  Thank you for applying. Our recruitment team will review your profile and get back to you shortly.
                </p>
              </div>
              <div className="pt-6">
                <button onClick={onComplete} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  <span>Track Application</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CandidateRegistration;
