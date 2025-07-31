

export type TaskUnit = 'count' | 'minutes' | 'hours' | 'pages' | 'generic' | 'custom';
export type TaskFrequency = 'daily' | 'weekly';

export interface RecordEntry {
  id: string; // Unique identifier for each record
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
  unit?: TaskUnit; // The unit of measurement for this task's value
  customUnitName?: string; // Optional: name for the custom unit
  intensityThresholds?: readonly number[]; // Optional: Array of 4 numbers for custom intensity levels [T1, T2, T3, T4]
  darkStreakEnabled?: boolean; // Optional: Enable high-stakes daily streak for this task
  frequencyType?: TaskFrequency; // 'daily' or 'weekly'
  frequencyCount?: number; // e.g., for 'weekly', how many times per week
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

export interface DailyTimeBreakdownData {
  name: string;
  value: number; // in minutes
  color: string;
}


// For Achievements
export type AchievementCategory = 'level' | 'streak' | 'skills' | 'creation';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: React.ElementType;
  isSecret?: boolean; // If true, hide details until unlocked
  check: (context: {
    levelInfo: UserLevelInfo;
    streaks: Record<string, number>;
    unlockedSkillCount: number;
    loreEntryCount: number;
  }) => boolean;
}

// For High Goals
export interface HighGoal {
  id: string;
  name: string;
  taskId: string;
  targetValue: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

// For Settings
export interface DashboardSettings {
  showTotalLast30Days: boolean;
  totalDays: number;
  showCurrentStreak: boolean;
  showDailyConsistency: boolean;
  consistencyDays: number;
  showHighGoalStat: boolean;
  showTaskFilterBar: boolean;
  showContributionGraph: boolean;
  showTodoList: boolean;
  showProgressChart: boolean;
  showAISuggestions: boolean;
  showTimeBreakdownChart: boolean;
  pieChartLabelFormat?: 'percentage' | 'time';
}

// For Auth/User Data
export interface UserData {
    uid?: string; // Optional uid, will be present on fetched data
    username: string;
    username_lowercase?: string; // For case-insensitive search
    photoURL?: string | null; // Add photoURL for profile pictures
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

// For Friends feature
export interface SearchedUser {
    uid: string;
    username: string;
    photoURL?: string | null;
}

export interface FriendRequest {
    id: string;
    senderId: string;
    senderUsername: string;
    recipientId: string;
    recipientUsername: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: string;
}

export interface Friend {
    uid: string;
    username: string;
    photoURL?: string | null;
    since: string;
}
