
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Pencil, Trash2, Info, Target, Zap, PlusCircle } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import type { TaskDefinition } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { VALUE_THRESHOLDS } from '@/lib/config'; 
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type TaskFormData = z.infer<ReturnType<typeof createTaskFormSchema>>;

interface ManageTasksModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const createTaskFormSchema = (existingTasks: TaskDefinition[], editingTaskId: string | null) => z.object({
  name: z.string()
    .min(1, "Task name is required.")
    .max(50, "Task name must be 50 characters or less.")
    .refine(
      (name) => {
        const lowerCaseName = name.toLowerCase();
        return !existingTasks.some(
          (task) => task.id !== editingTaskId && task.name.toLowerCase() === lowerCaseName
        );
      },
      { message: "This task name already exists." }
    ),
  color: z.string().regex(/^(#[0-9A-Fa-f]{6}|hsl\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*\))$/, "Color must be a valid hex or HSL string."),
  goalValue: z.preprocess(
    val => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive("Goal must be a positive number.").optional()
  ),
  goalInterval: z.preprocess(
    val => (val === "none" || val === "" || val === null || val === undefined ? undefined : val), 
    z.enum(['daily', 'weekly', 'monthly']).optional()
  ),
  goalCompletionBonusPercentage: z.preprocess(
    val => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0, "Bonus must be non-negative.").max(200, "Bonus can't exceed 200%.").optional()
  ),
  threshold1: z.preprocess(val => val === "" || val === null || val === undefined ? undefined : Number(val), z.number().positive("Must be > 0").optional()),
  threshold2: z.preprocess(val => val === "" || val === null || val === undefined ? undefined : Number(val), z.number().positive("Must be > 0").optional()),
  threshold3: z.preprocess(val => val === "" || val === null || val === undefined ? undefined : Number(val), z.number().positive("Must be > 0").optional()),
  threshold4: z.preprocess(val => val === "" || val === null || val === undefined ? undefined : Number(val), z.number().positive("Must be > 0").optional()),
  darkStreakEnabled: z.boolean().optional(),
}).superRefine((data, ctx) => {
    const thresholds = [data.threshold1, data.threshold2, data.threshold3, data.threshold4];
    const providedThresholds = thresholds.filter(t => t !== undefined) as number[];

    if (providedThresholds.length > 0 && providedThresholds.length < 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["threshold1"],
        message: "Fill all 4 phases or leave all blank.",
      });
    }

    if (providedThresholds.length === 4) {
      if (!(providedThresholds[0] < providedThresholds[1] &&
            providedThresholds[1] < providedThresholds[2] &&
            providedThresholds[2] < providedThresholds[3])) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["threshold1"],
            message: "Phases must be in increasing order.",
        });
      }
    }

    if (data.goalValue && data.threshold1 && data.goalValue < data.threshold1) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["goalValue"],
            message: `Goal must be >= Phase 1 value (${data.threshold1}).`,
        });
    }
});


const ManageTasksModal: React.FC<ManageTasksModalProps> = ({ isOpen, onOpenChange }) => {
  const { taskDefinitions, addTaskDefinition, updateTaskDefinition, deleteTaskDefinition } = useUserRecords();
  const { toast } = useToast();
  const [editingTask, setEditingTask] = useState<TaskDefinition | null>(null);

  const taskFormSchema = useMemo(() => {
    return createTaskFormSchema(taskDefinitions, editingTask?.id || null);
  }, [taskDefinitions, editingTask]);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: '',
      color: '#aabbcc',
      goalValue: undefined,
      goalInterval: undefined,
      goalCompletionBonusPercentage: undefined,
      threshold1: undefined,
      threshold2: undefined,
      threshold3: undefined,
      threshold4: undefined,
      darkStreakEnabled: false,
    },
  });

  const resetFormFields = (task: TaskDefinition | null = null) => {
    form.reset({
      name: task?.name || '',
      color: task?.color || '#aabbcc',
      goalValue: task?.goalValue ?? undefined,
      goalInterval: task?.goalInterval ?? undefined,
      goalCompletionBonusPercentage: task?.goalCompletionBonusPercentage ?? undefined,
      threshold1: task?.intensityThresholds?.[0] ?? undefined,
      threshold2: task?.intensityThresholds?.[1] ?? undefined,
      threshold3: task?.intensityThresholds?.[2] ?? undefined,
      threshold4: task?.intensityThresholds?.[3] ?? undefined,
      darkStreakEnabled: task?.darkStreakEnabled ?? false,
    });
    setEditingTask(task);
  };

  useEffect(() => {
    if (isOpen) { 
      resetFormFields(null);
    }
  }, [isOpen]);

  const onSubmit = (data: TaskFormData) => {
    let intensityThresholds: number[] | undefined = undefined;
    const th = [data.threshold1, data.threshold2, data.threshold3, data.threshold4];
    const providedThresholds = th.filter(t => t !== undefined) as number[];

    if (providedThresholds.length === 4) {
      intensityThresholds = providedThresholds;
    }

    const goalValue = data.goalValue && Number(data.goalValue) > 0 ? Number(data.goalValue) : undefined;
    const goalInterval = goalValue ? data.goalInterval : undefined;
    const goalCompletionBonusPercentage = data.goalCompletionBonusPercentage && Number(data.goalCompletionBonusPercentage) > 0 ? Number(data.goalCompletionBonusPercentage) : undefined;

    const taskData = {
      name: data.name,
      color: data.color,
      goalValue: goalValue,
      goalInterval: goalInterval,
      intensityThresholds: intensityThresholds,
      goalCompletionBonusPercentage: goalCompletionBonusPercentage,
      darkStreakEnabled: data.darkStreakEnabled,
    };

    if (editingTask) {
      updateTaskDefinition({ ...editingTask, ...taskData });
      toast({ title: "Task Updated", description: `Task "${data.name}" updated.` });
    } else {
      addTaskDefinition(taskData);
      toast({ title: "Task Added", description: `Task "${data.name}" added.` });
    }
    resetFormFields(null);
  };

  const handleDeleteTask = (taskId: string, taskName: string) => {
    deleteTaskDefinition(taskId);
    toast({ title: "Task Deleted", description: `Task "${taskName}" deleted.`, variant: "destructive" });
    if (editingTask?.id === taskId) {
      resetFormFields(null);
    }
  };
  
  const watchGoalValue = form.watch('goalValue');

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        resetFormFields(null);
      }
    }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Tasks</DialogTitle>
          <DialogDescription>Add, edit, or delete your task types, their display properties, and goals.</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-4">
          {/* Left Column: Existing Tasks */}
          <div className="flex flex-col">
            <h3 className="text-lg font-medium mb-2 text-primary">Existing Tasks</h3>
            <ScrollArea className="flex-grow h-[450px] pr-4 -mr-4">
              {taskDefinitions.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-10">No tasks defined yet.</p>
              ) : (
                <TooltipProvider>
                  <div className="space-y-3">
                    {taskDefinitions.map((task) => (
                      <div key={task.id} className={cn("p-3 border rounded-lg transition-all", editingTask?.id === task.id ? 'bg-muted border-primary/50' : 'bg-card-foreground/5')}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-8 rounded-full" style={{ backgroundColor: task.color }} />
                            <span className="font-semibold">{task.name}</span>
                          </div>
                           <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => resetFormFields(task)}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit {task.name}</span>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete {task.name}</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{task.name}" and remove it from any existing records.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteTask(task.id, task.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground mt-2 pl-5">
                          {task.darkStreakEnabled && (
                            <Tooltip><TooltipTrigger><Zap className="h-4 w-4 text-yellow-400" /></TooltipTrigger><TooltipContent><p>Dark Streak Enabled</p></TooltipContent></Tooltip>
                          )}
                          {task.goalValue && (
                            <Tooltip><TooltipTrigger><Target className="h-4 w-4" /></TooltipTrigger><TooltipContent>
                              <p>Goal: {task.goalValue}{task.goalInterval ? ` / ${task.goalInterval.replace('ly', '')}` : ''}{task.goalCompletionBonusPercentage ? `, ${task.goalCompletionBonusPercentage}% Bonus` : ''}</p>
                            </TooltipContent></Tooltip>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TooltipProvider>
              )}
            </ScrollArea>
          </div>

          {/* Right Column: Add/Edit Form */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-primary">
                  {editingTask ? 'Edit Task' : 'Add New Task'}
                </h3>
                {editingTask && (
                  <Button variant="outline" size="sm" onClick={() => resetFormFields(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Task
                  </Button>
                )}
            </div>
            <ScrollArea className="flex-grow h-[450px] pr-4 -mr-4">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="taskName">Task Name</Label>
                  <Input id="taskName" {...form.register('name')} className="mt-1" />
                  {form.formState.errors.name && (<p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>)}
                </div>
                <div>
                  <Label htmlFor="taskColor">Task Color</Label>
                  <Controller name="color" control={form.control} render={({ field }) => (
                    <div className="flex items-center mt-1 gap-2">
                      <Input id="taskColor" type="color" value={field.value.startsWith('hsl') ? '#000000' : field.value} onChange={(e) => field.onChange(e.target.value)} className="w-10 h-10 p-1 border-2 cursor-pointer"/>
                      <Input type="text" value={field.value} onChange={field.onChange} placeholder="hsl(H, S%, L%) or #RRGGBB" className="flex-grow"/>
                    </div>
                  )}/>
                  {form.formState.errors.color && (<p className="text-sm text-destructive mt-1">{form.formState.errors.color.message}</p>)}
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-sm py-2"><div className="flex items-center gap-2"><Target className="h-4 w-4 text-muted-foreground" />Goals & Bonuses (Optional)</div></AccordionTrigger>
                    <AccordionContent className="pt-2 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
                        <div className="sm:col-span-1"><Label htmlFor="goalValue">Goal</Label><Input id="goalValue" type="number" {...form.register('goalValue')} className="mt-1"/></div>
                        <div className="sm:col-span-1"><Label htmlFor="goalInterval">Interval</Label><Controller name="goalInterval" control={form.control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value ?? ""} disabled={!watchGoalValue || Number(watchGoalValue) <= 0}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select>)}/></div>
                        <div className="sm:col-span-1"><Label htmlFor="goalCompletionBonusPercentage">Bonus %</Label><Input id="goalCompletionBonusPercentage" type="number" {...form.register('goalCompletionBonusPercentage')} className="mt-1" disabled={!watchGoalValue || Number(watchGoalValue) <= 0}/></div>
                      </div>
                       {form.formState.errors.goalValue && (<p className="text-sm text-destructive mt-1">{form.formState.errors.goalValue.message}</p>)}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-sm py-2"><div className="flex items-center gap-2"><Info className="h-4 w-4 text-muted-foreground" />Custom Intensity Phases (Optional)</div></AccordionTrigger>
                    <AccordionContent className="pt-2 space-y-3">
                      <p className="text-xs text-muted-foreground">Define 4 values for different shades. Defaults: {VALUE_THRESHOLDS.join(', ')}.</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {[1, 2, 3, 4].map(i => (<div key={i}><Label htmlFor={`threshold${i}`}>Phase {i}</Label><Input id={`threshold${i}`} type="number" {...form.register(`threshold${i}` as keyof TaskFormData)} className="mt-1"/></div>))}
                      </div>
                      {form.formState.errors.threshold1 && (<p className="text-sm text-destructive mt-1">{form.formState.errors.threshold1.message}</p>)}
                    </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="item-3">
                    <AccordionTrigger className="text-sm py-2"><div className="flex items-center gap-2"><Zap className="h-4 w-4 text-muted-foreground" />Dark Streak (High Stakes)</div></AccordionTrigger>
                    <AccordionContent className="pt-2 space-y-3">
                      <p className="text-xs text-muted-foreground">Enable this for a high-stakes daily challenge. Missing a day incurs a heavy penalty and a dare.</p>
                      <Controller name="darkStreakEnabled" control={form.control} render={({ field }) => (<div className="flex items-center space-x-2 mt-2"><Switch id="dark-streak" checked={field.value} onCheckedChange={field.onChange} /><Label htmlFor="dark-streak">Enable Dark Streak</Label></div>)}/>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                    {form.formState.isSubmitting ? "Saving..." : (editingTask ? 'Save Changes' : 'Add Task')}
                  </Button>
                </div>
              </form>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageTasksModal;

    