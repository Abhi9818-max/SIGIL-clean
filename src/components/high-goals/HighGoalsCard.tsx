
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const HighGoalsCard = () => {
  const { highGoals, getHighGoalProgress, getTaskDefinitionById } = useUserRecords();

  const recentGoals = [...highGoals].sort((a, b) => parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime()).slice(0, 3);

  const getUnitLabelForTask = (taskId: string | undefined): string => {
    if (!taskId) return 'Value';
    const task = getTaskDefinitionById(taskId);
    if (!task || !task.unit) return 'Value';
    
    switch (task.unit) {
      case 'custom':
        return task.customUnitName || 'Value';
      case 'count':
      case 'generic':
        return '';
      default:
        return task.unit.charAt(0).toUpperCase() + task.unit.slice(1);
    }
  };

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-accent" />
          <CardTitle>High Goals</CardTitle>
        </div>
        <CardDescription>Your long-term ambitions at a glance.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {recentGoals.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-muted-foreground py-4">No high goals set. Aim high!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentGoals.map(goal => {
              const task = getTaskDefinitionById(goal.taskId);
              const progress = getHighGoalProgress(goal);
              const percentage = Math.min((progress / goal.targetValue) * 100, 100);
              const unit = getUnitLabelForTask(goal.taskId);

              return (
                <div key={goal.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium" style={{ color: task?.color }}>{goal.name}</span>
                    <span className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={percentage} indicatorClassName="transition-all duration-500" style={{ '--tw-bg-opacity': '1', backgroundColor: task?.color }} />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{progress.toLocaleString()} / {goal.targetValue.toLocaleString()} {unit}</span>
                    <span>Ends {format(parseISO(goal.endDate), 'MMM d')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/high-goals">
            Manage All High Goals
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default HighGoalsCard;
