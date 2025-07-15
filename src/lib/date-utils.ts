

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
  isSameMonth,
} from 'date-fns';
import type { RecordEntry, MonthColumn, MonthlyDayData, TaskDefinition } from '@/types';
import { getContributionLevel, DEFAULT_TASK_COLOR } from './config';

export const getMonthlyGraphData = (
  records: RecordEntry[], 
  taskDefinitions: TaskDefinition[],
  filterByTaskId: string | null = null,
  currentSystemDate: Date,
  displayMode: 'full' | 'current_month' = 'current_month'
): MonthColumn[] => {
  const today = startOfDay(currentSystemDate);
  const currentYear = getYear(today);
  const currentMonthIndex = getMonth(today);
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

  const startMonth = displayMode === 'current_month' ? currentMonthIndex : 0;
  const endMonth = displayMode === 'current_month' ? currentMonthIndex : 11;

  for (let monthIndex = startMonth; monthIndex <= endMonth; monthIndex++) { 
    const targetMonthDate = new Date(currentYear, monthIndex, 1);
    
    // Skip future months if in single month mode and something is off
    if (displayMode === 'current_month' && !isSameMonth(targetMonthDate, today)) {
        continue;
    }
    
    const year = getYear(targetMonthDate);
    const month = getMonth(targetMonthDate);

    const firstDayOfMonth = startOfMonth(targetMonthDate);
    const daysInMonth = getDaysInMonth(targetMonthDate);

    const monthLabel = format(firstDayOfMonth, 'MMM yyyy');
    const currentMonthWeeks: MonthlyDayData[][] = [];
    let currentWeek: MonthlyDayData[] = [];

    const firstDayOfMonthWeekDay = getDay(firstDayOfMonth); 

    for (let j = 0; j < firstDayOfMonthWeekDay; j++) {
      currentWeek.push({
        date: `placeholder-start-${year}-${month}-${j}`,
        value: null,
        level: 0,
        isPlaceholder: true,
      });
    }

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const currentDateObj = setDate(firstDayOfMonth, dayNum);
      const dateStr = format(currentDateObj, 'yyyy-MM-dd');
      
      if (isAfter(startOfDay(currentDateObj), today)) {
         currentWeek.push({
          date: dateStr,
          value: null,
          level: 0,
          isPlaceholder: false,
          taskColor: 'hsl(var(--muted) / 0.1)',
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
          date: `placeholder-end-${year}-${month}-${j}`,
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
          date: `placeholder-fill-${year}-${month}-${currentMonthWeeks.length}-${j}`,
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
      month: month,
      weeks: currentMonthWeeks,
    });
  }
  return monthlyData;
};


export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_LABELS_VISIBLE_INDICES = [1, 3, 5];
