

"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { subDays, startOfYear, getYear } from 'date-fns';
import PerformanceCircle from './PerformanceCircle';
import { Flame } from 'lucide-react';

interface StatsPanelProps {
  selectedTaskFilterId: string | null;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ selectedTaskFilterId }) => {
  const { getAggregateSum, getDailyConsistencyLast30Days, getTaskDefinitionById, getCurrentStreak } = useUserRecords();
  const [consistency, setConsistency] = useState(0);
  const [consistencyLabel, setConsistencyLabel] = useState("Consistency (Last 30D)");
  const [consistencyCircleColor, setConsistencyCircleColor] = useState<string | undefined>(undefined);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    const newConsistency = getDailyConsistencyLast30Days(selectedTaskFilterId);
    setConsistency(newConsistency);
    setCurrentStreak(getCurrentStreak());

    if (selectedTaskFilterId) {
      const taskDef = getTaskDefinitionById(selectedTaskFilterId);
      setConsistencyLabel(taskDef ? `Consistency for ${taskDef.name}` : "Task Consistency (30D)");
      setConsistencyCircleColor(taskDef?.color);
    } else {
      setConsistencyLabel("Consistency (Last 30D)");
      setConsistencyCircleColor(undefined); // Reset to default color
    }
  }, [getDailyConsistencyLast30Days, selectedTaskFilterId, getTaskDefinitionById, getCurrentStreak]);

  const aggregateStats = useMemo(() => {
    const today = new Date();
    const last30DaysStart = subDays(today, 29);
    const currentYear = getYear(today);
    const yearStart = startOfYear(today);

    const taskForAggregates = selectedTaskFilterId;

    return [
      { title: "Total Last 30 Days", value: getAggregateSum(last30DaysStart, today, taskForAggregates) },
      { title: `Total This Year (${currentYear})`, value: getAggregateSum(yearStart, today, taskForAggregates) },
    ];
  }, [getAggregateSum, selectedTaskFilterId]);


  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
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
            <div className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</div>
          </CardContent>
        </Card>
      ))}
       <Card
        className="shadow-lg animate-fade-in-up"
        style={{ animationDelay: `${aggregateStats.length * 100}ms` }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Streak
            </CardTitle>
            <Flame className="h-4 w-4 text-orange-400" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold text-foreground">
                {currentStreak} Day{currentStreak !== 1 ? 's' : ''}
            </div>
        </CardContent>
      </Card>
      <Card
        className="shadow-lg animate-fade-in-up"
        style={{ animationDelay: `${(aggregateStats.length + 1) * 100}ms` }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground truncate" title={consistencyLabel}>
            {consistencyLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center pt-2">
          <PerformanceCircle
            percentage={consistency}
            size={100}
            strokeWidth={10}
            progressColor={consistencyCircleColor}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsPanel;
