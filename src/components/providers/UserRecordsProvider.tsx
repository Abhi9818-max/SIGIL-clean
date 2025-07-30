

"use client";

import type { RecordEntry, TaskDefinition, WeeklyProgressStats, AggregatedTimeDataPoint, UserLevelInfo, Constellation, TaskDistributionData, ProductivityByDayData, GoalProgress, Achievement, HighGoal, DailyTimeBreakdownData } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { doc, setDoc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import {
  TASK_DEFINITIONS as DEFAULT_TASK_DEFINITIONS,
  calculateUserLevelInfo,
  STREAK_MILESTONES_FOR_CRYSTALS,
  LOCAL_STORAGE_LORE_KEY, // still needed for one check
} from '@/lib/config';
import { CONSTELLATIONS } from '@/lib/constellations';
import { ACHIEVEMENTS } from '@/lib/achievements';
import {
  format,
  parseISO,
  subDays,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  subWeeks,
  isSameDay,
  startOfMonth,
  endOfMonth,
  subMonths,
  getDay,
  differenceInDays,
  isWithinInterval,
} from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";


interface UserRecordsContextType {
  records: RecordEntry[];
  addRecord: (entry: Omit<RecordEntry, 'id'>) => void;
  updateRecord: (entry: RecordEntry) => void;
  deleteRecord: (recordId: string) => void;
  getRecordsByDate: (date: string) => RecordEntry[];
  getRecordsForDateRange: (startDate: Date, endDate: Date) => RecordEntry[];
  getAggregateSum: (startDate: Date, endDate: Date, taskId?: string | null) => number;
  getYearlySum: (year: number, taskId?: string | null) => number;
  getAllRecordsStringified: () => string;
  getDailyConsistency: (days: number, taskId?: string | null) => number;
  getCurrentStreak: (taskId?: string | null) => number;
  taskDefinitions: TaskDefinition[];
  addTaskDefinition: (taskData: Omit<TaskDefinition, 'id'>) => string;
  updateTaskDefinition: (task: TaskDefinition) => void;
  deleteTaskDefinition: (taskId: string) => void;
  getTaskDefinitionById: (taskId: string) => TaskDefinition | undefined;
  getStatsForCompletedWeek: (weekOffset: number, taskId?: string | null) => WeeklyProgressStats | null;
  getWeeklyAggregatesForChart: (numberOfWeeks: number, taskId?: string | null) => AggregatedTimeDataPoint[];
  getUserLevelInfo: () => UserLevelInfo;
  totalBonusPoints: number;
  awardTierEntryBonus: (bonusAmount: number) => void;
  deductBonusPoints: (penalty: number) => void;
  // Constellations
  getAvailableSkillPoints: (taskId: string) => number;
  unlockSkill: (skillId: string, taskId: string, cost: number) => boolean;
  isSkillUnlocked: (skillId: string) => boolean;
  constellations: Constellation[];
  // Insights
  getTaskDistribution: (startDate: Date, endDate: Date, taskId?: string | null) => TaskDistributionData[];
  getProductivityByDay: (startDate: Date, endDate: Date, taskId?: string | null) => ProductivityByDayData[];
  getDailyTimeBreakdown: () => DailyTimeBreakdownData[];
  // Freeze Crystals
  freezeCrystals: number;
  useFreezeCrystal: () => void;
  // Achievements
  unlockedAchievements: string[];
  // High Goals
  highGoals: HighGoal[];
  addHighGoal: (goal: Omit<HighGoal, 'id'>) => void;
  updateHighGoal: (goal: HighGoal) => void;
  deleteHighGoal: (goalId: string) => void;
  getHighGoalProgress: (goal: HighGoal) => number;
}

const UserRecordsContext = createContext<UserRecordsContextType | undefined>(undefined);

export const UserRecordsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, userData, isUserDataLoaded } = useAuth();
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [taskDefinitions, setTaskDefinitions] = useState<TaskDefinition[]>([]);
  const [totalBonusPoints, setTotalBonusPoints] = useState<number>(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [spentSkillPoints, setSpentSkillPoints] = useState<Record<string, number>>({});
  const [unlockedSkills, setUnlockedSkills] = useState<string[]>([]);
  const [freezeCrystals, setFreezeCrystals] = useState<number>(0);
  const [awardedStreakMilestones, setAwardedStreakMilestones] = useState<Record<string, number[]>>({});
  const [highGoals, setHighGoals] = useState<HighGoal[]>([]);
  const { toast } = useToast();

  const updateUserDataInDb = useCallback(async (data: Partial<Omit<import('@/types').UserData, 'username' | 'username_lowercase'>>) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userDocRef, data, { merge: true });
      } catch (error) {
        console.error("Error updating user data in DB:", error);
      }
    }
  }, [user]);

  useEffect(() => {
    if (isUserDataLoaded && userData) {
      const defaultTasksWithIds = DEFAULT_TASK_DEFINITIONS.map(task => ({...task, id: task.id || uuidv4()}));
      setRecords(userData.records || []);
      setTaskDefinitions(userData.taskDefinitions && userData.taskDefinitions.length > 0 ? userData.taskDefinitions : defaultTasksWithIds);
      setTotalBonusPoints(userData.bonusPoints || 0);
      setUnlockedAchievements(userData.unlockedAchievements || []);
      setSpentSkillPoints(userData.spentSkillPoints || {});
      setUnlockedSkills(userData.unlockedSkills || []);
      setFreezeCrystals(userData.freezeCrystals || 0);
      setAwardedStreakMilestones(userData.awardedStreakMilestones || {});
      setHighGoals(userData.highGoals || []);
    } else if (isUserDataLoaded && !userData && user) {
        // This is a new user with no data yet, initialize with defaults
        const defaultTasks = DEFAULT_TASK_DEFINITIONS.map(task => ({ ...task, id: uuidv4() }));
        setTaskDefinitions(defaultTasks);
        setRecords([]);
        setTotalBonusPoints(0);
        setUnlockedAchievements([]);
        setSpentSkillPoints({});
        setUnlockedSkills([]);
        setFreezeCrystals(0);
        setAwardedStreakMilestones({});
        setHighGoals([]);
    }
  }, [user, userData, isUserDataLoaded]);

  const getTaskDefinitionById = useCallback((taskId: string): TaskDefinition | undefined => {
    return taskDefinitions.find(task => task.id === taskId);
  }, [taskDefinitions]);
    
  const getCurrentStreak = useCallback((taskId: string | null = null): number => {
    if (!isUserDataLoaded) return 0;
  
    const allRecords = [...records];
    let taskRelevantRecords = taskId ? allRecords.filter(r => r.taskType === taskId) : allRecords;
    const recordDates = new Set(taskRelevantRecords.map(r => r.date));
  
    const taskDef = taskId ? getTaskDefinitionById(taskId) : null;
    const isDaily = !taskDef || !taskDef.frequencyType || taskDef.frequencyType === 'daily';
  
    let currentDate = startOfDay(new Date());
    let streak = 0;
  
    // If today has no record, start checking from yesterday
    if (!recordDates.has(format(currentDate, 'yyyy-MM-dd'))) {
      currentDate = subDays(currentDate, 1);
    }
  
    if (isDaily) {
      // Daily streak logic
      while (recordDates.has(format(currentDate, 'yyyy-MM-dd'))) {
        streak++;
        currentDate = subDays(currentDate, 1);
      }
    } else {
      // Weekly streak logic
      const freqCount = taskDef?.frequencyCount || 1;
      let consecutiveWeeks = 0;
      let continueStreak = true;
  
      while (continueStreak) {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        const recordsThisWeek = [...recordDates].filter(d => 
          isWithinInterval(parseISO(d), { start: weekStart, end: weekEnd })
        ).length;
        
        if (recordsThisWeek >= freqCount) {
          consecutiveWeeks++;
          currentDate = subDays(weekStart, 1); // Move to the previous week
        } else {
          continueStreak = false;
        }
      }
      streak = consecutiveWeeks; // For weekly tasks, streak is in weeks
    }
  
    return streak;
  }, [records, getTaskDefinitionById, isUserDataLoaded]);

  const addRecord = useCallback((entry: Omit<RecordEntry, 'id'>) => {
    const newRecord: RecordEntry = {
      ...entry,
      id: uuidv4(),
      value: Number(entry.value),
    };

    const updatedRecords = [...records, newRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setRecords(updatedRecords);
    updateUserDataInDb({ records: updatedRecords });

    // Post-record addition logic for streak rewards
    if(newRecord.taskType) {
        const taskId = newRecord.taskType;
        const newStreak = getCurrentStreak(taskId);

        STREAK_MILESTONES_FOR_CRYSTALS.forEach(milestone => {
            if (newStreak >= milestone && !(awardedStreakMilestones[taskId] || []).includes(milestone)) {
                setFreezeCrystals(prev => prev + 1);
                updateUserDataInDb({ freezeCrystals: freezeCrystals + 1 });
                setAwardedStreakMilestones(prev => {
                    const updatedMilestones = {...prev, [taskId]: [...(prev[taskId] || []), milestone]};
                    updateUserDataInDb({ awardedStreakMilestones: updatedMilestones });
                    return updatedMilestones;
                });
                toast({
                    title: "❄️ Freeze Crystal Earned!",
                    description: `You've maintained a ${milestone}-day streak and earned a Freeze Crystal!`
                });
            }
        });
    }
  }, [records, getCurrentStreak, awardedStreakMilestones, toast, updateUserDataInDb, freezeCrystals]);

  const updateRecord = useCallback((entry: RecordEntry) => {
    setRecords(prevRecords => {
      const updatedRecords = prevRecords.map(r => r.id === entry.id ? { ...entry, value: Number(entry.value) } : r);
      updateUserDataInDb({ records: updatedRecords });
      return updatedRecords;
    });
  }, [updateUserDataInDb]);

  const deleteRecord = useCallback((recordId: string) => {
    setRecords(prevRecords => {
      const updatedRecords = prevRecords.filter(r => r.id !== recordId);
      updateUserDataInDb({ records: updatedRecords });
      return updatedRecords;
    });
  }, [updateUserDataInDb]);

  const getRecordsByDate = useCallback((date: string): RecordEntry[] => {
    return records.filter(r => r.date === date);
  }, [records]);

  const getRecordsForDateRange = useCallback((startDate: Date, endDate: Date): RecordEntry[] => {
    const start = startOfDay(startDate);
    const end = startOfDay(endDate);

    return records.filter(r => {
      try {
        const recordDate = startOfDay(parseISO(r.date));
        return recordDate >= start && recordDate <= end;
      } catch (e) {
        return false;
      }
    });
  }, [records]);

  const getAggregateSum = useCallback((startDate: Date, endDate: Date, taskId: string | null = null): number => {
    let relevantRecords = getRecordsForDateRange(startDate, endDate);
    if (taskId) {
      relevantRecords = relevantRecords.filter(r => r.taskType === taskId);
    }
    return relevantRecords.reduce((sum, r) => sum + (Number(r.value) || 0), 0);
  }, [getRecordsForDateRange]);

  const getYearlySum = useCallback((year: number, taskId: string | null = null): number => {
    const startDate = startOfYear(new Date(year, 0, 1));
    const endDate = endOfYear(new Date(year, 11, 31));
    return getAggregateSum(startDate, endDate, taskId);
  }, [getAggregateSum]);

  const getAllRecordsStringified = useCallback(() => {
    const formattedRecords = records.map(r => ({ date: r.date, value: r.value, taskType: r.taskType }));
    return JSON.stringify(formattedRecords);
  }, [records]);

  const getDailyConsistency = useCallback((days: number, taskId: string | null = null): number => {
    if (!isUserDataLoaded || days <= 0) return 0;
  
    const today = startOfDay(new Date());
    const startDate = startOfDay(subDays(today, days - 1));
  
    let relevantRecords = getRecordsForDateRange(startDate, today);
    
    if (taskId) {
      relevantRecords = relevantRecords.filter(r => r.taskType === taskId);
    }
    
    const recordDates = new Set(relevantRecords.map(r => r.date));
  
    if (!taskId) {
      // Overall consistency: any activity on a day counts
      const activeDays = new Set(relevantRecords.map(r => r.date)).size;
      return Math.round((activeDays / days) * 100);
    }
  
    const taskDef = getTaskDefinitionById(taskId);
    if (!taskDef || taskDef.frequencyType === 'daily' || !taskDef.frequencyType) {
      // Daily task consistency
      const activeDays = new Set(relevantRecords.filter(r => r.taskType === taskId).map(r => r.date)).size;
      return Math.round((activeDays / days) * 100);
    } else {
      // Weekly task consistency
      const freqCount = taskDef.frequencyCount || 1;
      let totalWeeks = 0;
      let successfulWeeks = 0;
      let currentDate = today;
  
      while(currentDate >= startDate) {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  
        const recordsThisWeek = [...recordDates].filter(dateStr => {
          const d = parseISO(dateStr);
          return isWithinInterval(d, { start: weekStart, end: weekEnd })
        }).length;
  
        if(isWithinInterval(weekStart, {start: startDate, end: today}) || isWithinInterval(weekEnd, {start: startDate, end: today})) {
            totalWeeks++;
            if (recordsThisWeek >= freqCount) {
                successfulWeeks++;
            }
        }
        currentDate = subDays(weekStart, 1);
      }
      
      if (totalWeeks === 0) return 100; // or 0, depending on desired behavior for no full weeks
      return Math.round((successfulWeeks / totalWeeks) * 100);
    }
  
  }, [getRecordsForDateRange, getTaskDefinitionById, records, taskDefinitions, isUserDataLoaded]);

  const addTaskDefinition = useCallback((taskData: Omit<TaskDefinition, 'id'>): string => {
    const newId = uuidv4();
    const newTask: TaskDefinition = {
      ...taskData,
      id: newId,
    };
    setTaskDefinitions(prevTasks => {
      const updatedTasks = [...prevTasks, newTask];
      updateUserDataInDb({ taskDefinitions: updatedTasks });
      return updatedTasks;
    });
    return newId;
  }, [updateUserDataInDb]);

  const updateTaskDefinition = useCallback((updatedTask: TaskDefinition) => {
    setTaskDefinitions(prevTasks => {
      const updatedTasks = prevTasks.map(task => task.id === updatedTask.id ? { ...updatedTask } : task);
      updateUserDataInDb({ taskDefinitions: updatedTasks });
      return updatedTasks;
    });
  }, [updateUserDataInDb]);

  const deleteTaskDefinition = useCallback((taskId: string) => {
    setTaskDefinitions(prevTasks => {
      const updatedTasks = prevTasks.filter(task => task.id !== taskId);
      updateUserDataInDb({ taskDefinitions: updatedTasks });
      return updatedTasks;
    });
    setRecords(prevRecords => {
      const updatedRecords = prevRecords.map(rec => rec.taskType === taskId ? {...rec, taskType: undefined} : rec);
      updateUserDataInDb({ records: updatedRecords });
      return updatedRecords;
    });
  }, [updateUserDataInDb]);

  const getStatsForCompletedWeek = useCallback((weekOffset: number, taskId?: string | null): WeeklyProgressStats | null => {
    if (records.length === 0) return null;
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const targetWeekStart = subWeeks(currentWeekStart, weekOffset);
    let targetWeekEnd = endOfWeek(targetWeekStart, { weekStartsOn: 1 });

    if (targetWeekEnd > today) {
        targetWeekEnd = today;
    }
    
    if (targetWeekStart > today) {
        return { total: 0, startDate: targetWeekStart, endDate: targetWeekEnd };
    }

    const sum = getAggregateSum(targetWeekStart, targetWeekEnd, taskId);
    return { total: sum, startDate: targetWeekStart, endDate: targetWeekEnd };

  }, [records, getAggregateSum]);

  const getWeeklyAggregatesForChart = useCallback((numberOfWeeks: number, taskId?: string | null): AggregatedTimeDataPoint[] => {
    if (records.length === 0) return [];
    const today = new Date();
    const data: AggregatedTimeDataPoint[] = [];
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });

    for (let i = numberOfWeeks -1; i >= 0; i--) {
      const weekStartDate = subWeeks(currentWeekStart, i);
      if (weekStartDate > today && !isSameDay(weekStartDate, startOfWeek(today, {weekStartsOn:1}))) continue;

      const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
      const sum = getAggregateSum(weekStartDate, (weekEndDate > today ? today : weekEndDate), taskId);

      data.push({
        date: format(weekStartDate, 'MMM d'),
        value: sum,
      });
    }
    return data;
  }, [records, getAggregateSum]);

  const getTotalBaseRecordValue = useCallback((): number => {
    return records.reduce((sum, record) => sum + (Number(record.value) || 0), 0);
  }, [records]);

  const getUserLevelInfo = useCallback((): UserLevelInfo => {
    const sumOfRecordValues = getTotalBaseRecordValue();
    const totalExperience = sumOfRecordValues + totalBonusPoints;
    return calculateUserLevelInfo(totalExperience);
  }, [getTotalBaseRecordValue, totalBonusPoints]);

  const awardTierEntryBonus = useCallback((bonusAmount: number) => {
    if (bonusAmount > 0) {
      setTotalBonusPoints(prevBonus => {
        const newBonus = prevBonus + bonusAmount;
        updateUserDataInDb({ bonusPoints: newBonus });
        return newBonus;
      });
    }
  }, [updateUserDataInDb]);

  const deductBonusPoints = useCallback((penalty: number) => {
    setTotalBonusPoints(prevBonus => {
      const newBonus = prevBonus - Math.abs(penalty);
      updateUserDataInDb({ bonusPoints: newBonus });
      return newBonus;
    });
  }, [updateUserDataInDb]);

  const useFreezeCrystal = useCallback(() => {
    if (freezeCrystals > 0) {
        setFreezeCrystals(prev => {
          const newCrystals = prev - 1;
          updateUserDataInDb({ freezeCrystals: newCrystals });
          return newCrystals;
        });
    }
  }, [freezeCrystals, updateUserDataInDb]);


  // Constellation Functions
  const getAvailableSkillPoints = useCallback((taskId: string): number => {
    if (records.length === 0) return 0;
    // Skill points are equivalent to the total value recorded for a task
    const totalPoints = getAggregateSum(new Date("1900-01-01"), new Date(), taskId);
    const spentPoints = spentSkillPoints[taskId] || 0;
    return totalPoints - spentPoints;
  }, [records, getAggregateSum, spentSkillPoints]);

  const isSkillUnlocked = useCallback((skillId: string): boolean => {
    return unlockedSkills.includes(skillId);
  }, [unlockedSkills]);

  const unlockSkill = useCallback((skillId: string, taskId: string, cost: number): boolean => {
    const availablePoints = getAvailableSkillPoints(taskId);
    if (availablePoints >= cost && !isSkillUnlocked(skillId)) {
      setSpentSkillPoints(prev => {
        const updatedPoints = { ...prev, [taskId]: (prev[taskId] || 0) + cost };
        updateUserDataInDb({ spentSkillPoints: updatedPoints });
        return updatedPoints;
      });
      setUnlockedSkills(prev => {
        const updatedSkills = [...prev, skillId];
        updateUserDataInDb({ unlockedSkills: updatedSkills });
        return updatedSkills;
      });
      return true;
    }
    return false;
  }, [getAvailableSkillPoints, isSkillUnlocked, updateUserDataInDb]);

  const constellations = useMemo(() => CONSTELLATIONS, []);

  // Insights Functions
  const getTaskDistribution = useCallback((startDate: Date, endDate: Date, taskId: string | null = null): TaskDistributionData[] => {
    let relevantRecords = getRecordsForDateRange(startDate, endDate);
    if (taskId) {
        relevantRecords = relevantRecords.filter(r => r.taskType === taskId);
    }
    const distribution = new Map<string, { value: number; color: string; name: string }>();

    relevantRecords.forEach(record => {
      const taskDef = record.taskType ? getTaskDefinitionById(record.taskType) : undefined;
      const effectiveTaskId = taskDef?.id || 'unassigned';
      const taskName = taskDef?.name || 'Unassigned';
      const taskColor = taskDef?.color || '#8884d8';

      const current = distribution.get(effectiveTaskId) || { value: 0, color: taskColor, name: taskName };
      current.value += record.value;
      distribution.set(effectiveTaskId, current);
    });

    return Array.from(distribution.entries()).map(([_, data]) => ({
      name: data.name,
      value: data.value,
      fill: data.name,
    }));
  }, [getRecordsForDateRange, getTaskDefinitionById]);

  const getProductivityByDay = useCallback((startDate: Date, endDate: Date, taskId: string | null = null): ProductivityByDayData[] => {
    let relevantRecords = getRecordsForDateRange(startDate, endDate);
     if (taskId) {
        relevantRecords = relevantRecords.filter(r => r.taskType === taskId);
    }
    const dayTotals = [
        { day: 'Sun', total: 0 }, { day: 'Mon', total: 0 }, { day: 'Tue', total: 0 }, 
        { day: 'Wed', total: 0 }, { day: 'Thu', total: 0 }, { day: 'Fri', total: 0 }, { day: 'Sat', total: 0 }
    ];

    relevantRecords.forEach(record => {
        try {
            const dayOfWeek = getDay(parseISO(record.date)); // 0 for Sunday, 1 for Monday, etc.
            dayTotals[dayOfWeek].total += record.value;
        } catch(e) {
            // Ignore invalid dates
        }
    });

    return dayTotals;
  }, [getRecordsForDateRange]);

  const getDailyTimeBreakdown = useCallback((): DailyTimeBreakdownData[] => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todaysRecords = getRecordsByDate(todayStr);
    
    const timeBasedTasks = taskDefinitions.filter(t => t.unit === 'minutes' || t.unit === 'hours');
    if (timeBasedTasks.length === 0) return [];
    
    const timeBreakdown = new Map<string, { name: string; value: number; color: string }>();
    let totalMinutes = 0;

    todaysRecords.forEach(record => {
      if (!record.taskType) return;
      const task = getTaskDefinitionById(record.taskType);
      if (task && (task.unit === 'minutes' || task.unit === 'hours')) {
        const minutes = task.unit === 'hours' ? record.value * 60 : record.value;
        const current = timeBreakdown.get(task.id) || { name: task.name, value: 0, color: task.color };
        current.value += minutes;
        timeBreakdown.set(task.id, current);
        totalMinutes += minutes;
      }
    });

    const result: DailyTimeBreakdownData[] = Array.from(timeBreakdown.values());
    
    const remainingMinutes = 1440 - totalMinutes;
    if (remainingMinutes > 0) {
      result.push({
        name: 'Unallocated',
        value: remainingMinutes,
        color: 'hsl(var(--muted))'
      });
    }

    return result;
  }, [getRecordsByDate, taskDefinitions, getTaskDefinitionById]);

  // Achievement Check
  const checkAchievements = useCallback(() => {
    const levelInfo = getUserLevelInfo();
    const streaks: Record<string, number> = {};
    taskDefinitions.forEach(task => {
        streaks[task.id] = getCurrentStreak(task.id);
    });
    const unlockedSkillCount = unlockedSkills.length;
    let loreEntryCount = 0;
    try {
        const storedLore = localStorage.getItem(LOCAL_STORAGE_LORE_KEY);
        if (storedLore) {
            loreEntryCount = JSON.parse(storedLore).length;
        }
    } catch {}

    const context = { levelInfo, streaks, unlockedSkillCount, loreEntryCount };
    
    const newlyUnlocked: string[] = [];
    ACHIEVEMENTS.forEach(ach => {
      if (!unlockedAchievements.includes(ach.id) && ach.check(context)) {
        newlyUnlocked.push(ach.id);
        toast({
          title: `🏆 Achievement Unlocked!`,
          description: ach.name,
        });
      }
    });

    if (newlyUnlocked.length > 0) {
      setUnlockedAchievements(prev => {
        const updatedAchievements = [...new Set([...prev, ...newlyUnlocked])];
        updateUserDataInDb({ unlockedAchievements: updatedAchievements });
        return updatedAchievements;
      });
    }
  }, [getUserLevelInfo, taskDefinitions, getCurrentStreak, unlockedSkills.length, unlockedAchievements, toast, updateUserDataInDb]);

  useEffect(() => {
    if (isUserDataLoaded) {
      checkAchievements();
    }
  }, [records, totalBonusPoints, unlockedSkills, isUserDataLoaded, checkAchievements]);

  // High Goal Functions
  const addHighGoal = useCallback((goalData: Omit<HighGoal, 'id'>) => {
    const newGoal: HighGoal = { ...goalData, id: uuidv4() };
    setHighGoals(prev => {
        const updatedGoals = [...prev, newGoal];
        updateUserDataInDb({ highGoals: updatedGoals });
        return updatedGoals;
    });
  }, [updateUserDataInDb]);

  const updateHighGoal = useCallback((updatedGoal: HighGoal) => {
    setHighGoals(prev => {
        const updatedGoals = prev.map(g => g.id === updatedGoal.id ? updatedGoal : g);
        updateUserDataInDb({ highGoals: updatedGoals });
        return updatedGoals;
    });
  }, [updateUserDataInDb]);

  const deleteHighGoal = useCallback((goalId: string) => {
    setHighGoals(prev => {
        const updatedGoals = prev.filter(g => g.id !== goalId);
        updateUserDataInDb({ highGoals: updatedGoals });
        return updatedGoals;
    });
  }, [updateUserDataInDb]);
  
  const getHighGoalProgress = useCallback((goal: HighGoal) => {
    return getAggregateSum(parseISO(goal.startDate), parseISO(goal.endDate), goal.taskId);
  }, [getAggregateSum]);

  const contextValue = useMemo(() => ({
    records,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecordsByDate,
    getRecordsForDateRange,
    getAggregateSum,
    getYearlySum,
    getAllRecordsStringified,
    getDailyConsistency,
    getCurrentStreak,
    taskDefinitions,
    addTaskDefinition,
    updateTaskDefinition,
    deleteTaskDefinition,
    getTaskDefinitionById,
    getStatsForCompletedWeek,
    getWeeklyAggregatesForChart,
    getUserLevelInfo,
    totalBonusPoints,
    awardTierEntryBonus,
    deductBonusPoints,
    getAvailableSkillPoints,
    unlockSkill,
    isSkillUnlocked,
    constellations,
    getTaskDistribution,
    getProductivityByDay,
    getDailyTimeBreakdown,
    freezeCrystals,
    useFreezeCrystal,
    unlockedAchievements,
    highGoals,
    addHighGoal,
    updateHighGoal,
    deleteHighGoal,
    getHighGoalProgress,
  }), [
    records,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecordsByDate,
    getRecordsForDateRange,
    getAggregateSum,
    getYearlySum,
    getAllRecordsStringified,
    getDailyConsistency,
    getCurrentStreak,
    taskDefinitions,
    addTaskDefinition,
    updateTaskDefinition,
    deleteTaskDefinition,
    getTaskDefinitionById,
    getStatsForCompletedWeek,
    getWeeklyAggregatesForChart,
    getUserLevelInfo,
    totalBonusPoints,
    awardTierEntryBonus,
    deductBonusPoints,
    getAvailableSkillPoints,
    unlockSkill,
    isSkillUnlocked,
    constellations,
    getTaskDistribution,
    getProductivityByDay,
    getDailyTimeBreakdown,
    freezeCrystals,
    useFreezeCrystal,
    unlockedAchievements,
    highGoals,
    addHighGoal,
    updateHighGoal,
    deleteHighGoal,
    getHighGoalProgress,
    checkAchievements
  ]);


  return (
    <UserRecordsContext.Provider value={contextValue}>
      {children}
    </UserRecordsContext.Provider>
  );
};

export const useUserRecords = (): UserRecordsContextType => {
  const context = useContext(UserRecordsContext);
  if (context === undefined) {
    throw new Error('useUserRecords must be used within a UserRecordsProvider');
  }
  return context;
};
