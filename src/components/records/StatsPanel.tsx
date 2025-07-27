
"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { subDays, parseISO, formatDistanceToNowStrict } from 'date-fns';
import PerformanceCircle from './PerformanceCircle';
import { Flame, Snowflake, TrendingUp, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface StatsPanelProps {
  selectedTaskFilterId: string | null;
}

const HighGoalPanel = () => {
    const { highGoals, getHighGoalProgress, getTaskDefinitionById, records } = useUserRecords();
    
    const mostImminentGoal = useMemo(() => {
        const now = new Date();
        return [...highGoals]
            .filter(g => parseISO(g.endDate) >= now)
            .sort((a, b) => parseISO(a.endDate).getTime() - parseISO(b.endDate).getTime())
            [0];
    }, [highGoals, records]);

    if (!mostImminentGoal) {
        return (
            <Card className="shadow-lg animate-fade-in-up" style={{ animationDelay: `200ms` }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">High Goal</CardTitle>
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground pt-3">
                        <p>No active high goals.</p>
                        <Link href="/high-goals" className="text-xs text-primary hover:underline">Set one now</Link>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    const task = getTaskDefinitionById(mostImminentGoal.taskId);
    const progress = getHighGoalProgress(mostImminentGoal);
    const percentage = Math.min((progress / mostImminentGoal.targetValue) * 100, 100);
    const timeRemaining = formatDistanceToNowStrict(parseISO(mostImminentGoal.endDate), { addSuffix: true });

    return (
        <Card className="shadow-lg animate-fade-in-up" style={{ animationDelay: `200ms` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground truncate" title={mostImminentGoal.name}>
                    High Goal: {mostImminentGoal.name}
                </CardTitle>
                <ShieldCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <div className="text-2xl font-bold" style={{color: task?.color}}>{percentage.toFixed(0)}%</div>
                        <p className="text-xs text-muted-foreground">Due {timeRemaining}</p>
                    </div>
                    <PerformanceCircle percentage={percentage} size={60} strokeWidth={6} progressColor={task?.color} />
                </div>
            </CardContent>
        </Card>
    );
};


const StatsPanel: React.FC<StatsPanelProps> = ({ selectedTaskFilterId }) => {
  const { 
    getAggregateSum, 
    getTaskDefinitionById, 
    getCurrentStreak,
    freezeCrystals,
    records
  } = useUserRecords();
  
  const aggregate = useMemo(() => {
    const today = new Date();
    const last30DaysStart = subDays(today, 29);
    return getAggregateSum(last30DaysStart, today, selectedTaskFilterId);
  }, [records, selectedTaskFilterId, getAggregateSum]);

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

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          className="shadow-lg animate-fade-in-up"
        >
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

        <HighGoalPanel />
        
      </div>
    </>
  );
};

export default StatsPanel;
