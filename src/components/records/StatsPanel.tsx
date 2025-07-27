
"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { subDays, parseISO, formatDistanceToNowStrict } from 'date-fns';
import PerformanceCircle from './PerformanceCircle';
import { Flame, Snowflake, TrendingUp, ShieldCheck, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const StatsPanel: React.FC<{ selectedTaskFilterId: string | null; }> = ({ selectedTaskFilterId }) => {
  const { 
    getAggregateSum, 
    getDailyConsistencyLast30Days,
    getTaskDefinitionById, 
    getCurrentStreak,
    freezeCrystals,
    highGoals,
    getHighGoalProgress,
    records
  } = useUserRecords();
  
  const aggregate = useMemo(() => {
    const today = new Date();
    const last30DaysStart = subDays(today, 29);
    return getAggregateSum(last30DaysStart, today, selectedTaskFilterId);
  }, [records, selectedTaskFilterId, getAggregateSum]);

  const consistency = useMemo(() => {
    return getDailyConsistencyLast30Days(selectedTaskFilterId);
  }, [records, selectedTaskFilterId, getDailyConsistencyLast30Days]);

  const currentStreak = useMemo(() => {
    return getCurrentStreak(selectedTaskFilterId);
  }, [records, selectedTaskFilterId, getCurrentStreak]);

  const { task, isDarkStreakSelected, unitLabel } = useMemo(() => {
    const task = selectedTaskFilterId ? getTaskDefinitionById(selectedTaskFilterId) : null;
    let unitLabel = '';
    
    if (task?.unit) {
      if (task.unit === 'custom' && task.customUnitName) {
        unitLabel = task.customUnitName;
      } else if (task.unit !== 'count' && task.unit !== 'generic' && task.unit !== 'custom') {
        unitLabel = task.unit;
      }
    }

    return {
      task,
      isDarkStreakSelected: task?.darkStreakEnabled === true,
      unitLabel
    };
  }, [selectedTaskFilterId, getTaskDefinitionById, records]);

  const activeHighGoal = useMemo(() => {
    const now = new Date();
    return [...highGoals]
        .filter(g => parseISO(g.endDate) >= now)
        .sort((a, b) => parseISO(a.endDate).getTime() - parseISO(b.endDate).getTime())
        [0]; // Get only the most imminent goal
  }, [highGoals, records]);


  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg animate-fade-in-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Last 30 Days
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-foreground">
                {aggregate.toLocaleString()}
                {unitLabel && <span className="text-lg text-muted-foreground ml-2">{unitLabel}</span>}
                </div>
            </CardContent>
        </Card>

        <Card
          className={cn(
            "shadow-lg animate-fade-in-up transition-all relative",
            isDarkStreakSelected && "bg-orange-950/70 border-orange-400/50"
          )}
          style={{ animationDelay: `100ms` }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isDarkStreakSelected ? "Dark Streak" : "Current Streak"}
            </CardTitle>
            <div className="flex items-center gap-3">
              <Flame
                className={cn(
                  "h-4 w-4 text-orange-400",
                  isDarkStreakSelected &&
                    "text-yellow-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.8)]"
                )}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <Snowflake className="h-4 w-4 text-blue-300" />
                    <span className="text-sm font-bold">{freezeCrystals}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Freeze Crystals can save a streak.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold text-foreground",
                isDarkStreakSelected && "text-yellow-400"
              )}
            >
              {currentStreak} Day{currentStreak !== 1 ? "s" : ""}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Daily Consistency
                </CardTitle>
                <Repeat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <div className="text-2xl font-bold text-foreground">{consistency}%</div>
                        <p className="text-xs text-muted-foreground">Last 30 Days</p>
                    </div>
                    <PerformanceCircle percentage={consistency} size={60} strokeWidth={6} />
                </div>
            </CardContent>
        </Card>
        
        <Card className="shadow-lg animate-fade-in-up" style={{ animationDelay: `300ms` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground truncate" title={activeHighGoal?.name ?? "High Goal"}>
                    {activeHighGoal?.name ?? "High Goal"}
                </CardTitle>
                <ShieldCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                {activeHighGoal ? (
                    (() => {
                        const goalTask = getTaskDefinitionById(activeHighGoal.taskId);
                        const progress = getHighGoalProgress(activeHighGoal);
                        const percentage = Math.min((progress / activeHighGoal.targetValue) * 100, 100);
                        const timeRemaining = formatDistanceToNowStrict(parseISO(activeHighGoal.endDate), { addSuffix: true });
                        return (
                             <div className="flex items-center justify-between gap-4">
                                <div className="flex flex-col">
                                    <div className="text-2xl font-bold" style={{color: goalTask?.color}}>{percentage.toFixed(0)}%</div>
                                    <p className="text-xs text-muted-foreground">Due {timeRemaining}</p>
                                </div>
                                <PerformanceCircle percentage={percentage} size={60} strokeWidth={6} progressColor={goalTask?.color} />
                            </div>
                        )
                    })()
                ) : (
                    <div className="text-center text-muted-foreground pt-3">
                        <p>No active high goals.</p>
                        <Link href="/high-goals" className="text-xs text-primary hover:underline">Set one now</Link>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
  );
};

export default StatsPanel;
