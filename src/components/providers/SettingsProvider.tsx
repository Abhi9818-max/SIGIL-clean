
"use client";

import type { DashboardSettings } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LOCAL_STORAGE_DASHBOARD_SETTINGS_KEY } from '@/lib/config';

// Define the default settings
const defaultSettings: DashboardSettings = {
  showTotalLast30Days: true,
  showCurrentStreak: true,
  showDailyConsistency: true,
  showHighGoalStat: true,
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
        // Handle migration from old 'showStatsPanel' setting
        if (parsedSettings.hasOwnProperty('showStatsPanel')) {
            const showStats = parsedSettings.showStatsPanel;
            delete parsedSettings.showStatsPanel;
            if (!parsedSettings.hasOwnProperty('showTotalLast30Days')) parsedSettings.showTotalLast30Days = showStats;
            if (!parsedSettings.hasOwnProperty('showCurrentStreak')) parsedSettings.showCurrentStreak = showStats;
            if (!parsedSettings.hasOwnProperty('showDailyConsistency')) parsedSettings.showDailyConsistency = showStats;
            if (!parsedSettings.hasOwnProperty('showHighGoalStat')) parsedSettings.showHighGoalStat = showStats;
        }
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
