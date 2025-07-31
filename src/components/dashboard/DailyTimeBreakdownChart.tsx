
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { Clock, PlusCircle, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Separator } from '../ui/separator';
import type { TaskUnit, RecordEntry } from '@/types';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import type { DailyTimeBreakdownData } from '@/types';
import { ScrollArea } from '../ui/scroll-area';

interface DailyTimeBreakdownChartProps {
  date?: Date;
  hideFooter?: boolean;
}

const DailyTimeBreakdownChart: React.FC<DailyTimeBreakdownChartProps> = ({ date, hideFooter = false }) => {
    const { getDailyTimeBreakdown, taskDefinitions, addRecord, addTaskDefinition, getTaskDefinitionById, getRecordsByDate, deleteRecord } = useUserRecords();
    const { dashboardSettings } = useSettings();
    const data = useMemo(() => getDailyTimeBreakdown(date), [getDailyTimeBreakdown, date]);
    const { toast } = useToast();

    const [showQuickLogForm, setShowQuickLogForm] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');
    const [unit, setUnit] = useState<TaskUnit>('minutes');
    const [quickLogValue, setQuickLogValue] = useState<string>('');
    
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
    
    const handleDeleteRecord = (id: string) => {
        deleteRecord(id);
        toast({
            title: "Record Deleted",
            description: "The time entry has been removed.",
            variant: "destructive"
        });
    };

    const chartTitle = date ? `Time Breakdown for ${format(date, 'MMM d, yyyy')}` : 'Daily Time Breakdown';
    const chartDescription = date ? `A visualization of your time-based tasks for this day.` : `A 24-hour visualization of your time-based tasks for today.`

    const pieData = useMemo(() => {
        const totalMinutes = data.reduce((sum, item) => item.name !== 'Unallocated' ? sum + item.value : sum, 0);
        return data.map(item => ({
            ...item,
            // Calculate percentage only based on logged time
            percentage: totalMinutes > 0 ? (item.value / totalMinutes) : 0,
        }));
    }, [data]);
    
    const renderCustomizedLabel = useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, payload, name }: any) => {
      const RADIAN = Math.PI / 180;
      // Increased stagger and adjusted logic
      const yStagger = (index % 4) * 15; 
      const radius = innerRadius + (outerRadius - innerRadius) * 1.25 + yStagger; 
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
      const sin = Math.sin(-RADIAN * midAngle);
      const cos = Math.cos(-RADIAN * midAngle);
      const sx = cx + (outerRadius + 5) * cos;
      const sy = cy + (outerRadius + 5) * sin;
      const mx = cx + (outerRadius + 15) * cos;
      const my = cy + (outerRadius + 15) * sin + yStagger;
      const ex = mx + (cos >= 0 ? 1 : -1) * 12;
      const ey = my;
      const textAnchor = cos >= 0 ? 'start' : 'end';
    
      if (payload.name === 'Unallocated' || percent === 0) return null;
      
      const labelValue = dashboardSettings.pieChartLabelFormat === 'time'
        ? `${Math.floor(payload.value / 60)}h ${payload.value % 60}m`
        : `${(percent * 100).toFixed(0)}%`;

    
      return (
        <g>
           <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={payload.fill} fill="none" />
           <circle cx={ex} cy={ey} r={2} fill={payload.fill} stroke="none" />
           <text x={ex + (cos >= 0 ? 1 : -1) * 6} y={ey} dy={4} textAnchor={textAnchor} fill="hsl(var(--foreground))" className="text-xs">
               {`${name} (${labelValue})`}
           </text>
        </g>
      );
    }, [dashboardSettings.pieChartLabelFormat]);

    const dailyRecords = getRecordsByDate(format(date || new Date(), 'yyyy-MM-dd'));
    const timeBasedRecords = dailyRecords.filter(rec => {
        if (!rec.taskType) return false;
        const task = getTaskDefinitionById(rec.taskType);
        return task && (task.unit === 'minutes' || task.unit === 'hours');
    });

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
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                strokeWidth={2}
                                stroke="hsl(var(--background))"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
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
                                {timeBasedRecords.length > 0 && (
                                    <div className="space-y-2 pt-2">
                                        <h4 className="text-xs font-semibold text-muted-foreground">LOGGED TODAY:</h4>
                                        <ScrollArea className="h-24 pr-2">
                                            <div className="space-y-1">
                                                {timeBasedRecords.map(rec => {
                                                    const task = getTaskDefinitionById(rec.taskType!);
                                                    return (
                                                        <div key={rec.id} className="flex items-center justify-between text-xs p-1 rounded-md hover:bg-muted/50">
                                                            <span>{task?.name}: <span className="font-bold">{rec.value}</span> {task?.unit}</span>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteRecord(rec.id)}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardFooter>
                </>
            )}
        </Card>
    );
}

export default DailyTimeBreakdownChart;

    