
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Target, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const GoalProgressCard: React.FC = () => {
  const { taskDefinitions, getProgressForCurrentGoal } = useUserRecords();

  const weeklyGoalTasks = taskDefinitions.filter(
    (task) => task.goalInterval === 'weekly' && task.goalValue && task.goalValue > 0
  );

  const goalData = weeklyGoalTasks.map(task => ({
    ...task,
    progress: getProgressForCurrentGoal(task.id)
  })).filter(item => item.progress !== null);

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-accent" />
          <CardTitle>Weekly Goal Progress</CardTitle>
        </div>
        <CardDescription>
          Your active progress towards this week's goals.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {goalData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground">No weekly goals set.</p>
            <Link href="/goals" className="text-sm text-primary hover:underline mt-1">
              Set goals here
            </Link>
          </div>
        ) : (
          <ScrollArea className="h-[180px] pr-3">
            <div className="space-y-4">
              {goalData.map(task => {
                if (!task.progress) return null;
                const { current, goal, percentage, unit, isMet } = task.progress;
                
                return (
                  <div key={task.id}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        {isMet ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4" />}
                        <p className="text-sm font-medium" style={{ color: task.color }}>
                          {task.name}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {current.toLocaleString()} / {goal.toLocaleString()} {unit}
                      </p>
                    </div>
                    <Progress value={percentage} indicatorClassName={cn(isMet ? "bg-green-500" : "")} style={{ '--primary': task.color } as React.CSSProperties} />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalProgressCard;
