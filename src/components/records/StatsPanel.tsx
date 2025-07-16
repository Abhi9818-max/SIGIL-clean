"use client";

import React, { useMemo, useState, useEffect } from 'react';
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

  const [consistency, setConsistency] = useState(0);
  const [consistencyLabel, setConsistencyLabel] = useState("Consistency (Last 30D)");
  const [consistencyCircleColor, setConsistencyCircleColor] = useState<string | undefined>(undefined);
  const [currentStreak, setCurrentStreak] = useState(0);

  const isDarkStreakSelected = useMemo(() => {
    const task = selectedTaskFilterId ? getTaskDefinitionById(selectedTaskFilterId) : null;
    return task?.darkStreakEnabled === true;
  }, [selectedTaskFilterId, getTaskDefinitionById]);

  useEffect(() => {
    const task = selectedTaskFilterId ? getTaskDefinitionById(selectedTaskFilterId) : null;

    setConsistency(getDailyConsistencyLast30Days(selectedTaskFilterId));
    setCurrentStreak(getCurrentStreak(selectedTaskFilterId));

    if (task) {
      setConsistencyLabel(`Consistency for ${task.name}`);
      setConsistencyCircleColor(task.color);
    } else {
      setConsistencyLabel("Consistency (Last 30D)");
      setConsistencyCircleColor(undefined);
    }
  }, [getDailyConsistencyLast30Days, selectedTaskFilterId, getCurrentStreak, getTaskDefinitionById]);

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
            isDarkStreakSelected && "bg-orange-950/70 border-orange-400/50"
          )}
          style={{ animationDelay: `${aggregateStats.length * 100}ms` }}
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
              <TooltipProvider>
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
              </TooltipProvider>
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

        <Card
          className="shadow-lg animate-fade-in-up"
          style={{ animationDelay: `${(aggregateStats.length + 1) * 100}ms` }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className="text-sm font-medium text-muted-foreground truncate"
              title={consistencyLabel}
            >
              {consistencyLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center pt-2">
            <PerformanceCircle
              percentage={consistency}
              size={80}
              strokeWidth={8}
              progressColor={consistencyCircleColor}
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
