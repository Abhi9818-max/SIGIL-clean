
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
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
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from '@/components/ui/separator';
import { Pencil, Trash2, Info, Target, Zap, PlusCircle, Timer, CalendarCheck, Clock, Check } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import type { TaskDefinition, TaskUnit } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { VALUE_THRESHOLDS } from '@/lib/config'; 
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

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
  unit: z.enum(['count', 'minutes', 'hours', 'pages', 'generic', 'custom']).optional(),
  customUnitName: z.string().max(20, "Custom unit must be 20 characters or less.").optional(),
  threshold1: z.preprocess(val => val === "" || val === null || val === undefined ? undefined : Number(val), z.number().positive("Must be > 0").optional()),
  threshold2: z.preprocess(val => val === "" || val === null || val === undefined ? undefined : Number(val), z.number().positive("Must be > 0").optional()),
  threshold3: z.preprocess(val => val === "" || val === null || val === undefined ? undefined : Number(val), z.number().positive("Must be > 0").optional()),
  threshold4: z.preprocess(val => val === "" || val === null || val === undefined ? undefined : Number(val), z.number().positive("Must be > 0").optional()),
  darkStreakEnabled: z.boolean().optional(),
  frequencyType: z.enum(['daily', 'weekly']).optional(),
  frequencyCount: z.preprocess(
    val => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(1, "Must be at least 1").max(7, "Cannot be more than 7").optional()
  ),
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
    
    if (data.unit === 'custom' && (!data.customUnitName || data.customUnitName.trim().length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["customUnitName"],
            message: "Custom unit name is required.",
        });
    }
    if (data.frequencyType === 'weekly' && (data.frequencyCount === undefined || data.frequencyCount === null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["frequencyCount"],
        message: "Count is required for weekly frequency.",
      });
    }
});

type TaskFormData = z.infer<ReturnType<typeof createTaskFormSchema>>;

interface ManageTasksModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const ManageTasksModal: React.FC<ManageTasksModalProps> = ({ isOpen, onOpenChange }) => {
  const { taskDefinitions, addTaskDefinition, updateTaskDefinition, deleteTaskDefinition, addRecord } = useUserRecords();
  const { toast } = useToast();
  const [editingTask, setEditingTask] = useState<TaskDefinition | null>(null);
  const [quickLogTaskId, setQuickLogTaskId] = useState<string | null>(null);
  const [quickLogValue, setQuickLogValue] = useState('');

  const taskFormSchema = useMemo(() => {
    return createTaskFormSchema(taskDefinitions, editingTask?.id || null);
  }, [taskDefinitions, editingTask]);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: '',
      color: 'hsl(210, 40%, 96.1%)',
      unit: 'count',
      customUnitName: '',
      threshold1: undefined,
      threshold2: undefined,
      threshold3: undefined,
      threshold4: undefined,
      darkStreakEnabled: false,
      frequencyType: 'daily',
      frequencyCount: undefined,
    },
  });

  const resetFormFields = (task: TaskDefinition | null = null) => {
    form.reset({
      name: task?.name || '',
      color: task?.color || 'hsl(210, 40%, 96.1%)',
      unit: task?.unit ?? 'count',
      customUnitName: task?.customUnitName || '',
      threshold1: task?.intensityThresholds?.[0] ?? undefined,
      threshold2: task?.intensityThresholds?.[1] ?? undefined,
      threshold3: task?.intensityThresholds?.[2] ?? undefined,
      threshold4: task?.intensityThresholds?.[3] ?? undefined,
      darkStreakEnabled: task?.darkStreakEnabled ?? false,
      frequencyType: task?.frequencyType ?? 'daily',
      frequencyCount: task?.frequencyCount ?? undefined,
    });
    setEditingTask(task);
  };

  useEffect(() => {
    if (isOpen) { 
      resetFormFields(null);
      setQuickLogTaskId(null);
    }
  }, [isOpen]);

  const onSubmit = (data: TaskFormData) => {
    let intensityThresholds: number[] | undefined = undefined;
    const th = [data.threshold1, data.threshold2, data.threshold3, data.threshold4];
    const providedThresholds = th.filter(t => t !== undefined) as number[];

    if (providedThresholds.length === 4) {
      intensityThresholds = providedThresholds;
    }

    const taskData = {
      name: data.name,
      color: data.color,
      intensityThresholds: intensityThresholds,
      unit: data.unit,
      customUnitName: data.unit === 'custom' ? data.customUnitName : undefined,
      darkStreakEnabled: data.darkStreakEnabled,
      frequencyType: data.frequencyType,
      frequencyCount: data.frequencyType === 'weekly' ? data.frequencyCount : undefined,
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
  
  const watchUnit = form.watch('unit');
  const watchFrequencyType = form.watch('frequencyType');

  const handleQuickLog = (task: TaskDefinition) => {
    if (!quickLogValue || Number(quickLogValue) <= 0) {
      toast({ title: 'Invalid Value', description: 'Please enter a positive number to log.', variant: 'destructive' });
      return;
    }

    addRecord({
      date: format(new Date(), 'yyyy-MM-dd'),
      value: Number(quickLogValue),
      taskType: task.id,
      notes: 'Quick log from Manage Tasks',
    });

    toast({
      title: 'Time Logged!',
      description: `${quickLogValue} ${task.unit} logged for "${task.name}".`,
    });

    setQuickLogValue('');
    setQuickLogTaskId(null);
  };

  const getUnitLabel = (task: TaskDefinition) => {
    if (task.unit === 'custom' && task.customUnitName) {
      return task.customUnitName;
    }
    return task.unit ? task.unit.charAt(0).toUpperCase() + task.unit.slice(1) : 'Value';
  };

  const unitPlaceholders: Record<Exclude<TaskUnit, 'custom'>, string> = {
    count: 'e.g., 5',
    minutes: 'e.g., 30',
    hours: 'e.g., 1',
    pages: 'e.g., 10',
    generic: 'e.g., 100',
  };
  const currentUnitLabel = watchUnit === 'custom' ? (form.getValues('customUnitName') || 'Custom') : (watchUnit ? watchUnit.charAt(0).toUpperCase() + watchUnit.slice(1) : 'Value');

  const getFrequencyLabel = (task: TaskDefinition) => {
    if (task.frequencyType === 'weekly') {
      return `${task.frequencyCount}x a week`;
    }
    return 'Daily';
  };

  if (!isOpen) {
    return null;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        resetFormFields(null);
      }
    }}>
      <DialogContent className="sm:max-w-lg p-0 flex flex-col max-h-screen md:max-h-[90vh]">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle>Manage Tasks</DialogTitle>
          <DialogDescription>Add, edit, or delete your task types and their display properties.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="flex flex-col gap-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="p-4 rounded-lg bg-muted/30 border space-y-4">
                <div className="flex justify-between items-center">
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
                  <div>
                    <Label htmlFor="taskName">Task Name</Label>
                    <Input id="taskName" {...form.register('name')} className="mt-1" />
                    {form.formState.errors.name && (<p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>)}
                  </div>
                  <div>
                    <Label htmlFor="taskColor">Task Color</Label>
                    <Controller name="color" control={form.control} render={({ field }) => (
                      <div className="flex items-center mt-1 gap-2 border border-input rounded-md pr-2 focus-within:ring-2 focus-within:ring-ring">
                        <Input id="taskColor" type="color" value={field.value.startsWith('hsl') ? '#000000' : field.value} onChange={(e) => field.onChange(e.target.value)} className="w-10 h-10 p-1 border-0 bg-transparent cursor-pointer"/>
                        <Input type="text" value={field.value} onChange={field.onChange} placeholder="hsl(...) or #..." className="flex-grow border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"/>
                      </div>
                    )}/>
                    {form.formState.errors.color && (<p className="text-sm text-destructive mt-1">{form.formState.errors.color.message}</p>)}
                  </div>
                </div>
                
                <Accordion type="multiple" className="w-full space-y-2">
                  <AccordionItem value="scheduling" className="border-b-0">
                    <AccordionTrigger className="text-sm py-2 px-3 bg-muted/50 rounded-md hover:bg-muted/80 [&[data-state=open]]:rounded-b-none">
                      <div className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-muted-foreground" />Task Scheduling</div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 px-3 pb-3 space-y-3 bg-muted/20 rounded-b-md">
                      <p className="text-xs text-muted-foreground">Set how often this task should be completed to affect streak and consistency calculations.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="frequencyType">Frequency</Label>
                          <Controller name="frequencyType" control={form.control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value ?? 'daily'}>
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Every Day</SelectItem>
                                <SelectItem value="weekly">X times a week</SelectItem>
                              </SelectContent>
                            </Select>
                          )} />
                        </div>
                        {watchFrequencyType === 'weekly' && (
                          <div className="animate-fade-in-up">
                            <Label htmlFor="frequencyCount">Times per week</Label>
                            <Input id="frequencyCount" type="number" {...form.register('frequencyCount')} className="mt-1" placeholder="e.g., 3" />
                            {form.formState.errors.frequencyCount && (<p className="text-sm text-destructive mt-1">{form.formState.errors.frequencyCount.message}</p>)}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="intensity" className="border-b-0">
                    <AccordionTrigger className="text-sm py-2 px-3 bg-muted/50 rounded-md hover:bg-muted/80 [&[data-state=open]]:rounded-b-none"><div className="flex items-center gap-2"><Timer className="h-4 w-4 text-muted-foreground" />Custom Intensity Phases (Optional)</div></AccordionTrigger>
                    <AccordionContent className="pt-4 px-3 pb-3 space-y-3 bg-muted/20 rounded-b-md">
                      <p className="text-xs text-muted-foreground">Define 4 values for different shades. Defaults: {VALUE_THRESHOLDS.join(', ')}.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="unit">Unit of Measurement</Label>
                          <Controller name="unit" control={form.control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value ?? "count"}><SelectTrigger className="mt-1"><SelectValue placeholder="Select unit" /></SelectTrigger><SelectContent><SelectItem value="count">Count</SelectItem><SelectItem value="minutes">Minutes</SelectItem><SelectItem value="hours">Hours</SelectItem><SelectItem value="pages">Pages</SelectItem><SelectItem value="generic">Generic Units</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent></Select>)}/>
                        </div>
                        {watchUnit === 'custom' && (
                          <div className="animate-fade-in-up">
                            <Label htmlFor="customUnitName">Custom Unit Name</Label>
                            <Input id="customUnitName" {...form.register('customUnitName')} className="mt-1" placeholder="e.g., Commits" />
                             {form.formState.errors.customUnitName && (<p className="text-sm text-destructive mt-1">{form.formState.errors.customUnitName.message}</p>)}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {[1, 2, 3, 4].map(i => (<div key={i}><Label htmlFor={`threshold${i}`}>Phase {i} ({currentUnitLabel})</Label><Input id={`threshold${i}`} type="number" placeholder={watchUnit && watchUnit !== 'custom' ? unitPlaceholders[watchUnit] : 'e.g., 5'} {...form.register(`threshold${i}` as keyof TaskFormData)} className="mt-1"/></div>))}
                      </div>
                      {form.formState.errors.threshold1 && (<p className="text-sm text-destructive mt-1">{form.formState.errors.threshold1.message}</p>)}
                    </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="dark-streak" className="border-b-0">
                      <div className="flex items-center justify-between text-sm py-2 px-3 bg-muted/50 rounded-md hover:bg-muted/80 [&[data-state=open]]:rounded-b-none">
                          <AccordionTrigger className="flex-1 py-0 pr-2">
                              <div className="flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-muted-foreground" />
                                  Dark Streak (High Stakes)
                              </div>
                          </AccordionTrigger>
                          <Controller
                              name="darkStreakEnabled"
                              control={form.control}
                              render={({ field }) => (
                                  <Switch
                                      id="dark-streak-switch"
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      onClick={(e) => e.stopPropagation()}
                                  />
                              )}
                          />
                      </div>
                    <AccordionContent className="pt-4 px-3 pb-3 space-y-3 bg-muted/20 rounded-b-md">
                      <p className="text-xs text-muted-foreground">Enable this for a high-stakes daily challenge. Missing a day incurs a heavy penalty and a dare.</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                <div className="pt-2">
                  <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                    {form.formState.isSubmitting ? "Saving..." : (editingTask ? 'Save Changes' : 'Add Task')}
                  </Button>
                </div>
              </form>

            <div>
              <h3 className="text-lg font-medium mb-4 text-primary">Existing Tasks</h3>
              {taskDefinitions.length === 0 ? (
                <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                  <p className="text-sm text-center text-muted-foreground">No tasks defined yet.</p>
                </div>
              ) : (
                <TooltipProvider>
                  <div className="space-y-3">
                    {taskDefinitions.map((task) => {
                      const isTimeBased = task.unit === 'minutes' || task.unit === 'hours';
                      return (
                      <div key={task.id} className={cn("p-3 border rounded-lg transition-all", editingTask?.id === task.id ? 'bg-muted border-primary/50' : 'bg-card-foreground/5')}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-10 rounded-sm flex-shrink-0" style={{ backgroundColor: task.color }} />
                            <div>
                                <p className="font-semibold">{task.name}</p>
                                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs mt-1">
                                <Tooltip><TooltipTrigger className="flex items-center gap-1"><CalendarCheck className="h-4 w-4" /><span>{getFrequencyLabel(task)}</span></TooltipTrigger><TooltipContent><p>Task Frequency</p></TooltipContent></Tooltip>

                                {task.darkStreakEnabled && (
                                    <Tooltip><TooltipTrigger><Zap className="h-4 w-4 text-yellow-400" /></TooltipTrigger><TooltipContent><p>Dark Streak Enabled</p></TooltipContent></Tooltip>
                                )}
                                {task.intensityThresholds && (
                                     <Tooltip><TooltipTrigger className="flex items-center gap-1"><Timer className="h-4 w-4" /><span>Phases ({getUnitLabel(task)})</span></TooltipTrigger><TooltipContent>
                                     <p>Custom Phases: {task.intensityThresholds.join(', ')}</p>
                                     </TooltipContent></Tooltip>
                                )}
                                </div>
                            </div>
                          </div>
                           <div className="flex items-center gap-1 flex-shrink-0">
                              {isTimeBased && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuickLogTaskId(quickLogTaskId === task.id ? null : task.id)}>
                                      <Clock className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Quick Log Time</p></TooltipContent>
                                </Tooltip>
                              )}
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
                                    <AlertDialogAction onClick={() => handleDeleteTask(task.id, task.name)} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                        </div>
                        {quickLogTaskId === task.id && (
                          <div className="mt-3 pt-3 border-t border-border/50 animate-fade-in-up">
                            <Label htmlFor={`quick-log-${task.id}`} className="text-xs text-muted-foreground mb-1">Log time for today ({task.unit})</Label>
                             <div className="flex gap-2">
                                <Input
                                  id={`quick-log-${task.id}`}
                                  type="number"
                                  placeholder={`e.g., ${task.unit === 'minutes' ? '30' : '1'}`}
                                  value={quickLogValue}
                                  onChange={(e) => setQuickLogValue(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && handleQuickLog(task)}
                                />
                                <Button size="icon" onClick={() => handleQuickLog(task)}>
                                  <Check className="h-4 w-4" />
                                </Button>
                              </div>
                          </div>
                        )}
                      </div>
                    )})}
                  </div>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="w-full">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageTasksModal;
