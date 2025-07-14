

import {
  format,
  startOfMonth,
  getDay,
  getDaysInMonth,
  setDate,
  getYear,
  getMonth,
  isAfter,
  startOfDay,
} from 'date-fns';
import type { RecordEntry, MonthColumn, MonthlyDayData, TaskDefinition } from '@/types';
import { getContributionLevel, DEFAULT_TASK_COLOR } from './config';

export const getMonthlyGraphData = (
  records: RecordEntry[], 
  taskDefinitions: TaskDefinition[],
  filterByTaskId: string | null = null,
  currentSystemDate: Date // Pass the current date to compare against
): MonthColumn[] => {
  const today = startOfDay(currentSystemDate); // Use startOfDay for consistent comparison
  const currentYear = getYear(today);
  const monthlyData: MonthColumn[] = [];
  
  const recordsMap = new Map<string, RecordEntry[]>();
  records.forEach(record => {
    if (!recordsMap.has(record.date)) {
      recordsMap.set(record.date, []);
    }
    recordsMap.get(record.date)!.push(record);
  });

  const taskDefinitionMap = new Map<string, TaskDefinition>();
  taskDefinitions.forEach(task => taskDefinitionMap.set(task.id, task));

  // Generate data for all 12 months of the current year
  for (let monthIndex = 0; monthIndex < 12; monthIndex++) { 
    const targetMonthDate = new Date(currentYear, monthIndex, 1);
    
    const year = getYear(targetMonthDate);
    const currentMonthLoopIndex = getMonth(targetMonthDate);

    const firstDayOfMonth = startOfMonth(targetMonthDate);
    const daysInMonth = getDaysInMonth(targetMonthDate);

    const monthLabel = format(firstDayOfMonth, 'MMM yyyy');
    const currentMonthWeeks: MonthlyDayData[][] = [];
    let currentWeek: MonthlyDayData[] = [];

    const firstDayOfMonthWeekDay = getDay(firstDayOfMonth); 

    for (let j = 0; j < firstDayOfMonthWeekDay; j++) {
      currentWeek.push({
        date: `placeholder-start-${year}-${currentMonthLoopIndex}-${j}`,
        value: null,
        level: 0,
        isPlaceholder: true,
      });
    }

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const currentDateObj = setDate(firstDayOfMonth, dayNum);
      const dateStr = format(currentDateObj, 'yyyy-MM-dd');
      
      // Skip processing for days that are in the future
      if (isAfter(startOfDay(currentDateObj), today)) {
         currentWeek.push({
          date: dateStr,
          value: null,
          level: 0, // Or a specific "future" level if needed for styling
          isPlaceholder: false, // It's a real date, but in the future
          taskColor: 'hsl(var(--muted) / 0.1)', // Dimmer for future dates
        });
      } else {
        const dailyRecords = recordsMap.get(dateStr) || [];
        const relevantRecords = filterByTaskId 
          ? dailyRecords.filter(r => r.taskType === filterByTaskId) 
          : dailyRecords;
        
        const totalValue = relevantRecords.reduce((sum, r) => sum + r.value, 0);

        let displayValue: number | null = null;
        let displayLevel = 0;
        let taskColor: string | undefined = undefined;
        let taskName: string | undefined = undefined;
        let taskType: string | undefined = undefined;
        let taskIntensityThresholds: readonly number[] | undefined = undefined;

        if (relevantRecords.length > 0) {
          displayValue = totalValue;

          // If filtered, use that task's info. If not, use the info from the first record of the day.
          const representativeRecord = relevantRecords[0];
          const taskDef = representativeRecord.taskType ? taskDefinitionMap.get(representativeRecord.taskType) : undefined;
          
          if (taskDef) {
            taskColor = taskDef.color;
            taskName = relevantRecords.length > 1 ? `${relevantRecords.length} tasks` : taskDef.name;
            taskType = taskDef.id;
            if (taskDef.intensityThresholds && taskDef.intensityThresholds.length === 4) {
              taskIntensityThresholds = taskDef.intensityThresholds;
            }
          } else {
            taskColor = DEFAULT_TASK_COLOR;
            taskName = relevantRecords.length > 1 ? `${relevantRecords.length} tasks` : 'Unassigned';
          }
          displayLevel = getContributionLevel(totalValue, taskIntensityThresholds);
        }

        currentWeek.push({
          date: dateStr,
          value: displayValue,
          level: displayLevel,
          taskType: taskType,
          taskName: taskName,
          taskColor: taskColor,
          isPlaceholder: false,
        });
      }


      if (currentWeek.length === 7) {
        currentMonthWeeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      const remainingCells = 7 - currentWeek.length;
      for (let j = 0; j < remainingCells; j++) {
        currentWeek.push({
          date: `placeholder-end-${year}-${currentMonthLoopIndex}-${j}`,
          value: null,
          level: 0,
          isPlaceholder: true,
        });
      }
      currentMonthWeeks.push(currentWeek);
    }
    
    while (currentMonthWeeks.length < 6) {
      const placeholderWeek: MonthlyDayData[] = [];
      for (let j = 0; j < 7; j++) {
        placeholderWeek.push({
          date: `placeholder-fill-${year}-${currentMonthLoopIndex}-${currentMonthWeeks.length}-${j}`,
          value: null,
          level: 0,
          isPlaceholder: true,
        });
      }
      currentMonthWeeks.push(placeholderWeek);
    }

    monthlyData.push({
      monthLabel,
      year, 
      month: currentMonthLoopIndex,
      weeks: currentMonthWeeks,
    });
  }
  return monthlyData;
};


export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_LABELS_VISIBLE_INDICES = [1, 3, 5];
