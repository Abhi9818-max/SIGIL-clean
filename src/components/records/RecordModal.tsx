
"use client";

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from 'date-fns';
import type { RecordEntry } from '@/types';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useToast } from "@/hooks/use-toast";

const recordSchema = z.object({
  date: z.date({ required_error: "Date is required." }),
  value: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number({ invalid_type_error: "Record value must be a number." }).min(0, "Record value must be non-negative.")
  ),
  taskType: z.string().optional(),
  notes: z.string().optional(),
});

type RecordFormData = z.infer<typeof recordSchema>;

interface RecordModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedDate: string | null; // YYYY-MM-DD
  defaultTaskTypeId?: string | null; // New prop for pre-selecting task type based on filter
}

const RecordModal: React.FC<RecordModalProps> = ({ 
  isOpen, 
  onOpenChange, 
  selectedDate, 
  defaultTaskTypeId 
}) => {
  const { 
    addRecord, 
    updateRecord, 
    deleteRecord, 
    getRecordByDate, 
    taskDefinitions
  } = useUserRecords();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const existingRecord = selectedDate ? getRecordByDate(selectedDate) : undefined;

  const form = useForm<RecordFormData>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      date: selectedDate ? parseISO(selectedDate) : new Date(),
      value: undefined,
      taskType: taskDefinitions[0]?.id || undefined, 
      notes: '',
    },
  });

  useEffect(() => {
    let taskToSet: string | undefined = taskDefinitions[0]?.id || undefined;

    if (selectedDate) {
      const record = getRecordByDate(selectedDate);
      const dateObj = parseISO(selectedDate);
      
      if (record) { // Existing record found for the date
        taskToSet = record.taskType ?? (defaultTaskTypeId ?? taskDefinitions[0]?.id);
      } else { // No existing record for the date, use filter or default
        taskToSet = defaultTaskTypeId ?? taskDefinitions[0]?.id;
      }

      form.reset({
        date: isValid(dateObj) ? dateObj : new Date(),
        value: record?.value ?? undefined,
        taskType: taskToSet,
        notes: record?.notes ?? '',
      });
    } else { // No selected date (likely "Add Record" from header)
      taskToSet = defaultTaskTypeId ?? taskDefinitions[0]?.id;
      form.reset({
        date: new Date(),
        value: undefined,
        taskType: taskToSet,
        notes: '',
      });
    }
  }, [selectedDate, isOpen, form, getRecordByDate, taskDefinitions, defaultTaskTypeId]);

  const onSubmit = (data: RecordFormData) => {
    const recordEntry: RecordEntry = {
      date: format(data.date, 'yyyy-MM-dd'),
      value: data.value,
      taskType: data.taskType,
      notes: data.notes,
    };

    if (existingRecord) {
      updateRecord(recordEntry);
      toast({ title: "Record Updated", description: `Record for ${recordEntry.date} updated successfully.` });
    } else {
      addRecord(recordEntry);
      toast({ title: "Record Added", description: `Record for ${recordEntry.date} added successfully.` });
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (selectedDate) {
      setIsDeleting(true);
      deleteRecord(selectedDate);
      toast({ title: "Record Deleted", description: `Record for ${selectedDate} deleted.`, variant: "destructive" });
      setIsDeleting(false);
      onOpenChange(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{existingRecord ? 'Edit Record' : 'Add Record'}</DialogTitle>
          <DialogDescription>
            {existingRecord ? `Editing record for ${selectedDate ? format(parseISO(selectedDate), 'MMMM d, yyyy') : ''}` : 'Add a new record for the selected date.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="date">Date</Label>
             <Controller
                name="date"
                control={form.control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            {form.formState.errors.date && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.date.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="value">Record Value</Label>
            <Input
              id="value"
              type="number"
              step="any"
              className="mt-1"
              {...form.register('value')}
              placeholder="e.g., hours, reps, quantity"
            />
            {form.formState.errors.value && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.value.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="taskType">Task Type</Label>
            <Controller
              name="taskType"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select a task type" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskDefinitions.length === 0 && <SelectItem value="" disabled>No tasks defined</SelectItem>}
                    {taskDefinitions.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.taskType && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.taskType.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              className="mt-1"
              {...form.register('notes')}
              placeholder="Add any relevant notes..."
            />
          </div>

          <DialogFooter className="sm:justify-between pt-2">
            {existingRecord ? (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            ) : <div />} 
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting || taskDefinitions.length === 0}>
                {form.formState.isSubmitting ? "Saving..." : (existingRecord ? 'Save Changes' : 'Add Record')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecordModal;
