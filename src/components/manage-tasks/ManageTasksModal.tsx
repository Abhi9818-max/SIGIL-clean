
"use client";

import React, { useState, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Pencil, Trash2, Info, Target } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import type { TaskDefinition } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { VALUE_THRESHOLDS } from '@/lib/config'; 

const taskFormSchema = z.object({
  name: z.string().min(1, "Task name is required.").max(50, "Task name must be 50 characters or less."),
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
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface ManageTasksModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const ManageTasksModal: React.FC<ManageTasksModalProps> = ({ isOpen, onOpenChange }) => {
  const { taskDefinitions, addTaskDefinition, updateTaskDefinition, deleteTaskDefinition } = useUserRecords();
  const { toast } = useToast();
  const [editingTask, setEditingTask] = useState<TaskDefinition | null>(null);

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
    });
  };

  useEffect(() => {
    if (isOpen) { 
      resetFormFields(editingTask);
    }
  }, [editingTask, isOpen]);

  const handleAddNewTask = () => {
    setEditingTask(null);
    resetFormFields(null);
  };
  
  const handleEditTask = (task: TaskDefinition) => {
    setEditingTask(task);
    resetFormFields(task);
  };

  const onSubmit = (data: TaskFormData) => {
    let intensityThresholds: number[] | undefined = undefined;
    const th = [data.threshold1, data.threshold2, data.threshold3, data.threshold4];
    const providedThresholds = th.filter(t => t !== undefined) as number[];

    if (providedThresholds.length === 4) {
      if (providedThresholds.every(t => t > 0) &&
          providedThresholds[0] < providedThresholds[1] &&
          providedThresholds[1] < providedThresholds[2] &&
          providedThresholds[2] < providedThresholds[3]) {
        intensityThresholds = providedThresholds;
      } else {
        form.setError("threshold1", { type: "manual", message: "All 4 phases must be positive and in increasing order." });
        toast({ title: "Validation Error", description: "Custom phases must be 4 positive, increasing numbers.", variant: "destructive" });
        return;
      }
    } else if (providedThresholds.length > 0 && providedThresholds.length < 4) {
      form.setError("threshold1", { type: "manual", message: "Either fill all 4 phases or leave all blank for global defaults." });
      toast({ title: "Validation Error", description: "Fill all 4 phases or leave all blank.", variant: "destructive" });
      return;
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
    };

    if (editingTask) {
      updateTaskDefinition({ ...editingTask, ...taskData });
      toast({ title: "Task Updated", description: `Task "${data.name}" updated successfully.` });
    } else {
      addTaskDefinition(taskData);
      toast({ title: "Task Added", description: `Task "${data.name}" added successfully.` });
    }
    setEditingTask(null);
    resetFormFields(null);
  };

  const handleDeleteTask = (taskId: string, taskName: string) => {
    deleteTaskDefinition(taskId);
    toast({ title: "Task Deleted", description: `Task "${taskName}" deleted.`, variant: "destructive" });
    if (editingTask?.id === taskId) {
      setEditingTask(null);
      resetFormFields(null);
    }
  };
  
  const watchGoalValue = form.watch('goalValue');

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setEditingTask(null); 
        resetFormFields(null);
      }
    }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Tasks</DialogTitle>
          <DialogDescription>Add, edit, or delete your task types, their display properties, and goals.</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="my-4">
            <h3 className="text-lg font-medium mb-2">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h3>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="taskName">Task Name</Label>
                <Input id="taskName" {...form.register('name')} className="mt-1" />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="taskColor">Task Color (Hex or HSL)</Label>
                <Controller
                  name="color"
                  control={form.control}
                  render={({ field }) => (
                    <div className="flex items-center mt-1">
                      <Input 
                        id="taskColor" 
                        type="color" 
                        value={field.value.startsWith('hsl') ? '#000000' : field.value} 
                        onChange={(e) => field.onChange(e.target.value)} 
                        className="w-16 h-10 p-1" 
                      />
                      <Input 
                        type="text"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="hsl(H, S%, L%) or #RRGGBB"
                        className="ml-2 flex-grow"
                      />
                    </div>
                  )}
                />
                {form.formState.errors.color && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.color.message}</p>
                )}
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-sm py-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      Goals & Bonuses (Optional)
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                      <div className="md:col-span-1">
                        <Label htmlFor="goalValue">Task Goal</Label>
                        <div className="flex items-center mt-1">
                          <Input id="goalValue" type="number" {...form.register('goalValue')} className="flex-grow"/>
                        </div>
                        {form.formState.errors.goalValue && (
                          <p className="text-sm text-destructive mt-1">{form.formState.errors.goalValue.message}</p>
                        )}
                      </div>
                      <div className="md:col-span-1">
                        <Label htmlFor="goalInterval">Goal Interval</Label>
                        <Controller
                            name="goalInterval"
                            control={form.control}
                            render={({ field }) => (
                                <div className="flex items-center mt-1">
                                    <Select 
                                        onValueChange={field.onChange} 
                                        value={field.value ?? ""} 
                                        disabled={!watchGoalValue || Number(watchGoalValue) <= 0}
                                    >
                                        <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Interval" />
                                        </SelectTrigger>
                                        <SelectContent>
                                        <SelectItem value="none">No Interval</SelectItem>
                                        <SelectItem value="daily">Per Day</SelectItem>
                                        <SelectItem value="weekly">Per Week</SelectItem>
                                        <SelectItem value="monthly">Per Month</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            />
                        {form.formState.errors.goalInterval && (
                          <p className="text-sm text-destructive mt-1">{form.formState.errors.goalInterval.message}</p>
                        )}
                      </div>
                      <div className="md:col-span-1">
                        <Label htmlFor="goalCompletionBonusPercentage">Bonus (%)</Label>
                        <div className="flex items-center mt-1">
                            <Input id="goalCompletionBonusPercentage" type="number" {...form.register('goalCompletionBonusPercentage')} className="flex-grow" disabled={!watchGoalValue || Number(watchGoalValue) <= 0}/>
                        </div>
                        {form.formState.errors.goalCompletionBonusPercentage && (
                          <p className="text-sm text-destructive mt-1">{form.formState.errors.goalCompletionBonusPercentage.message}</p>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-sm py-2">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      Custom Intensity Phases (Optional)
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Define 4 record values to set different shades for this task. Higher values mean darker shades.
                      Leave all blank to use global defaults (currently: {VALUE_THRESHOLDS.join(', ')}).
                      Phases must be positive and in increasing order (e.g., 5, 10, 15, 20).
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i}>
                          <Label htmlFor={`threshold${i}`}>Phase {i}</Label>
                          <Input id={`threshold${i}`} type="number" {...form.register(`threshold${i}` as keyof TaskFormData)} className="mt-1"/>
                          {form.formState.errors[`threshold${i}` as keyof TaskFormData] && (
                            <p className="text-sm text-destructive mt-1">{form.formState.errors[`threshold${i}` as keyof TaskFormData]?.message}</p>
                          )}
                        </div>
                      ))}
                    </div>
                       {(form.formState.errors.threshold1 && form.formState.errors.threshold1.type === 'manual') && (
                           <p className="text-sm text-destructive mt-1">{form.formState.errors.threshold1.message}</p>
                      )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <div className="flex justify-end gap-2 pt-2">
                {editingTask && (
                  <Button type="button" variant="outline" onClick={handleAddNewTask}>
                    Cancel Edit
                  </Button>
                )}
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : (editingTask ? 'Save Changes' : 'Add Task')}
                </Button>
              </div>
            </form>
          </div>

          <Separator className="my-4" />
          
          <div>
            <h3 className="text-lg font-medium mb-2">Existing Tasks</h3>
            {taskDefinitions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks defined yet.</p>
            ) : (
                <ul className="space-y-2">
                  {taskDefinitions.map((task) => (
                    <li key={task.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-sm border" 
                          style={{ backgroundColor: task.color }} 
                          title={`Color: ${task.color}`}
                        />
                        <span className="text-sm">{task.name}</span>
                        {task.goalValue && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (Goal: {task.goalValue}
                            {task.goalInterval ? ` / ${task.goalInterval.charAt(0).toUpperCase() + task.goalInterval.slice(1).replace('ly', '')}` : ''}
                            {task.goalCompletionBonusPercentage ? `, ${task.goalCompletionBonusPercentage}% Bonus` : ''})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditTask(task)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit {task.name}</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete {task.name}</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the task "{task.name}"
                                and remove it from any existing records.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteTask(task.id, task.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </li>
                  ))}
                </ul>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4 flex-shrink-0">
          <DialogClose asChild>
            <Button type="button" variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageTasksModal;
