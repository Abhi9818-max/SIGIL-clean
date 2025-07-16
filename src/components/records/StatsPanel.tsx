"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { subDays } from 'date-fns';
import PerformanceCircle from './PerformanceCircle';
import { Flame, Snowflake, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '../ui/button';

interface StatsPanelProps {
  selectedTaskFilterId: string | null;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ selectedTaskFilterId }) => {
  const { 
    getAggregateSum, 
    getDailyConsistencyLast30Days, 
    getTaskDefinitionById, 
    getCurrentStreak,
    freezeCrystals 
  } = useUserRecords();

  // Memoize all derived values to prevent unnecessary re-renders
  const taskData = useMemo(() => {
    const task = selectedTaskFilterId ? getTaskDefinitionById(selectedTaskFilterId) : null;
    return {
      task,
      isDarkStreakSelected: task?.darkStreakEnabled === true,
      consistency: getDailyConsistencyLast30Days(selectedTaskFilterId),
      currentStreak: getCurrentStreak(selectedTaskFilterId),
      consistencyLabel: task ? `Consistency for ${task.name}` : "Consistency (Last 30D)",
      consistencyCircleColor: task?.color
    };
  }, [selectedTaskFilterId, getTaskDefinitionById, getDailyConsistencyLast30Days, getCurrentStreak]);

  const aggregateStats = useMemo(() => {
    const today = new Date();
    const last30DaysStart = subDays(today, 29);
    
    return [
      {
        title: "Total Last 30 Days",
        value: getAggregateSum(last30DaysStart, today, selectedTaskFilterId)
      },
    ];
  }, [getAggregateSum, selectedTaskFilterId]);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {aggregateStats.map((stat, index) => (
          <Card
            key={index}
            className="shadow-lg animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stat.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card
          className={cn(
            "shadow-lg animate-fade-in-up transition-all relative",
            taskData.isDarkStreakSelected && "bg-orange-950/70 border-orange-400/50"
          )}
          style={{ animationDelay: `${aggregateStats.length * 100}ms` }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {taskData.isDarkStreakSelected ? "Dark Streak" : "Current Streak"}
            </CardTitle>
            <div className="flex items-center gap-3">
              <Flame
                className={cn(
                  "h-4 w-4 text-orange-400",
                  taskData.isDarkStreakSelected &&
                    "text-yellow-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.8)]"
                )}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Snowflake className="h-4 w-4 text-blue-300" />
                    <span className="text-sm font-bold">{freezeCrystals}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Freeze Crystals available</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold text-foreground",
                taskData.isDarkStreakSelected && "text-yellow-400"
              )}
            >
              {taskData.currentStreak} Day{taskData.currentStreak !== 1 ? "s" : ""}
            </div>
          </CardContent>
        </Card>

        <Card
          className="shadow-lg animate-fade-in-up"
          style={{ animationDelay: `${(aggregateStats.length + 1) * 100}ms` }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className="text-sm font-medium text-muted-foreground truncate"
              title={taskData.consistencyLabel}
            >
              {taskData.consistencyLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center pt-2">
            <PerformanceCircle
              percentage={taskData.consistency}
              size={80}
              strokeWidth={8}
              progressColor={taskData.consistencyCircleColor}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 -mt-2 text-center">
        <Button asChild variant="outline" size="sm">
          <Link href="/calendar">
            <Calendar className="mr-2 h-4 w-4" />
            View Full Calendar
          </Link>
        </Button>
      </div>
    </>
  );
};

export default StatsPanel;