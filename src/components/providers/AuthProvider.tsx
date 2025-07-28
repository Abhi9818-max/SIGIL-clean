
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { RecordEntry, TaskDefinition, TodoItem, HighGoal, DashboardSettings } from '@/types';

const FAKE_DOMAIN = 'sigil.local';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitialSetup: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setupCredentials: (username: string, password: string) => Promise<boolean>;
  userData: AllUserData | null;
  loading: boolean;
  isUserDataLoaded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AllUserData {
    records?: RecordEntry[];
    taskDefinitions?: TaskDefinition[];
    bonusPoints?: number;
    unlockedAchievements?: string[];
    spentSkillPoints?: Record<string, number>;
    unlockedSkills?: string[];
    freezeCrystals?: number;
    awardedStreakMilestones?: Record<string, number[]>;
    highGoals?: HighGoal[];
    todoItems?: TodoItem[];
    dashboardSettings?: DashboardSettings;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);
  const [userData, setUserData] = useState<AllUserData | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // A user is logged in, so it's not the initial setup for the app itself.
        // We'll handle data doc creation later.
        setIsInitialSetup(false);
      } else {
        // No user is logged in. This could be an initial setup state.
        // For simplicity, we'll treat the login page as the decider.
        // Let's assume if no one is logged in, the first action is to sign up or sign in.
        // We'll manage this state on the login page itself.
        // The most important thing is to protect other routes.
        setIsInitialSetup(true); // Default to setup/login if no user
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
      if (user) {
          const docRef = doc(db, 'users', user.uid);
          const unsubscribe = onSnapshot(docRef, (docSnap) => {
              if (docSnap.exists()) {
                  setUserData(docSnap.data() as AllUserData);
              } else {
                  // User exists, but no data document yet.
                  setUserData(null);
              }
              setIsUserDataLoaded(true);
          });
          return () => unsubscribe();
      } else {
          // No user logged in
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
      
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, { username: username.toLowerCase() }); // Save username for reference

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
  }, [auth, router, toast, db]);

  if (loading || (!user && pathname !== '/login')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-primary">Loading S.I.G.I.L...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isInitialSetup, login, logout, setupCredentials, userData, loading, isUserDataLoaded }}>
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
