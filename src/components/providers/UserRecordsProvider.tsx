

"use client";

import type { RecordEntry, TaskDefinition, WeeklyProgressStats, AggregatedTimeDataPoint, UserLevelInfo, AutomatedGoalCheckResult, Constellation, TaskDistributionData, ProductivityByDayData, BreachCheckResult, DarkStreakCheckResult } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import {
  LOCAL_STORAGE_KEY,
  LOCAL_STORAGE_TASKS_KEY,
  LOCAL_STORAGE_BONUS_POINTS_KEY,
  LOCAL_STORAGE_MET_GOALS_KEY,
  LOCAL_STORAGE_HANDLED_STREAKS_KEY,
  LOCAL_STORAGE_TODO_KEY,
  LOCAL_STORAGE_SPENT_SKILL_POINTS_KEY,
  LOCAL_STORAGE_UNLOCKED_SKILLS_KEY,
  LOCAL_STORAGE_HANDLED_DARK_STREAKS_KEY,
  TASK_DEFINITIONS as DEFAULT_TASK_DEFINITIONS,
  calculateUserLevelInfo,
  CONSISTENCY_BREACH_DAYS,
  CONSISTENCY_BREACH_PENALTY,
  DARK_STREAK_PENALTY
} from '@/lib/config';
import { CONSTELLATIONS } from '@/lib/constellations';
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
} from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { generateDare } from '@/ai/flows/dare-flow';

interface UserRecordsContextType {
  records: RecordEntry[];
  addRecord: (entry: Omit<RecordEntry, 'notes'> & { notes?: string; taskType?: string }) => void;
  updateRecord: (entry: RecordEntry) => void;
  deleteRecord: (date: string) => void;
  getRecordByDate: (date: string) => RecordEntry | undefined;
  getRecordsForDateRange: (startDate: Date, endDate: Date) => RecordEntry[];
  getAggregateSum: (startDate: Date, endDate: Date, taskId?: string | null) => number;
  getYearlySum: (year: number, taskId?: string | null) => number;
  getAllRecordsStringified: () => string;
  getDailyConsistencyLast30Days: (taskId?: string | null) => number;
  getCurrentStreak: () => number;
  taskDefinitions: TaskDefinition[];
  addTaskDefinition: (taskData: Omit<TaskDefinition, 'id'>) => string;
  updateTaskDefinition: (task: TaskDefinition) => void;
  deleteTaskDefinition: (taskId: string) => void;
  getTaskDefinitionById: (taskId: string) => TaskDefinition | undefined;
  getStatsForCompletedWeek: (weekOffset: number, taskId?: string | null) => WeeklyProgressStats | null;
  getWeeklyAggregatesForChart: (numberOfWeeks: number, taskId?: string | null) => AggregatedTimeDataPoint[];
  getUserLevelInfo: () => UserLevelInfo;
  awardGoalCompletionBonus: (taskId: string) => number | null;
  totalBonusPoints: number;
  checkAndAwardAutomatedGoal: (taskId: string) => Promise<AutomatedGoalCheckResult>;
  awardTierEntryBonus: (bonusAmount: number) => void;
  isGoalMetForLastPeriod: (taskId: string) => boolean;
  deductBonusPoints: (penalty: number) => void;
  handleConsistencyCheck: () => BreachCheckResult;
  // Dark Streak
  checkDarkStreaks: () => Promise<DarkStreakCheckResult | null>;
  markDarkStreakHandled: (taskId: string) => void;
  // Constellations
  getAvailableSkillPoints: (taskId: string) => number;
  unlockSkill: (skillId: string, taskId: string, cost: number) => boolean;
  isSkillUnlocked: (skillId: string) => boolean;
  constellations: Constellation[];
  // Insights
  getTaskDistribution: (startDate: Date, endDate: Date) => TaskDistributionData[];
  getProductivityByDay: (startDate: Date, endDate: Date) => ProductivityByDayData[];
}

const UserRecordsContext = createContext<UserRecordsContextType | undefined>(undefined);

export const UserRecordsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [taskDefinitions, setTaskDefinitions] = useState<TaskDefinition[]>([]);
  const [totalBonusPoints, setTotalBonusPoints] = useState<number>(0);
  const [metGoals, setMetGoals] = useState<Record<string, string>>({}); // New state for met goals
  const [handledStreaks, setHandledStreaks] = useState<Record<string, boolean>>({});
  const [handledDarkStreaks, setHandledDarkStreaks] = useState<Record<string, string>>({});
  const [spentSkillPoints, setSpentSkillPoints] = useState<Record<string, number>>({});
  const [unlockedSkills, setUnlockedSkills] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedRecords = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedRecords) {
        setRecords(JSON.parse(storedRecords));
      }
    } catch (error) {
      console.error("Failed to load records from localStorage:", error);
    }

    try {
      const storedTasks = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks) as TaskDefinition[];
        if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
            setTaskDefinitions(parsedTasks.map(task => ({
                ...task,
                id: task.id || uuidv4(),
                goalValue: task.goalValue,
                goalInterval: task.goalInterval,
                intensityThresholds: task.intensityThresholds,
                goalCompletionBonusPercentage: task.goalCompletionBonusPercentage,
                darkStreakEnabled: task.darkStreakEnabled ?? false,
            })));
        } else {
            const defaultTasksWithId = DEFAULT_TASK_DEFINITIONS.map(task => ({...task, id: task.id || uuidv4()}));
            setTaskDefinitions(defaultTasksWithId);
            localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(defaultTasksWithId));
        }
      } else {
        const defaultTasksWithId = DEFAULT_TASK_DEFINITIONS.map(task => ({...task, id: task.id || uuidv4()}));
        setTaskDefinitions(defaultTasksWithId);
        localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(defaultTasksWithId));
      }
    } catch (error) {
      console.error("Failed to load task definitions from localStorage:", error);
      setTaskDefinitions(DEFAULT_TASK_DEFINITIONS.map(task => ({...task, id: task.id || uuidv4()})));
    }

    try {
      const storedBonusPoints = localStorage.getItem(LOCAL_STORAGE_BONUS_POINTS_KEY);
      if (storedBonusPoints) {
        setTotalBonusPoints(JSON.parse(storedBonusPoints));
      }
    } catch (error) {
      console.error("Failed to load bonus points from localStorage:", error);
    }

    try {
      const storedMetGoals = localStorage.getItem(LOCAL_STORAGE_MET_GOALS_KEY);
      if (storedMetGoals) {
        setMetGoals(JSON.parse(storedMetGoals));
      }
    } catch (error) {
      console.error("Failed to load met goals from localStorage:", error);
    }
    
    try {
      const storedHandledStreaks = localStorage.getItem(LOCAL_STORAGE_HANDLED_STREAKS_KEY);
      if (storedHandledStreaks) {
        setHandledStreaks(JSON.parse(storedHandledStreaks));
      }
    } catch (error) {
        console.error("Failed to load handled streaks from localStorage:", error);
    }
    
    try {
      const storedHandledDarkStreaks = localStorage.getItem(LOCAL_STORAGE_HANDLED_DARK_STREAKS_KEY);
      if (storedHandledDarkStreaks) {
        setHandledDarkStreaks(JSON.parse(storedHandledDarkStreaks));
      }
    } catch (error) {
        console.error("Failed to load handled dark streaks from localStorage:", error);
    }

    try {
        const storedSpentPoints = localStorage.getItem(LOCAL_STORAGE_SPENT_SKILL_POINTS_KEY);
        if (storedSpentPoints) {
            setSpentSkillPoints(JSON.parse(storedSpentPoints));
        }
    } catch (error) {
        console.error("Failed to load spent skill points from localStorage:", error);
    }

    try {
        const storedUnlockedSkills = localStorage.getItem(LOCAL_STORAGE_UNLOCKED_SKILLS_KEY);
        if (storedUnlockedSkills) {
            setUnlockedSkills(JSON.parse(storedUnlockedSkills));
        }
    } catch (error) {
        console.error("Failed to load unlocked skills from localStorage:", error);
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
      } catch (error) {
        console.error("Failed to save records to localStorage:", error);
      }
    }
  }, [records, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(taskDefinitions));
      } catch (error) {
        console.error("Failed to save task definitions to localStorage:", error);
      }
    }
  }, [taskDefinitions, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(LOCAL_STORAGE_BONUS_POINTS_KEY, JSON.stringify(totalBonusPoints));
      } catch (error) {
        console.error("Failed to save bonus points to localStorage:", error);
      }
    }
  }, [totalBonusPoints, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(LOCAL_STORAGE_MET_GOALS_KEY, JSON.stringify(metGoals));
      } catch (error) {
        console.error("Failed to save met goals to localStorage:", error);
      }
    }
  }, [metGoals, isLoaded]);

   useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(LOCAL_STORAGE_HANDLED_STREAKS_KEY, JSON.stringify(handledStreaks));
      } catch (error) {
        console.error("Failed to save handled streaks to localStorage:", error);
      }
    }
  }, [handledStreaks, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(LOCAL_STORAGE_HANDLED_DARK_STREAKS_KEY, JSON.stringify(handledDarkStreaks));
      } catch (error) {
        console.error("Failed to save handled dark streaks to localStorage:", error);
      }
    }
  }, [handledDarkStreaks, isLoaded]);


  useEffect(() => {
    if (isLoaded) {
        try {
            localStorage.setItem(LOCAL_STORAGE_SPENT_SKILL_POINTS_KEY, JSON.stringify(spentSkillPoints));
        } catch (error) {
            console.error("Failed to save spent skill points to localStorage:", error);
        }
    }
  }, [spentSkillPoints, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
        try {
            localStorage.setItem(LOCAL_STORAGE_UNLOCKED_SKILLS_KEY, JSON.stringify(unlockedSkills));
        } catch (error) {
            console.error("Failed to save unlocked skills to localStorage:", error);
        }
    }
  }, [unlockedSkills, isLoaded]);


  const addRecord = useCallback((entry: Omit<RecordEntry, 'notes'> & { notes?: string; taskType?: string }) => {
    setRecords(prevRecords => {
      const existingRecordIndex = prevRecords.findIndex(r => r.date === entry.date);
      const newRecordData: RecordEntry = {
        date: entry.date,
        value: Number(entry.value),
        notes: entry.notes,
        taskType: entry.taskType,
      };
      if (existingRecordIndex > -1) {
        const updatedRecords = [...prevRecords];
        updatedRecords[existingRecordIndex] = { ...updatedRecords[existingRecordIndex], ...newRecordData };
        return updatedRecords;
      }
      return [...prevRecords, newRecordData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
  }, []);

  const updateRecord = useCallback((entry: RecordEntry) => {
    setRecords(prevRecords =>
      prevRecords.map(r => r.date === entry.date ? { ...entry, value: Number(entry.value) } : r)
    );
  }, []);

  const deleteRecord = useCallback((date: string) => {
    setRecords(prevRecords => prevRecords.filter(r => r.date !== date));
  }, []);

  const getRecordByDate = useCallback((date: string): RecordEntry | undefined => {
    return records.find(r => r.date === date);
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

  const getDailyConsistencyLast30Days = useCallback((taskId: string | null = null): number => {
    if (!isLoaded) return 0;
    const today = startOfDay(new Date());
    const thirtyDaysAgo = startOfDay(subDays(today, 29));

    let relevantRecords = getRecordsForDateRange(thirtyDaysAgo, today);
    if (taskId) {
      relevantRecords = relevantRecords.filter(r => r.taskType === taskId);
    }

    const uniqueDaysWithRecords = new Set(relevantRecords.map(r => r.date)).size;

    const daysInPeriod = eachDayOfInterval({ start: thirtyDaysAgo, end: today }).length;
    if (daysInPeriod === 0) return 0;

    return Math.round((uniqueDaysWithRecords / daysInPeriod) * 100);
  }, [getRecordsForDateRange, isLoaded]);
  
  const getCurrentStreak = useCallback((): number => {
    if (!isLoaded || records.length === 0) return 0;

    const sortedRecords = [...records].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    const recordDates = new Set(sortedRecords.map(r => r.date));
    
    let currentDate = startOfDay(new Date());
    
    // If there's no record for today, the current streak is 0, unless the last record was yesterday.
    if (!recordDates.has(format(currentDate, 'yyyy-MM-dd'))) {
      currentDate = subDays(currentDate, 1);
      // If there's also no record for yesterday, streak is definitely 0.
      if (!recordDates.has(format(currentDate, 'yyyy-MM-dd'))) {
        return 0;
      }
    }

    let streak = 0;
    while (recordDates.has(format(currentDate, 'yyyy-MM-dd'))) {
        streak++;
        currentDate = subDays(currentDate, 1);
    }

    return streak;
  }, [isLoaded, records]);


  const addTaskDefinition = useCallback((taskData: Omit<TaskDefinition, 'id'>): string => {
    const newId = uuidv4();
    const goalValue = taskData.goalValue === undefined || taskData.goalValue === null || Number(taskData.goalValue) <= 0 ? undefined : Number(taskData.goalValue);
    const newTask: TaskDefinition = {
      ...taskData,
      id: newId,
      goalValue: goalValue,
      goalInterval: goalValue ? taskData.goalInterval : undefined,
    };
    setTaskDefinitions(prevTasks => [...prevTasks, newTask]);
    return newId;
  }, []);

  const updateTaskDefinition = useCallback((updatedTask: TaskDefinition) => {
    const goalValue = updatedTask.goalValue === undefined || updatedTask.goalValue === null || Number(updatedTask.goalValue) <= 0 ? undefined : Number(updatedTask.goalValue);
    setTaskDefinitions(prevTasks =>
      prevTasks.map(task => task.id === updatedTask.id ? {
        ...updatedTask,
        goalValue: goalValue,
        goalInterval: goalValue ? updatedTask.goalInterval : undefined,
      } : task)
    );
  }, []);

  const deleteTaskDefinition = useCallback((taskId: string) => {
    setTaskDefinitions(prevTasks => prevTasks.filter(task => task.id !== taskId));
    setRecords(prevRecords =>
      prevRecords.map(rec =>
        rec.taskType === taskId ? {...rec, taskType: undefined} : rec
      )
    );
    // Also remove from metGoals if the task is deleted
    setMetGoals(prevMetGoals => {
        const newMetGoals = {...prevMetGoals};
        delete newMetGoals[taskId];
        return newMetGoals;
    });
  }, []);

  const getTaskDefinitionById = useCallback((taskId: string): TaskDefinition | undefined => {
    return taskDefinitions.find(task => task.id === taskId);
  }, [taskDefinitions]);

  const getStatsForCompletedWeek = useCallback((weekOffset: number, taskId?: string | null): WeeklyProgressStats | null => {
    if (!isLoaded) return null;
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const targetWeekStart = subWeeks(currentWeekStart, weekOffset + 1);
    const targetWeekEnd = endOfWeek(targetWeekStart, { weekStartsOn: 1 });

     if (targetWeekStart >= currentWeekStart && !isSameDay(targetWeekStart, currentWeekStart)) {
        return null;
    }

    const sum = getAggregateSum(targetWeekStart, targetWeekEnd, taskId);
    return { total: sum, startDate: targetWeekStart, endDate: targetWeekEnd };

  }, [isLoaded, getAggregateSum]);

  const getWeeklyAggregatesForChart = useCallback((numberOfWeeks: number, taskId?: string | null): AggregatedTimeDataPoint[] => {
    if (!isLoaded) return [];
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
  }, [isLoaded, getAggregateSum]);

  const getTotalBaseRecordValue = useCallback((): number => {
    if (!isLoaded) return 0;
    return records.reduce((sum, record) => sum + (Number(record.value) || 0), 0);
  }, [records, isLoaded]);

  const getUserLevelInfo = useCallback((): UserLevelInfo => {
    const sumOfRecordValues = getTotalBaseRecordValue();
    const totalExperience = sumOfRecordValues + totalBonusPoints;
    return calculateUserLevelInfo(totalExperience);
  }, [getTotalBaseRecordValue, totalBonusPoints]);

  const awardGoalCompletionBonus = useCallback((taskId: string): number | null => {
    const task = getTaskDefinitionById(taskId);
    if (task && task.goalValue && task.goalCompletionBonusPercentage) {
      const bonus = Math.round(task.goalValue * (task.goalCompletionBonusPercentage / 100));
      setTotalBonusPoints(prevBonus => prevBonus + bonus);
      return bonus;
    }
    return null;
  }, [getTaskDefinitionById]);

  const awardTierEntryBonus = useCallback((bonusAmount: number) => {
    if (bonusAmount > 0) {
      setTotalBonusPoints(prevBonus => prevBonus + bonusAmount);
    }
  }, []);

  const checkAndAwardAutomatedGoal = useCallback(async (taskId: string): Promise<AutomatedGoalCheckResult> => {
    const task = getTaskDefinitionById(taskId);
    if (!task || !task.goalValue || !task.goalInterval || task.goalValue <= 0) {
      return { error: "Goal not properly configured for this task." };
    }

    const today = new Date();
    let periodStart: Date;
    let periodEnd: Date;
    let periodName: string;

    switch (task.goalInterval) {
      case 'daily':
        periodStart = startOfDay(subDays(today, 1));
        periodEnd = endOfDay(subDays(today, 1));
        periodName = "yesterday";
        break;
      case 'weekly':
        periodStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        periodEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        periodName = `last week (${format(periodStart, 'MMM d')} - ${format(periodEnd, 'MMM d')})`;
        break;
      case 'monthly':
        periodStart = startOfMonth(subMonths(today, 1));
        periodEnd = endOfMonth(subMonths(today, 1));
        periodName = `last month (${format(periodStart, 'MMMM yyyy')})`;
        break;
      default:
        return { error: "Invalid goal interval." };
    }

    const actualValue = getAggregateSum(periodStart, periodEnd, taskId);
    let bonusAwarded: number | null = null;
    let metGoal = false;
    const periodIdentifierStr = format(periodEnd, 'yyyy-MM-dd');

    if (actualValue >= task.goalValue) {
      metGoal = true;
      if (task.goalCompletionBonusPercentage && task.goalCompletionBonusPercentage > 0) {
        bonusAwarded = awardGoalCompletionBonus(taskId);
      }
      // Store that this goal was met for this period
      setMetGoals(prev => ({ ...prev, [taskId]: periodIdentifierStr }));
    }

    return {
      metGoal,
      bonusAwarded,
      actualValue,
      goalValue: task.goalValue,
      periodName,
      periodIdentifier: periodIdentifierStr,
      taskName: task.name,
    };
  }, [getTaskDefinitionById, getAggregateSum, awardGoalCompletionBonus]);

  const isGoalMetForLastPeriod = useCallback((taskId: string): boolean => {
    const task = getTaskDefinitionById(taskId);
    if (!task || !task.goalInterval || !isLoaded) return false;

    const today = new Date();
    let expectedPeriodEnd: Date;

    switch (task.goalInterval) {
      case 'daily':
        expectedPeriodEnd = endOfDay(subDays(today, 1));
        break;
      case 'weekly':
        expectedPeriodEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        break;
      case 'monthly':
        expectedPeriodEnd = endOfMonth(subMonths(today, 1));
        break;
      default:
        return false;
    }
    const expectedPeriodIdentifier = format(expectedPeriodEnd, 'yyyy-MM-dd');
    return metGoals[taskId] === expectedPeriodIdentifier;
  }, [metGoals, getTaskDefinitionById, isLoaded]);

  const deductBonusPoints = useCallback((penalty: number) => {
    const actualPenalty = Math.abs(penalty) * -1;
    setTotalBonusPoints(prevBonus => prevBonus + actualPenalty);
  }, []);

  const handleConsistencyCheck = useCallback((): BreachCheckResult => {
    const result: BreachCheckResult = {
        breachDetected: false,
        lastRecordDate: null,
        daysSince: null,
        penalty: 0,
    };

    if (records.length === 0) return result;

    const sortedRecords = [...records].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    const lastRecordDate = parseISO(sortedRecords[0].date);
    const today = startOfDay(new Date());

    const daysSince = differenceInDays(today, lastRecordDate);

    result.lastRecordDate = format(lastRecordDate, 'yyyy-MM-dd');
    result.daysSince = daysSince;

    if (daysSince >= CONSISTENCY_BREACH_DAYS) {
        const breachKey = format(lastRecordDate, 'yyyy-MM-dd');
        if (!handledStreaks[breachKey]) {
            result.breachDetected = true;
            result.penalty = CONSISTENCY_BREACH_PENALTY;
            deductBonusPoints(CONSISTENCY_BREACH_PENALTY);
            setHandledStreaks(prev => ({ ...prev, [breachKey]: true }));
        }
    }

    return result;
  }, [records, handledStreaks, deductBonusPoints]);

  const checkDarkStreaks = useCallback(async (): Promise<DarkStreakCheckResult | null> => {
    if (!isLoaded) return null;

    const darkStreakTasks = taskDefinitions.filter(t => t.darkStreakEnabled);
    if (darkStreakTasks.length === 0) return null;

    const yesterday = startOfDay(subDays(new Date(), 1));
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
    const recordsByDate = new Map<string, RecordEntry[]>();
    records.forEach(rec => {
        if (!recordsByDate.has(rec.date)) recordsByDate.set(rec.date, []);
        recordsByDate.get(rec.date)!.push(rec);
    });
    
    const yesterdayRecords = recordsByDate.get(yesterdayStr) || [];

    for (const task of darkStreakTasks) {
        const wasTaskDoneYesterday = yesterdayRecords.some(r => r.taskType === task.id);
        const wasHandled = handledDarkStreaks[task.id] === yesterdayStr;

        if (!wasTaskDoneYesterday && !wasHandled) {
            deductBonusPoints(DARK_STREAK_PENALTY);

            try {
                const levelInfo = getUserLevelInfo();
                const dareResult = await generateDare({ 
                    level: levelInfo.currentLevel, 
                    taskName: task.name, 
                    isGlobalStreak: false 
                });

                return {
                    taskId: task.id,
                    taskName: task.name,
                    streakBroken: true,
                    penalty: DARK_STREAK_PENALTY,
                    dare: dareResult.dare
                };
            } catch (error) {
                console.error(`Failed to generate dare for task ${task.name}:`, error);
                return {
                    taskId: task.id,
                    taskName: task.name,
                    streakBroken: true,
                    penalty: DARK_STREAK_PENALTY,
                    dare: "The spirits are silent. Meditate on your failure."
                };
            }
        }
    }

    return null; // No broken dark streaks
  }, [isLoaded, taskDefinitions, records, handledDarkStreaks, deductBonusPoints, getUserLevelInfo]);

  const markDarkStreakHandled = useCallback((taskId: string) => {
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    setHandledDarkStreaks(prev => ({ ...prev, [taskId]: yesterdayStr }));
  }, []);

  // Constellation Functions
  const getAvailableSkillPoints = useCallback((taskId: string): number => {
    if (!isLoaded) return 0;
    // Skill points are equivalent to the total value recorded for a task
    const totalPoints = getAggregateSum(new Date("1900-01-01"), new Date(), taskId);
    const spentPoints = spentSkillPoints[taskId] || 0;
    return totalPoints - spentPoints;
  }, [isLoaded, getAggregateSum, spentSkillPoints]);

  const isSkillUnlocked = useCallback((skillId: string): boolean => {
    return unlockedSkills.includes(skillId);
  }, [unlockedSkills]);

  const unlockSkill = useCallback((skillId: string, taskId: string, cost: number): boolean => {
    const availablePoints = getAvailableSkillPoints(taskId);
    if (availablePoints >= cost && !isSkillUnlocked(skillId)) {
      setSpentSkillPoints(prev => ({
        ...prev,
        [taskId]: (prev[taskId] || 0) + cost,
      }));
      setUnlockedSkills(prev => [...prev, skillId]);
      return true;
    }
    return false;
  }, [getAvailableSkillPoints, isSkillUnlocked]);

  const constellations = useMemo(() => CONSTELLATIONS, []);

  // Insights Functions
  const getTaskDistribution = useCallback((startDate: Date, endDate: Date): TaskDistributionData[] => {
    const relevantRecords = getRecordsForDateRange(startDate, endDate);
    const distribution = new Map<string, { value: number; color: string; name: string }>();

    relevantRecords.forEach(record => {
      const taskDef = record.taskType ? getTaskDefinitionById(record.taskType) : undefined;
      const taskId = taskDef?.id || 'unassigned';
      const taskName = taskDef?.name || 'Unassigned';
      const taskColor = taskDef?.color || '#8884d8';

      const current = distribution.get(taskId) || { value: 0, color: taskColor, name: taskName };
      current.value += record.value;
      distribution.set(taskId, current);
    });

    return Array.from(distribution.entries()).map(([_, data]) => ({
      name: data.name,
      value: data.value,
      fill: data.color,
    }));
  }, [getRecordsForDateRange, getTaskDefinitionById]);

  const getProductivityByDay = useCallback((startDate: Date, endDate: Date): ProductivityByDayData[] => {
    const relevantRecords = getRecordsForDateRange(startDate, endDate);
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


  return (
    <UserRecordsContext.Provider value={{
      records,
      addRecord,
      updateRecord,
      deleteRecord,
      getRecordByDate,
      getRecordsForDateRange,
      getAggregateSum,
      getYearlySum,
      getAllRecordsStringified,
      getDailyConsistencyLast30Days,
      getCurrentStreak,
      taskDefinitions,
      addTaskDefinition,
      updateTaskDefinition,
      deleteTaskDefinition,
      getTaskDefinitionById,
      getStatsForCompletedWeek,
      getWeeklyAggregatesForChart,
      getUserLevelInfo,
      awardGoalCompletionBonus,
      totalBonusPoints,
      checkAndAwardAutomatedGoal,
      awardTierEntryBonus,
      deductBonusPoints,
      handleConsistencyCheck,
      isGoalMetForLastPeriod,
      checkDarkStreaks,
      markDarkStreakHandled,
      // Constellations
      getAvailableSkillPoints,
      unlockSkill,
      isSkillUnlocked,
      constellations,
      // Insights
      getTaskDistribution,
      getProductivityByDay,
    }}>
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
