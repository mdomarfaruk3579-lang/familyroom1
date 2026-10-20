import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithAdminCode: (code: string) => Promise<boolean>;
  grantAdminRole: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  loginWithAdminCode: async () => false,
  grantAdminRole: async () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminUnlocked, setAdminUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('familyroom_admin_unlocked') === 'true';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        let role: 'admin' | 'user' = 'user';
        
        try {
          const userDoc = await getDoc(userDocRef);
          
          if (localStorage.getItem('makeAdmin') === 'true' || adminUnlocked) {
            role = 'admin';
            await setDoc(userDocRef, { email: firebaseUser.email, role: 'admin' }, { merge: true });
            localStorage.removeItem('makeAdmin');
          } else if (userDoc.exists()) {
            role = userDoc.data().role;
          } else {
            if (firebaseUser.email === 'mdomarfaruk3579@gmail.com' && firebaseUser.emailVerified) {
              role = 'admin';
              await setDoc(userDocRef, { email: firebaseUser.email, role: 'admin' });
            } else {
              await setDoc(userDocRef, { email: firebaseUser.email, role: 'user' });
            }
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          if (firebaseUser.email === 'mdomarfaruk3579@gmail.com') {
            role = 'admin';
          }
        }

        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [adminUnlocked]);

  const grantAdminRole = async () => {
    setAdminUnlocked(true);
    localStorage.setItem('familyroom_admin_unlocked', 'true');
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { email: user.email, role: 'admin' }, { merge: true });
        setUser(prev => prev ? { ...prev, role: 'admin' } : null);
      } catch (err) {
        console.error("Error updating admin role:", err);
      }
    }
  };

  const loginWithAdminCode = async (code: string): Promise<boolean> => {
    if (code.trim() === 'familyroomadmin') {
      await grantAdminRole();
      return true;
    }
    return false;
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    localStorage.setItem('makeAdmin', 'true');
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    localStorage.removeItem('familyroom_admin_unlocked');
    localStorage.removeItem('makeAdmin');
    setAdminUnlocked(false);
    if (auth.currentUser) {
      await signOut(auth);
    }
    setUser(null);
  };

  const effectiveIsAdmin = adminUnlocked || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin: effectiveIsAdmin,
      loginWithAdminCode,
      grantAdminRole,
      signInWithGoogle,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
