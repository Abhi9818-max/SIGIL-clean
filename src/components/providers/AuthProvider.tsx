
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const LOCAL_STORAGE_AUTH_KEY = 'sigil_credentials';
const SESSION_STORAGE_AUTH_KEY = 'sigil_session_auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isInitialSetup: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  setupCredentials: (username: string, password: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedCredentials = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
      const sessionAuth = sessionStorage.getItem(SESSION_STORAGE_AUTH_KEY);

      if (!storedCredentials) {
        setIsInitialSetup(true);
      } else if (sessionAuth === 'true') {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error accessing storage for auth check:", error);
    }
    setIsLoading(false);
  }, []);
  
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && pathname !== '/login') {
        router.push('/login');
      } else if (isAuthenticated && pathname === '/login') {
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const login = useCallback((username: string, password: string): boolean => {
    try {
        const storedCredentials = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
        if (storedCredentials) {
            const { u, p } = JSON.parse(storedCredentials);
            if (username === u && password === p) {
                setIsAuthenticated(true);
                sessionStorage.setItem(SESSION_STORAGE_AUTH_KEY, 'true');
                router.push('/');
                return true;
            }
        }
    } catch (error) {
        console.error("Login failed:", error);
    }
    return false;
  }, [router]);

  const logout = useCallback(() => {
    try {
        setIsAuthenticated(false);
        sessionStorage.removeItem(SESSION_STORAGE_AUTH_KEY);
        router.push('/login');
    } catch (error) {
        console.error("Logout failed:", error);
    }
  }, [router]);

  const setupCredentials = useCallback((username: string, password: string) => {
    try {
        const credentials = JSON.stringify({ u: username, p: password });
        localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, credentials);
        setIsInitialSetup(false);
        // Automatically log in after setup
        setIsAuthenticated(true);
        sessionStorage.setItem(SESSION_STORAGE_AUTH_KEY, 'true');
        router.push('/');
    } catch (error) {
        console.error("Credential setup failed:", error);
    }
  }, [router]);

  // Render a loading screen or null while checking auth state to prevent flash of content
  if (isLoading || (!isAuthenticated && pathname !== '/login')) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-primary">Loading S.I.G.I.L...</div>
        </div>
      );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isInitialSetup, login, logout, setupCredentials }}>
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
