import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, ChevronDown, User, Briefcase, FileText, Megaphone, Loader2, X, CreditCard, Calendar, Info, Trash2, Check, Menu } from 'lucide-react';
import { UserRole } from '../types/hr';
import { useFirebase } from './FirebaseProvider';
import { db } from '../firebase';
import { collection, getDocs, query, limit, onSnapshot, where, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  role: UserRole;
  collapsed: boolean;
  setMobileMenuOpen?: (v: boolean) => void;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'employee' | 'job' | 'leave' | 'announcement';
  category: string;
}

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ANNOUNCEMENT' | 'PAYROLL' | 'LEAVE' | 'SYSTEM';
  read: boolean;
  createdAt: any;
}

const Header: React.FC<HeaderProps> = ({ role, collapsed, setMobileMenuOpen }) => {
  const { user, userProfile } = useFirebase();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const roleLabels: Record<UserRole, string> = {
    HR_ADMIN: 'HR Administrator',
    DEPT_HEAD: 'Department Head',
    EMPLOYEE: 'Employee',
    CANDIDATE: 'Candidate',
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [user.uid, 'ALL']),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.length < 2) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const searchTerms = searchQuery.toLowerCase().split(' ');
        const allResults: SearchResult[] = [];

        // Search Users (Employees)
        if (role !== 'CANDIDATE') {
          const usersSnap = await getDocs(query(collection(db, 'users'), limit(50)));
          usersSnap.docs.forEach(doc => {
            const data = doc.data();
            const name = data.name || '';
            const email = data.email || '';
            const dept = data.department || '';
            if (searchTerms.every(term => 
              name.toLowerCase().includes(term) || 
              email.toLowerCase().includes(term) || 
              dept.toLowerCase().includes(term)
            )) {
              allResults.push({
                id: doc.id,
                title: name,
                subtitle: `${data.role} • ${dept}`,
                type: 'employee',
                category: 'Employees'
              });
            }
          });
        }

        // Search Jobs
        const jobsSnap = await getDocs(query(collection(db, 'jobs'), limit(20)));
        jobsSnap.docs.forEach(doc => {
          const data = doc.data();
          const title = data.title || '';
          const dept = data.department || '';
          if (searchTerms.every(term => title.toLowerCase().includes(term) || dept.toLowerCase().includes(term))) {
            allResults.push({
              id: doc.id,
              title: title,
              subtitle: `${dept} • ${data.location}`,
              type: 'job',
              category: 'Jobs'
            });
          }
        });

        // Search Leaves (Only for HR/Dept Head)
        if (role === 'HR_ADMIN' || role === 'DEPT_HEAD') {
          const leavesSnap = await getDocs(query(collection(db, 'leaves'), limit(20)));
          leavesSnap.docs.forEach(doc => {
            const data = doc.data();
            const empName = data.employeeName || '';
            const reason = data.reason || '';
            if (searchTerms.every(term => empName.toLowerCase().includes(term) || reason.toLowerCase().includes(term))) {
              allResults.push({
                id: doc.id,
                title: `${empName}'s Leave`,
                subtitle: `${data.type} • ${data.status}`,
                type: 'leave',
                category: 'Leaves'
              });
            }
          }
        );
        }

        // Search Announcements
        const announcementsSnap = await getDocs(query(collection(db, 'announcements'), limit(20)));
        announcementsSnap.docs.forEach(doc => {
          const data = doc.data();
          const title = data.title || '';
          if (searchTerms.every(term => title.toLowerCase().includes(term))) {
            allResults.push({
              id: doc.id,
              title: title,
              subtitle: `${data.tag} • ${data.date}`,
              type: 'announcement',
              category: 'Announcements'
            });
          }
        });

        setResults(allResults.slice(0, 10)); // Limit to top 10 results
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, role]);

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'employee': return <User size={14} />;
      case 'job': return <Briefcase size={14} />;
      case 'leave': return <FileText size={14} />;
      case 'announcement': return <Megaphone size={14} />;
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'ANNOUNCEMENT': return <Megaphone size={16} className="text-purple-500" />;
      case 'PAYROLL': return <CreditCard size={16} className="text-emerald-500" />;
      case 'LEAVE': return <Calendar size={16} className="text-amber-500" />;
      case 'SYSTEM': return <Info size={16} className="text-blue-500" />;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className={`h-16 bg-white border-b border-slate-200 fixed top-0 right-0 z-40 flex items-center justify-between px-4 md:px-8 transition-all duration-300 print:hidden ${collapsed ? 'md:left-20' : 'md:left-64'} left-0`}>
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={() => setMobileMenuOpen?.(true)}
          className="p-2 hover:bg-off-white rounded-lg text-slate-500 md:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="relative w-full max-w-md hidden sm:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full !pl-10 pr-10 py-2 bg-off-white border-none rounded-xl text-sm focus:ring-2 focus:ring-slate-blue/10 outline-none"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy"
            >
              <X size={16} />
            </button>
          )}

          <AnimatePresence>
            {showResults && (searchQuery.length >= 2) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50"
              >
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {isSearching ? (
                    <div className="p-8 text-center">
                      <Loader2 className="animate-spin text-slate-400 mx-auto mb-2" size={24} />
                      <p className="text-xs text-slate-500 font-medium">Searching across OptimaHR...</p>
                    </div>
                  ) : results.length > 0 ? (
                    <div className="py-2">
                      {results.map((result, idx) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          className="w-full px-4 py-3 flex items-center gap-4 hover:bg-off-white transition-colors text-left group"
                          onClick={() => {
                            setShowResults(false);
                            setSearchQuery('');
                            // In a real app, we'd navigate here
                            console.log(`Navigating to ${result.type}: ${result.id}`);
                          }}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            result.type === 'employee' ? 'bg-blue-50 text-blue-500' :
                            result.type === 'job' ? 'bg-emerald-50 text-emerald-500' :
                            result.type === 'leave' ? 'bg-amber-50 text-amber-500' :
                            'bg-purple-50 text-purple-500'
                          }`}>
                            {getIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-navy truncate">{result.title}</p>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{result.category}</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-off-white rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                        <Search size={20} />
                      </div>
                      <p className="text-sm font-bold text-navy">No results found</p>
                      <p className="text-xs text-slate-500 mt-1">Try searching for something else</p>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-off-white border-t border-slate-100 flex justify-between items-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Search</p>
                  <div className="flex gap-2">
                    <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] text-slate-400">ESC to close</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <div className="hidden lg:flex items-center gap-2">
          <span className={`badge ${
            role === 'HR_ADMIN' ? 'badge-info' : 
            role === 'DEPT_HEAD' ? 'badge-warning' : 
            role === 'EMPLOYEE' ? 'badge-success' : 'badge-info'
          }`}>
            {roleLabels[role]}
          </span>
        </div>

        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 hover:bg-off-white rounded-full relative transition-all ${showNotifications ? 'bg-off-white text-navy' : 'text-slate-400'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-muted-red rounded-full border-2 border-white" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-off-white/50">
                  <h3 className="text-sm font-bold text-navy">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-muted-red/10 text-muted-red px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-4 hover:bg-off-white transition-colors group relative ${!notif.read ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              notif.type === 'ANNOUNCEMENT' ? 'bg-purple-50' :
                              notif.type === 'PAYROLL' ? 'bg-emerald-50' :
                              notif.type === 'LEAVE' ? 'bg-amber-50' :
                              'bg-blue-50'
                            }`}>
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <p className={`text-xs font-bold truncate ${notif.read ? 'text-slate-600' : 'text-navy'}`}>
                                  {notif.title}
                                </p>
                                <span className="text-[9px] text-slate-400 whitespace-nowrap mt-0.5">
                                  {notif.createdAt?.toDate ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                              <div className="flex gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notif.read && (
                                  <button 
                                    onClick={() => markAsRead(notif.id)}
                                    className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 hover:underline"
                                  >
                                    <Check size={10} />
                                    Mark as read
                                  </button>
                                )}
                                <button 
                                  onClick={() => deleteNotification(notif.id)}
                                  className="text-[10px] font-bold text-muted-red flex items-center gap-1 hover:underline"
                                >
                                  <Trash2 size={10} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center">
                      <div className="w-12 h-12 bg-off-white rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                        <Bell size={20} />
                      </div>
                      <p className="text-sm font-bold text-navy">All caught up!</p>
                      <p className="text-xs text-slate-500 mt-1">No new notifications for you</p>
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 bg-off-white border-t border-slate-100 text-center">
                    <button className="text-[10px] font-bold text-slate-blue uppercase tracking-widest hover:underline">
                      View All Activity
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="h-8 w-px bg-slate-200 hidden sm:block" />
        
        <button className="flex items-center gap-3 pl-2 pr-1 py-1 hover:bg-off-white rounded-full transition-all">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-navy">
              {userProfile?.name || user?.displayName || 'Guest User'}
            </p>
            <p className="text-[10px] text-slate-500">
              {userProfile?.department || (role === 'HR_ADMIN' ? 'Global Admin' : role === 'CANDIDATE' ? 'Applicant' : 'OptimaHR')}
            </p>
          </div>
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden border border-slate-200">
            <img 
              src={user?.photoURL || `https://picsum.photos/seed/${role}/100/100`} 
              alt="User" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
        </button>
      </div>
    </header>
  );
};

export default Header;
