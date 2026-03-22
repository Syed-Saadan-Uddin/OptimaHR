import React, { useState } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, Mail, Lock, ShieldCheck, ArrowRight, Loader2, Users } from 'lucide-react';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // --- ADDED THIS STATE ---
    const [selectedRole, setSelectedRole] = useState('CANDIDATE');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // --- FULL ROLE IMPLEMENTATION ---
                const userData: any = {
                    email: user.email,
                    displayName: 'New User',
                    role: selectedRole,
                    linkedinUrl: '',
                    createdAt: new Date().toISOString()
                };

                // Add department for Employee/Manager roles
                if (selectedRole === 'EMPLOYEE' || selectedRole === 'DEPT_HEAD') {
                    userData.department = "";
                }

                await setDoc(doc(db, 'users', user.uid), userData);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0f172a] rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10"
            >
                <div className="bg-[#0f172a] p-8 text-white relative">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                            <ShieldCheck className="w-6 h-6 text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-white/60 text-sm">
                            {isLogin ? 'Sign in to access OptimaHR platform' : 'Join the next generation of HR management'}
                        </p>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-white/20 to-transparent" />
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* --- ADDED ROLE SELECTION DROPDOWN --- */}
                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Account Type</label>
                                <div className="relative group">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#0f172a] transition-colors" />
                                    <select
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-200 focus:bg-white focus:border-[#0f172a] transition-all appearance-none font-medium text-slate-700"
                                    >
                                        <option value="CANDIDATE">Candidate / Job Seeker</option>
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="DEPT_HEAD">Department Manager</option>
                                        <option value="HR_ADMIN">HR Administrator</option>
                                    </select>
                                </div>
                            </motion.div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#0f172a] transition-colors" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-200 focus:bg-white focus:border-[#0f172a] transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#0f172a] transition-colors" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-200 focus:bg-white focus:border-[#0f172a] transition-all"
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-rose-50 border border-rose-100 text-rose-600 text-[13px] p-4 rounded-2xl font-medium"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#0f172a] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className="text-sm font-bold text-slate-400 hover:text-[#0f172a] transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            {isLogin ? (
                                <>
                                    <UserPlus className="w-4 h-4" />
                                    New to Optima? Create an account
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Already have an account? Sign in
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}