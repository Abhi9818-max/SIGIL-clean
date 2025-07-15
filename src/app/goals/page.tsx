
"use client";

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Target, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskDefinition } from '@/types';

const goalFormSchema = z.object({
  goalValue: z.preprocess(
    val => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive("Goal must be a positive number.").optional()
  ),
  goalInterval: z.preprocess(
    val => (val === "none" || val === "" || val === null || val === undefined ? undefined : val), 
    z.enum(['daily', 'weekly', 'monthly']).optional()
  ),
  goalType: z.enum(['at_least', 'no_more_than']).optional(),
  goalCompletionBonusPercentage: z.preprocess(
    val => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0, "Bonus must be non-negative.").max(200, "Can't exceed 200%.").optional()
  ),
});

type GoalFormData = z.infer<typeof goalFormSchema>;

interface GoalFormProps {
  task: TaskDefinition;
  onSave: (taskId: string, data: GoalFormData) => void;
}

const GoalForm: React.FC<GoalFormProps> = ({ task, onSave }) => {
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      goalValue: task.goalValue ?? undefined,
      goalInterval: task.goalInterval ?? undefined,
      goalType: task.goalType ?? 'at_least',
      goalCompletionBonusPercentage: task.goalCompletionBonusPercentage ?? undefined,
    },
  });

  const watchGoalValue = watch('goalValue');

  const onSubmit = (data: GoalFormData) => {
    onSave(task.id, data);
  };
  
  const unitLabel = task.unit ? task.unit.charAt(0).toUpperCase() + task.unit.slice(1) : 'Value';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
            <Label htmlFor={`goalType-${task.id}`}>Goal Type</Label>
            <Controller name="goalType" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value ?? "at_least"} disabled={!watchGoalValue}>
                <SelectTrigger id={`goalType-${task.id}`} className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                <SelectItem value="at_least">At Least</SelectItem>
                <SelectItem value="no_more_than">No More Than</SelectItem>
                </SelectContent>
            </Select>
            )} />
        </div>
        <div>
            <Label htmlFor={`goalValue-${task.id}`}>Target ({unitLabel})</Label>
            <Input id={`goalValue-${task.id}`} type="number" {...register('goalValue')} className="mt-1" placeholder="e.g., 10" />
            {errors.goalValue && <p className="text-sm text-destructive mt-1">{errors.goalValue.message}</p>}
        </div>
        <div>
            <Label htmlFor={`goalInterval-${task.id}`}>Interval</Label>
            <Controller name="goalInterval" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={!watchGoalValue}>
                <SelectTrigger id={`goalInterval-${task.id}`} className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
            </Select>
            )} />
        </div>
        <div>
            <Label htmlFor={`bonus-${task.id}`}>Bonus %</Label>
            <Input id={`bonus-${task.id}`} type="number" {...register('goalCompletionBonusPercentage')} className="mt-1" placeholder="e.g., 20" disabled={!watchGoalValue} />
            {errors.goalCompletionBonusPercentage && <p className="text-sm text-destructive mt-1">{errors.goalCompletionBonusPercentage.message}</p>}
        </div>
        </div>
        <Button type="submit" className="w-full mt-4">
        <Save className="mr-2 h-4 w-4" />
        Save Goal
        </Button>
    </form>
  );
};

export default function GoalsPage() {
  const { taskDefinitions, updateTaskDefinition, getUserLevelInfo } = useUserRecords();
  const { toast } = useToast();
  
  const defaultTab = taskDefinitions.length > 0 ? taskDefinitions[0].id : "";
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(defaultTab);

  const handleSaveGoal = (taskId: string, data: GoalFormData) => {
    const taskToUpdate = taskDefinitions.find(t => t.id === taskId);
    if (!taskToUpdate) return;

    const goalValue = data.goalValue && Number(data.goalValue) > 0 ? Number(data.goalValue) : undefined;
    
    const updatedTask = {
      ...taskToUpdate,
      goalValue: goalValue,
      goalInterval: goalValue ? data.goalInterval : undefined,
      goalType: goalValue ? data.goalType : undefined,
      goalCompletionBonusPercentage: data.goalCompletionBonusPercentage && Number(data.goalCompletionBonusPercentage) > 0 ? Number(data.goalCompletionBonusPercentage) : undefined,
    };

    updateTaskDefinition(updatedTask);
    toast({
      title: "Goal Saved!",
      description: `Your goal for "${taskToUpdate.name}" has been updated.`,
    });
  };

  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';
  
  const selectedTask = selectedTaskId ? taskDefinitions.find(t => t.id === selectedTaskId) : null;

  return (
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
      <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
        <Card className="shadow-lg w-full max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              <CardTitle>Pacts & Goals</CardTitle>
            </div>
            <CardDescription>
              Forge your pacts. Set daily, weekly, or monthly goals for each task and define the stakes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {taskDefinitions.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                <p>No tasks defined.</p>
                <p className="text-sm">Create tasks in "Manage Tasks" on the dashboard to set goals for them.</p>
              </div>
            ) : (
                <div className="w-full space-y-4">
                  <div>
                    <Label htmlFor="task-select">Select Task</Label>
                    <Select onValueChange={setSelectedTaskId} value={selectedTaskId ?? ""}>
                      <SelectTrigger id="task-select" className="mt-1">
                        <SelectValue placeholder="Choose a task..." />
                      </SelectTrigger>
                      <SelectContent>
                        {taskDefinitions.map(task => (
                          <SelectItem key={task.id} value={task.id} style={{ color: task.color }}>
                            {task.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedTask ? (
                    <GoalForm task={selectedTask} onSave={handleSaveGoal} />
                  ) : (
                    <div className="text-center text-muted-foreground py-10">
                      <p>Select a task from the dropdown to set its goal.</p>
                    </div>
                  )}
                </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
