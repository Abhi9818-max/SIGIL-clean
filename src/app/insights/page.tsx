
"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart2, Calendar, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subDays, startOfYear, endOfYear, subMonths } from 'date-fns';
import TaskDistributionChart from '@/components/insights/TaskDistributionChart';
import ProductivityByDayChart from '@/components/insights/ProductivityByDayChart';
import Link from 'next/link';

type TimeRange = 'last_30_days' | 'last_90_days' | 'this_year';

export default function InsightsPage() {
  const { getUserLevelInfo } = useUserRecords();
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('last_30_days');
  const [dateRange, setDateRange] = useState<{ start: Date, end: Date }>({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    const now = new Date();
    let start;
    const end = now;
    switch (timeRange) {
      case 'last_90_days':
        start = subDays(now, 89);
        break;
      case 'this_year':
        start = startOfYear(now);
        break;
      case 'last_30_days':
      default:
        start = subDays(now, 29);
        break;
    }
    setDateRange({ start, end });
  }, [timeRange]);


  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';
  
  return (
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
      <Header 
        onAddRecordClick={() => {}} 
        onManageTasksClick={() => {}}
      />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
        <Card className="shadow-lg w-full max-w-6xl mx-auto">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 mb-4 sm:mb-0">
                  <BarChart2 className="h-6 w-6 text-primary" />
                  <CardTitle>Your Insights</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Select onValueChange={(value: TimeRange) => setTimeRange(value)} defaultValue={timeRange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select time range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                            <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                            <SelectItem value="this_year">This Year</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <CardDescription>A deeper look into your patterns of growth and effort.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TaskDistributionChart startDate={dateRange.start} endDate={dateRange.end} />
                <ProductivityByDayChart startDate={dateRange.start} endDate={dateRange.end} />
            </div>
          </CardContent>
        </Card>
        <div className="text-center mt-8">
            <Button asChild variant="outline">
                <Link href="/">
                    <CornerDownLeft className="mr-2 h-4 w-4" />
                    Return to Dashboard
                </Link>
            </Button>
        </div>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t border-border">
        S.I.G.I.L. Insights &copy; {currentYear}
      </footer>
    </div>
  );
}
