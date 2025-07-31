
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, type User, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { UserData } from '@/types';

const FAKE_DOMAIN = 'sigil.local';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setupCredentials: (username: string, password: string) => Promise<boolean>;
  updateProfilePicture: (url: string) => Promise<string | null>;
  userData: UserData | null;
  loading: boolean;
  isUserDataLoaded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const auth = getAuth();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
      if (user) {
          const docRef = doc(db, 'users', user.uid);
          const unsubscribe = onSnapshot(docRef, (docSnap) => {
              if (docSnap.exists()) {
                  setUserData(docSnap.data() as UserData);
              } else {
                  // This case can happen briefly if a user is created but the doc hasn't been written yet.
                  setUserData(null);
              }
              setIsUserDataLoaded(true);
          });
          return () => unsubscribe();
      } else {
          setUserData(null);
          setIsUserDataLoaded(false);
      }
  }, [user]);

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === '/login';
      if (!user && !isAuthPage) {
        router.push('/login');
      } else if (user && isAuthPage) {
        router.push('/');
      }
    }
  }, [user, loading, pathname, router]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const email = `${username.toLowerCase()}@${FAKE_DOMAIN}`;
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      router.push('/');
      return true;
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        toast({ title: 'Login Failed', description: 'Invalid username or password.', variant: 'destructive' });
      } else {
        toast({ title: 'Login Failed', description: 'An unexpected error occurred.', variant: 'destructive' });
        console.error("Login error:", error);
      }
      return false;
    }
  }, [auth, router, toast]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // No need to clear local states as they will be cleared by the effect
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ title: 'Logout Failed', description: 'Could not log you out. Please try again.', variant: 'destructive' });
    }
  }, [auth, router, toast]);

  const setupCredentials = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const email = `${username.toLowerCase()}@${FAKE_DOMAIN}`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(userCredential.user, { displayName: username });

      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const initialUserData: UserData = {
        username: username,
        username_lowercase: username.toLowerCase(),
        photoURL: null,
        // Other fields will be initialized with defaults by UserRecordsProvider
      };
      await setDoc(userDocRef, initialUserData);

      toast({ title: 'Account Created!', description: 'Welcome to S.I.G.I.L.' });
      router.push('/');
      return true;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({ title: 'Setup Failed', description: 'This username is already taken.', variant: 'destructive' });
      } else {
        toast({ title: 'Setup Failed', description: 'Could not create account. Please try again.', variant: 'destructive' });
        console.error("Setup error:", error);
      }
      return false;
    }
  }, [auth, router, toast]);
  
  const updateProfilePicture = useCallback(async (url: string): Promise<string | null> => {
    if (!user) {
        toast({ title: "Not Authenticated", description: "You must be logged in to update your avatar.", variant: "destructive" });
        return null;
    }

    try {
        const photoURL = url || null;
        // Update auth profile
        await updateProfile(user, { photoURL });
        
        // Update Firestore document
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { photoURL }, { merge: true });

        toast({ title: "Avatar Updated", description: "Your new avatar has been saved." });
        return url;

    } catch (error) {
        console.error("Error updating profile picture:", error);
        toast({ title: "Update Failed", description: "Could not update your avatar.", variant: "destructive" });
        return null;
    }
  }, [user, toast]);


  if (loading || (!user && pathname !== '/login')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-primary">Loading S.I.G.I.L...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, setupCredentials, updateProfilePicture, userData, loading, isUserDataLoaded }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
