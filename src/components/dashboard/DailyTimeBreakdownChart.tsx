

"use client";

import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { Clock, PlusCircle, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Separator } from '../ui/separator';
import type { TaskUnit } from '@/types';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import type { DailyTimeBreakdownData } from '@/types';

interface DailyTimeBreakdownChartProps {
  date?: Date;
  hideFooter?: boolean;
}

const CustomTooltip = ({ active, payload, settings }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const totalMinutes = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      const percentage = totalMinutes > 0 ? (data.value / totalMinutes) * 100 : 0;
  
      let displayValue;
      if (settings.pieChartLabelFormat === 'time') {
          const hours = Math.floor(data.value / 60);
          const minutes = data.value % 60;
          displayValue = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      } else {
          displayValue = `${percentage.toFixed(0)}%`;
      }
  
      return (
        <div className="rounded-lg border bg-background p-2.5 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <p className="text-sm font-medium text-foreground">{data.name}: <span className="font-bold">{displayValue}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

const DailyTimeBreakdownChart: React.FC<DailyTimeBreakdownChartProps> = ({ date, hideFooter = false }) => {
    const { getDailyTimeBreakdown, taskDefinitions, addRecord, addTaskDefinition } = useUserRecords();
    const { dashboardSettings } = useSettings();
    const data = useMemo(() => getDailyTimeBreakdown(date), [getDailyTimeBreakdown, date]);
    const { toast } = useToast();

    const [showQuickLogForm, setShowQuickLogForm] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');
    const [unit, setUnit] = useState<TaskUnit>('minutes');
    const [quickLogValue, setQuickLogValue] = useState<string>('');
    
    const totalLoggedMinutes = useMemo(() => {
        return data.reduce((sum, entry) => {
            return entry.name !== 'Unallocated' ? sum + entry.value : sum;
        }, 0);
    }, [data]);

    const handleQuickLog = () => {
        if (!newTaskName.trim() || !quickLogValue) {
             toast({
                title: 'Missing Information',
                description: 'Please enter a task name and a value.',
                variant: 'destructive',
            });
            return;
        }

        let task = taskDefinitions.find(t => t.name.toLowerCase() === newTaskName.trim().toLowerCase() && (t.unit === 'minutes' || t.unit === 'hours'));
        let taskId = task?.id;

        if (!task) {
            // Create a new task if it doesn't exist
            const newTaskId = addTaskDefinition({
                name: newTaskName.trim(),
                color: `hsl(${Math.random() * 360}, 70%, 70%)`, // Random color
                unit: unit,
            });
            taskId = newTaskId;
            toast({
                title: 'Task Created!',
                description: `New task "${newTaskName.trim()}" was created.`,
            });
        }
        
        if (!taskId) return;
        
        const taskDef = getTaskDefinitionById(taskId);

        addRecord({
            date: format(date || new Date(), 'yyyy-MM-dd'),
            value: Number(quickLogValue),
            taskType: taskId,
            notes: 'Logged via dashboard widget.'
        });

        toast({
            title: 'Time Logged!',
            description: `${quickLogValue} ${taskDef?.unit || unit} logged for "${newTaskName.trim()}".`,
        });

        setNewTaskName('');
        setQuickLogValue('');
    };

    const getTaskDefinitionById = (id: string) => taskDefinitions.find(t => t.id === id);
    
    const timeBasedTasksExist = useMemo(() => {
        return taskDefinitions.some(t => t.unit === 'minutes' || t.unit === 'hours');
    }, [taskDefinitions]);

    const chartTitle = date ? `Time Breakdown for ${format(date, 'MMM d, yyyy')}` : 'Daily Time Breakdown';
    const chartDescription = date ? `A visualization of your time-based tasks for this day.` : `A 24-hour visualization of your time-based tasks for today.`

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Clock className="h-6 w-6 text-accent" />
                    <CardTitle>{chartTitle}</CardTitle>
                </div>
                <CardDescription>{chartDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                             <Tooltip content={<CustomTooltip settings={dashboardSettings} />} />
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                strokeWidth={2}
                                stroke="hsl(var(--background))"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-foreground">
                            {`${Math.floor(totalLoggedMinutes / 60)}h ${totalLoggedMinutes % 60}m`}
                        </span>
                        <span className="text-xs text-muted-foreground">Logged Today</span>
                    </div>
                </div>
            </CardContent>
            {!hideFooter && (
                <>
                    <Separator />
                    <CardFooter className="pt-4 flex-col items-start gap-4">
                        <button 
                          className="w-full flex justify-between items-center p-2 rounded-md hover:bg-muted/50 transition-colors"
                          onClick={() => setShowQuickLogForm(!showQuickLogForm)}
                          aria-expanded={showQuickLogForm}
                        >
                            <p className="text-sm font-medium text-muted-foreground">Quick Log Time</p>
                            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showQuickLogForm && "rotate-180")} />
                        </button>
                        {showQuickLogForm && (
                            <div className="w-full space-y-3 animate-fade-in-up">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                     <div>
                                        <Label htmlFor="quick-task-name" className="sr-only">Task Name</Label>
                                        <Input 
                                            id="quick-task-name"
                                            placeholder="Task Name"
                                            value={newTaskName}
                                            onChange={(e) => setNewTaskName(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Select value={unit} onValueChange={(value: TaskUnit) => setUnit(value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="minutes">Minutes</SelectItem>
                                                <SelectItem value="hours">Hours</SelectItem>
                                            </SelectContent>
                                        </Select>
                                         <Input 
                                            type="number" 
                                            placeholder="e.g., 30"
                                            value={quickLogValue}
                                            onChange={(e) => setQuickLogValue(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleQuickLog} className="w-full">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Log Time
                                </Button>
                            </div>
                        )}
                    </CardFooter>
                </>
            )}
        </Card>
    );
}

export default DailyTimeBreakdownChart;

    