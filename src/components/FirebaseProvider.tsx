import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserRole } from '../types/hr';

interface FirebaseContextType {
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  role: UserRole;
  setRole: (role: UserRole) => void;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('CANDIDATE');

  const createUserProfile = async (firebaseUser: User, displayName?: string) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(userRef);
    
    // Check if this is the primary admin email
    const isAdminEmail = firebaseUser.email === 'saadanuddinsyed@gmail.com';
    
    if (!snap.exists()) {
      const newProfile = {
        uid: firebaseUser.uid,
        name: displayName || firebaseUser.displayName || 'New User',
        email: firebaseUser.email,
        role: isAdminEmail ? 'HR_ADMIN' : 'CANDIDATE',
        createdAt: serverTimestamp(),
        onboardingCompleted: false,
        leaveBalance: {
          sick: 12,
          casual: 15,
          unpaid: 0
        }
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    } else {
      // If user exists but should be admin and isn't, update them
      const existingData = snap.data();
      if (isAdminEmail && existingData.role !== 'HR_ADMIN') {
        await setDoc(userRef, { role: 'HR_ADMIN' }, { merge: true });
        return { ...existingData, role: 'HR_ADMIN' };
      }
    }
    return snap.data();
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    await createUserProfile(userCredential.user, name);
  };

  const signIn = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await auth.signOut();
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Ensure profile exists (especially for Google login)
        await createUserProfile(firebaseUser);
        
        setUser(firebaseUser);
        // Listen to user profile changes in real-time
        unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data();
            setUserProfile(profile);
            setRole(profile.role as UserRole);
          } else {
            setUserProfile(null);
            setRole('CANDIDATE');
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setLoading(false);
        });
      } else {
        if (unsubscribeProfile) unsubscribeProfile();
        setUser(null);
        setUserProfile(null);
        setRole('CANDIDATE');
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <FirebaseContext.Provider value={{ user, userProfile, loading, role, setRole, signUp, signIn, logout }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
