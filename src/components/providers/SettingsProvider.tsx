
"use client";

import type { DashboardSettings } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LOCAL_STORAGE_DASHBOARD_SETTINGS_KEY } from '@/lib/config';

// Define the default settings
const defaultSettings: DashboardSettings = {
  showStatsPanel: true,
  showTaskFilterBar: true,
  showContributionGraph: true,
  showTodoList: true,
  showProgressChart: true,
  showAISuggestions: true,
};

interface SettingsContextType {
  dashboardSettings: DashboardSettings;
  updateDashboardSetting: <K extends keyof DashboardSettings>(key: K, value: DashboardSettings[K]) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(LOCAL_STORAGE_DASHBOARD_SETTINGS_KEY);
      if (storedSettings) {
        // Merge stored settings with defaults to ensure all keys are present
        const parsedSettings = JSON.parse(storedSettings);
        setDashboardSettings({ ...defaultSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error("Failed to load dashboard settings from localStorage:", error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(LOCAL_STORAGE_DASHBOARD_SETTINGS_KEY, JSON.stringify(dashboardSettings));
      } catch (error) {
        console.error("Failed to save dashboard settings to localStorage:", error);
      }
    }
  }, [dashboardSettings, isLoaded]);

  const updateDashboardSetting = <K extends keyof DashboardSettings>(key: K, value: DashboardSettings[K]) => {
    setDashboardSettings(prevSettings => ({
      ...prevSettings,
      [key]: value,
    }));
  };

  return (
    <SettingsContext.Provider value={{ dashboardSettings, updateDashboardSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
