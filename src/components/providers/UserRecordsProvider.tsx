

"use client";

import type { RecordEntry, TaskDefinition, WeeklyProgressStats, AggregatedTimeDataPoint, UserLevelInfo, AutomatedGoalCheckResult, Constellation, TaskDistributionData, ProductivityByDayData, BreachCheckResult, DarkStreakCheckResult, Achievement } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import {
  LOCAL_STORAGE_KEY,
  LOCAL_STORAGE_TASKS_KEY,
  LOCAL_STORAGE_BONUS_POINTS_KEY,
  LOCAL_STORAGE_MET_GOALS_KEY,
  LOCAL_STORAGE_HANDLED_STREAKS_KEY,
  LOCAL_STORAGE_TODO_KEY,
  LOCAL_STORAGE_LORE_KEY,
  LOCAL_STORAGE_SPENT_SKILL_POINTS_KEY,
  LOCAL_STORAGE_UNLOCKED_SKILLS_KEY,
  LOCAL_STORAGE_HANDLED_DARK_STREAKS_KEY,
  LOCAL_STORAGE_FREEZE_CRYSTALS_KEY,
  LOCAL_STORAGE_AWARDED_STREAK_MILESTONES_KEY,
  LOCAL_STORAGE_UNLOCKED_ACHIEVEMENTS_KEY,
  TASK_DEFINITIONS as DEFAULT_TASK_DEFINITIONS,
  calculateUserLevelInfo,
  CONSISTENCY_BREACH_DAYS,
  CONSISTENCY_BREACH_PENALTY,
  DARK_STREAK_PENALTY,
  STREAK_MILESTONES_FOR_CRYSTALS
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
  getDailyConsistencyLast30Days: (taskId?: string | null) => number;
  getCurrentStreak: (taskId?: string | null) => number;
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
  getTaskDistribution: (startDate: Date, endDate: Date, taskId?: string | null) => TaskDistributionData[];
  getProductivityByDay: (startDate: Date, endDate: Date, taskId?: string | null) => ProductivityByDayData[];
  // Freeze Crystals
  freezeCrystals: number;
  useFreezeCrystal: () => void;
  // Achievements
  unlockedAchievements: string[];
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
  const [freezeCrystals, setFreezeCrystals] = useState<number>(0);
  const [awardedStreakMilestones, setAwardedStreakMilestones] = useState<Record<string, number[]>>({});
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedRecords = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedRecords) {
        // Ensure all records have a unique ID, back-filling if necessary
        const parsedRecords: RecordEntry[] = JSON.parse(storedRecords);
        const recordsWithIds = parsedRecords.map(rec => ({ ...rec, id: rec.id || uuidv4() }));
        setRecords(recordsWithIds);
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
                goalType: task.goalType ?? 'at_least',
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
    
    try {
        const storedCrystals = localStorage.getItem(LOCAL_STORAGE_FREEZE_CRYSTALS_KEY);
        if (storedCrystals) {
            setFreezeCrystals(JSON.parse(storedCrystals));
        }
    } catch (error) {
        console.error("Failed to load freeze crystals from localStorage:", error);
    }

    try {
        const storedMilestones = localStorage.getItem(LOCAL_STORAGE_AWARDED_STREAK_MILESTONES_KEY);
        if (storedMilestones) {
            setAwardedStreakMilestones(JSON.parse(storedMilestones));
        }
    } catch (error) {
        console.error("Failed to load awarded streak milestones from localStorage:", error);
    }

    try {
      const storedAchievements = localStorage.getItem(LOCAL_STORAGE_UNLOCKED_ACHIEVEMENTS_KEY);
      if (storedAchievements) {
        setUnlockedAchievements(JSON.parse(storedAchievements));
      }
    } catch (error) {
      console.error("Failed to load unlocked achievements from localStorage:", error);
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
  
  useEffect(() => {
    if (isLoaded) {
        try {
            localStorage.setItem(LOCAL_STORAGE_FREEZE_CRYSTALS_KEY, JSON.stringify(freezeCrystals));
        } catch (error) {
            console.error("Failed to save freeze crystals to localStorage:", error);
        }
    }
    }, [freezeCrystals, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem(LOCAL_STORAGE_AWARDED_STREAK_MILESTONES_KEY, JSON.stringify(awardedStreakMilestones));
            } catch (error) {
                console.error("Failed to save awarded streak milestones to localStorage:", error);
            }
        }
    }, [awardedStreakMilestones, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(LOCAL_STORAGE_UNLOCKED_ACHIEVEMENTS_KEY, JSON.stringify(unlockedAchievements));
      } catch (error) {
        console.error("Failed to save unlocked achievements to localStorage:", error);
      }
    }
  }, [unlockedAchievements, isLoaded]);


  const getCurrentStreak = useCallback((taskId: string | null = null): number => {
    if (!isLoaded) return 0;

    const allRecords = [...records];
    const taskRelevantRecords = taskId ? allRecords.filter(r => r.taskType === taskId) : allRecords;

    if (taskRelevantRecords.length === 0) return 0;

    const recordDates = new Set(taskRelevantRecords.map(r => r.date));
    let streak = 0;
    let currentDate = startOfDay(new Date());

    if (!recordDates.has(format(currentDate, 'yyyy-MM-dd'))) {
        currentDate = subDays(currentDate, 1);
        // Reset streak milestone tracking if the streak was broken *yesterday*
        if (taskId && !recordDates.has(format(currentDate, 'yyyy-MM-dd'))) {
            setAwardedStreakMilestones(prev => {
                const newMilestones = {...prev};
                delete newMilestones[taskId];
                return newMilestones;
            });
        }
    }

    while (recordDates.has(format(currentDate, 'yyyy-MM-dd'))) {
        streak++;
        currentDate = subDays(currentDate, 1);
    }
    
    if (streak === 0 && taskId && awardedStreakMilestones[taskId]) {
        // Streak is broken, clear milestones
        setAwardedStreakMilestones(prev => {
            const newMilestones = {...prev};
            delete newMilestones[taskId];
            return newMilestones;
        });
    }

    return streak;
  }, [isLoaded, records, awardedStreakMilestones]);

  const addRecord = useCallback((entry: Omit<RecordEntry, 'id'>) => {
    const newRecord: RecordEntry = {
      ...entry,
      id: uuidv4(),
      value: Number(entry.value),
    };

    const updatedRecords = [...records, newRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setRecords(updatedRecords);

    // Post-record addition logic for streak rewards
    if(newRecord.taskType) {
        const taskId = newRecord.taskType;
        const newStreak = getCurrentStreak(taskId);

        STREAK_MILESTONES_FOR_CRYSTALS.forEach(milestone => {
            if (newStreak >= milestone && !(awardedStreakMilestones[taskId] || []).includes(milestone)) {
                setFreezeCrystals(prev => prev + 1);
                setAwardedStreakMilestones(prev => ({
                    ...prev,
                    [taskId]: [...(prev[taskId] || []), milestone]
                }));
                toast({
                    title: "❄️ Freeze Crystal Earned!",
                    description: `You've maintained a ${milestone}-day streak and earned a Freeze Crystal!`
                });
            }
        });
    }
  }, [records, getCurrentStreak, awardedStreakMilestones, toast]);

  const updateRecord = useCallback((entry: RecordEntry) => {
    setRecords(prevRecords =>
      prevRecords.map(r => r.id === entry.id ? { ...entry, value: Number(entry.value) } : r)
    );
  }, []);

  const deleteRecord = useCallback((recordId: string) => {
    setRecords(prevRecords => prevRecords.filter(r => r.id !== recordId));
  }, []);

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

  const addTaskDefinition = useCallback((taskData: Omit<TaskDefinition, 'id'>): string => {
    const newId = uuidv4();
    const goalValue = taskData.goalValue === undefined || taskData.goalValue === null || Number(taskData.goalValue) <= 0 ? undefined : Number(taskData.goalValue);
    const newTask: TaskDefinition = {
      ...taskData,
      id: newId,
      goalValue: goalValue,
      goalInterval: goalValue ? taskData.goalInterval : undefined,
      goalType: goalValue ? (taskData.goalType ?? 'at_least') : undefined,
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
        goalType: goalValue ? (updatedTask.goalType ?? 'at_least') : undefined,
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
    const goalType = task.goalType ?? 'at_least';
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

    if (goalType === 'at_least' && actualValue >= task.goalValue) {
      metGoal = true;
    } else if (goalType === 'no_more_than' && actualValue <= task.goalValue) {
      metGoal = true;
    }

    if (metGoal) {
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
      goalType,
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
    setTotalBonusPoints(prevBonus => prevBonus - Math.abs(penalty));
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
                const response = await fetch('/dares.json');
                if (!response.ok) {
                    throw new Error('Failed to fetch dares');
                }
                const data = await response.json();
                const dares: string[] = data.dares;
                const dare = dares[Math.floor(Math.random() * dares.length)];

                return {
                    taskId: task.id,
                    taskName: task.name,
                    streakBroken: true,
                    penalty: DARK_STREAK_PENALTY,
                    dare: dare
                };
            } catch (error) {
                console.error("Error fetching or processing dares:", error);
                // Return penalty without a dare if fetching fails
                return {
                    taskId: task.id,
                    taskName: task.name,
                    streakBroken: true,
                    penalty: DARK_STREAK_PENALTY,
                };
            }
        }
    }

    return null; // No broken dark streaks
  }, [isLoaded, taskDefinitions, records, handledDarkStreaks, deductBonusPoints]);

  const markDarkStreakHandled = useCallback((taskId: string) => {
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    setHandledDarkStreaks(prev => ({ ...prev, [taskId]: yesterdayStr }));
  }, []);

  const useFreezeCrystal = useCallback(() => {
    if (freezeCrystals > 0) {
        setFreezeCrystals(prev => prev - 1);
        // We're essentially "paying" the penalty with a crystal, so we add the penalty value back
        // to negate the deduction that already happened in checkDarkStreaks.
        setTotalBonusPoints(prev => prev + DARK_STREAK_PENALTY);
    }
  }, [freezeCrystals]);


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

  // Achievement Check
  const checkAchievements = useCallback(() => {
    if (!isLoaded) return;
    
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
      setUnlockedAchievements(prev => [...prev, ...newlyUnlocked]);
    }
  }, [isLoaded, getUserLevelInfo, taskDefinitions, getCurrentStreak, unlockedSkills.length, unlockedAchievements, toast]);

  useEffect(() => {
    // Run achievement check when data is loaded and on certain state changes
    checkAchievements();
  }, [records, totalBonusPoints, unlockedSkills, isLoaded, checkAchievements]);


  return (
    <UserRecordsContext.Provider value={{
      records,
      addRecord,
      updateRecord,
      deleteRecord,
      getRecordsByDate,
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
      // Freeze Crystals
      freezeCrystals,
      useFreezeCrystal,
      // Achievements
      unlockedAchievements,
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
