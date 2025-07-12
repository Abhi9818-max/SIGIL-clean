
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
  const { getStatsForCompletedWeek } = useUserRecords(); // Removed getTaskDefinitionById as title is static
  const [lastWeekStats, setLastWeekStats] = useState<WeeklyProgressStats | null>(null);
  const [prevWeekStats, setPrevWeekStats] = useState<WeeklyProgressStats | null>(null);
  const [percentageChange, setPercentageChange] = useState<number | null>(null);
  const staticTitle = "Last Week's Overall Progress"; // Static title from image

  useEffect(() => {
    const lwStats = getStatsForCompletedWeek(0, selectedTaskFilterId);
    const pwStats = getStatsForCompletedWeek(1, selectedTaskFilterId);

    setLastWeekStats(lwStats);
    setPrevWeekStats(pwStats);

    if (lwStats && pwStats) {
      if (pwStats.total > 0) {
        const change = ((lwStats.total - pwStats.total) / pwStats.total) * 100;
        setPercentageChange(parseFloat(change.toFixed(1)));
      } else if (lwStats.total > 0) {
        setPercentageChange(100); // Infinite growth if prev week was 0 and last week > 0
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
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="h-6 w-6 text-accent" />
          <CardTitle>{staticTitle}</CardTitle>
        </div>
        {lastWeekStats && (
            <CardDescription>
                Week of {format(lastWeekStats.startDate, 'MMM d')} - {format(lastWeekStats.endDate, 'MMM d, yyyy')}
            </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Last Week Total</p>
          <p className="text-2xl font-bold text-foreground">
            {lastWeekStats !== null ? lastWeekStats.total.toLocaleString() : 'N/A'}
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
