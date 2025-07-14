
"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart2, Calendar, CornerDownLeft, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { subDays, startOfYear } from 'date-fns';
import TaskDistributionChart from '@/components/insights/TaskDistributionChart';
import ProductivityByDayChart from '@/components/insights/ProductivityByDayChart';
import Link from 'next/link';

type TimeRange = 'last_30_days' | 'last_90_days' | 'this_year' | 'custom';

export default function InsightsPage() {
  const { getUserLevelInfo } = useUserRecords();
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('last_30_days');
  const [customDays, setCustomDays] = useState<number>(7);
  const [dateRange, setDateRange] = useState<{ start: Date, end: Date }>({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const calculateDateRange = (range: TimeRange, days?: number) => {
    const now = new Date();
    let start;
    const end = now;

    switch (range) {
      case 'last_90_days':
        start = subDays(now, 89);
        break;
      case 'this_year':
        start = startOfYear(now);
        break;
      case 'custom':
        start = subDays(now, (days || 7) - 1);
        break;
      case 'last_30_days':
      default:
        start = subDays(now, 29);
        break;
    }
    setDateRange({ start, end });
  };

  useEffect(() => {
    if (timeRange !== 'custom') {
      calculateDateRange(timeRange);
    }
  }, [timeRange]);

  const handleCustomDaysApply = () => {
    if (customDays > 0) {
      setTimeRange('custom'); // Set range to custom to reflect the action
      calculateDateRange('custom', customDays);
    }
  };
  
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-6 w-6 text-primary" />
                  <CardTitle>Your Insights</CardTitle>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Select onValueChange={(value: TimeRange) => setTimeRange(value)} defaultValue={timeRange}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Select time range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                            <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                            <SelectItem value="this_year">This Year</SelectItem>
                             <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Input 
                            type="number"
                            value={customDays}
                            onChange={(e) => setCustomDays(Number(e.target.value))}
                            placeholder="Days"
                            className="w-24"
                            onFocus={() => setTimeRange('custom')}
                        />
                        <Button onClick={handleCustomDaysApply} size="sm" variant="secondary">
                            <Search className="mr-2 h-4 w-4"/>
                            Apply
                        </Button>
                    </div>
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
