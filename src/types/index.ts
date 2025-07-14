

export interface RecordEntry {
  date: string; // YYYY-MM-DD format
  value: number;
  notes?: string; // Optional notes
  taskType?: string; // ID of the task type
}

export interface DayData {
  date: string; // YYYY-MM-DD
  value: number | null;
  level: number; // For color coding or intensity, derived from value
  taskType?: string; // ID of the task type for this day's primary record
  taskName?: string; // Display name of the task
  taskColor?: string; // Direct color string for the task
}

// New types for monthly graph structure
export interface MonthlyDayData extends DayData {
  isPlaceholder?: boolean;
}

export interface MonthColumn {
  monthLabel: string; // e.g., "Jan 2023"
  year: number;
  month: number; // 0-indexed
  weeks: MonthlyDayData[][]; // Array of weeks, each week is an array of 7 days
}

// Definition for a task type
export interface TaskDefinition {
  id: string;
  name: string;
  color: string; // HSL color string e.g., 'hsl(210 90% 70%)'
  intensityThresholds?: number[]; // Optional: Array of 4 numbers for custom intensity levels [T1, T2, T3, T4]
  goalValue?: number; // Optional: A numerical goal for the task (e.g., hours)
  goalInterval?: 'daily' | 'weekly' | 'monthly'; // Optional: The interval for the goal
  goalCompletionBonusPercentage?: number; // Optional: Percentage of goalValue to award as bonus points
}

// For progress charts
export interface AggregatedTimeDataPoint {
  date: string; // Could be start of week, month, etc.
  value: number;
  [key: string]: any; // For additional properties like task-specific values if doing stacked charts
}

export interface WeeklyProgressStats {
  total: number;
  startDate: Date;
  endDate: Date;
}

// For User Leveling System
// totalAccumulatedValue here represents the total experience points (base record values + bonuses)
export interface UserLevelInfo {
  currentLevel: number;
  levelName: string;
  tierName: string;
  tierIcon: string;
  tierSlug: string; // e.g., "unknown-blades"
  tierGroup: number; // e.g., 1 for Tiers 1-2, 2 for Tiers 3-4 etc.
  welcomeMessage: string; // Welcome message for this tier
  progressPercentage: number;
  currentLevelValueStart: number; // Experience points required to enter the current level
  nextLevelValueTarget: number | null; // Experience points required for the next level
  totalAccumulatedValue: number; // Total experience points earned by the user
  isMaxLevel: boolean;
  valueTowardsNextLevel: number; // Experience points earned within the current level
  pointsForNextLevel: number | null; // Total experience points needed to reach the next level from start of current level
}

// For Automated Goal Check Results
export type AutomatedGoalCheckResult =
  | {
      metGoal: boolean;
      bonusAwarded: number | null;
      actualValue: number;
      goalValue: number;
      periodName: string; // e.g., "yesterday", "last week (May 20 - May 26)"
      periodIdentifier: string; // YYYY-MM-DD representing the end of the checked period
      taskName: string;
      error?: never;
    }
  | {
      error: string;
      metGoal?: never;
      bonusAwarded?: never;
      actualValue?: never;
      goalValue?: never;
      periodName?: never;
      periodIdentifier?: never;
      taskName?: never;
    };
    
// For Consistency Breach Modal
export type BreachCheckResult = {
  breachDetected: boolean;
  lastRecordDate: string | null;
  daysSince: number | null;
  penalty: number;
};


// Specific for TIER_INFO in config.ts
export interface TierConfig {
  name: string;
  slug: string;
  icon: string;
  minLevel: number;
  maxLevel: number;
  tierGroup: number;
  welcomeMessage: string;
  tierEntryBonus?: number; // Bonus XP for entering this tier
}

// For To-Do List
export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string; // ISO date string
  dueDate?: string; // Optional: YYYY-MM-DD format
  penalty?: number; // Optional: XP penalty if overdue
  penaltyApplied?: boolean; // Optional: whether the penalty has been applied
}

// For Constellations
export interface SkillNode {
  id: string;
  name: string;
  description: string;
  cost: number;
}

export interface Constellation {
  taskId: string;
  taskName: string;
  taskColor: string;
  nodes: SkillNode[];
}

// For Insights Page
export interface TaskDistributionData {
  name: string;
  value: number;
  fill: string;
}

export interface ProductivityByDayData {
    day: string;
    total: number;
}
