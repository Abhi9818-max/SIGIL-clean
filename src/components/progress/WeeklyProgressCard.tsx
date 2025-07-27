
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { ArrowDown, ArrowUp, Minus, CalendarCheck2 } from 'lucide-react';
import { format } from 'date-fns';
import type { WeeklyProgressStats } from '@/types';

interface WeeklyProgressCardProps {
  selectedTaskFilterId: string | null;
}

const WeeklyProgressCard: React.FC<WeeklyProgressCardProps> = ({ selectedTaskFilterId }) => {
  const { getStatsForCompletedWeek, getTaskDefinitionById } = useUserRecords();
  const [currentWeekStats, setCurrentWeekStats] = useState<WeeklyProgressStats | null>(null);
  const [prevWeekStats, setPrevWeekStats] = useState<WeeklyProgressStats | null>(null);
  const [percentageChange, setPercentageChange] = useState<number | null>(null);

  const selectedTaskName = selectedTaskFilterId
    ? getTaskDefinitionById(selectedTaskFilterId)?.name
    : null;

  const cardTitle = selectedTaskName
    ? `This Week's ${selectedTaskName}`
    : "This Week's Overall Progress";

  useEffect(() => {
    // Offset 0 for the current week (in progress)
    const cwStats = getStatsForCompletedWeek(0, selectedTaskFilterId);
    // Offset 1 for the previous completed week
    const pwStats = getStatsForCompletedWeek(1, selectedTaskFilterId);

    setCurrentWeekStats(cwStats);
    setPrevWeekStats(pwStats);

    if (cwStats && pwStats) {
      if (pwStats.total > 0) {
        const change = ((cwStats.total - pwStats.total) / pwStats.total) * 100;
        setPercentageChange(parseFloat(change.toFixed(1)));
      } else if (cwStats.total > 0) {
        setPercentageChange(100); // Infinite growth if prev week was 0 and current week > 0
      } else {
        setPercentageChange(0); // No change if both are 0
      }
    } else {
      setPercentageChange(null);
    }
  }, [selectedTaskFilterId, getStatsForCompletedWeek]);

  const renderPercentageChange = () => {
    if (percentageChange === null) return <span className="text-sm text-muted-foreground">No comparison data</span>;

    let Icon = Minus;
    let colorClass = "text-muted-foreground";

    if (percentageChange > 0) {
      Icon = ArrowUp;
      colorClass = "text-green-500";
    } else if (percentageChange < 0) {
      Icon = ArrowDown;
      colorClass = "text-red-500";
    }

    return (
      <div className={`flex items-center text-sm font-medium ${colorClass}`}>
        <Icon className="h-4 w-4 mr-1" />
        {percentageChange > 0 ? '+' : ''}{percentageChange}% vs Previous Week
      </div>
    );
  };

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="h-6 w-6 text-accent" />
          <CardTitle>{cardTitle}</CardTitle>
        </div>
        {currentWeekStats && (
            <CardDescription>
                Week of {format(currentWeekStats.startDate, 'MMM d')} - {format(currentWeekStats.endDate, 'MMM d, yyyy')}
            </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3 flex-grow flex flex-col justify-center">
        <div>
          <p className="text-sm text-muted-foreground">This Week's Total</p>
          <p className="text-2xl font-bold text-foreground">
            {currentWeekStats !== null ? currentWeekStats.total.toLocaleString() : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Previous Week Total</p>
          <p className="text-lg text-muted-foreground">
            {prevWeekStats !== null ? prevWeekStats.total.toLocaleString() : 'N/A'}
          </p>
        </div>
        {renderPercentageChange()}
      </CardContent>
    </Card>
  );
};

export default WeeklyProgressCard;
