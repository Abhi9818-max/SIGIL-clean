
"use client";

import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
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

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';

    const lineRadiusStart = outerRadius + 5;
    const xLineStart = cx + lineRadiusStart * Math.cos(-midAngle * RADIAN);
    const yLineStart = cy + lineRadiusStart * Math.sin(-midAngle * RADIAN);

    const lineRadiusEnd = outerRadius + 20;
    const xLineEnd = cx + lineRadiusEnd * Math.cos(-midAngle * RADIAN);
    const yLineEnd = cy + lineRadiusEnd * Math.sin(-midAngle * RADIAN);
    
    const xText = xLineEnd + (x > cx ? 1 : -1) * 5;

    return (
        <g>
            <path d={`M${xLineStart},${yLineStart} L${xLineEnd},${yLineEnd} L${xText},${yLineEnd}`} stroke="var(--color-label)" fill="none" />
            <circle cx={xLineStart} cy={yLineStart} r={2} fill="var(--color-label)" stroke="none" />
            <text x={xText} y={yLineEnd} textAnchor={textAnchor} fill="var(--color-text)" dy={-4} className="text-sm font-semibold">{`${(percent * 100).toFixed(0)}%`}</text>
            <text x={xText} y={yLineEnd} textAnchor={textAnchor} fill="var(--color-text-muted)" dy={10} className="text-xs">{name}</text>
        </g>
    );
};


const DailyTimeBreakdownChart = () => {
    const { getDailyTimeBreakdown, taskDefinitions, addRecord, addTaskDefinition } = useUserRecords();
    const data = getDailyTimeBreakdown();
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

        addRecord({
            date: format(new Date(), 'yyyy-MM-dd'),
            value: Number(quickLogValue),
            taskType: taskId,
            notes: 'Logged via dashboard widget.'
        });

        toast({
            title: 'Time Logged!',
            description: `${quickLogValue} ${task?.unit || unit} logged for "${newTaskName.trim()}".`,
        });

        setNewTaskName('');
        setQuickLogValue('');
    };
    
    const timeBasedTasksExist = useMemo(() => {
        return taskDefinitions.some(t => t.unit === 'minutes' || t.unit === 'hours');
    }, [taskDefinitions]);


    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Clock className="h-6 w-6 text-accent" />
                    <CardTitle>Daily Time Breakdown</CardTitle>
                </div>
                <CardDescription>A 24-hour visualization of your time-based tasks for today.</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 1 && data[0].name === 'Unallocated' ? (
                     <div className="h-[300px] flex flex-col items-center justify-center text-center text-muted-foreground">
                        <p>No time-based tasks logged for today.</p>
                         {!timeBasedTasksExist && <p className="text-sm">Please add a time-based task in "Manage Tasks" to use this chart.</p>}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart style={{
                            '--color-label': 'hsl(var(--muted-foreground))',
                            '--color-text': 'hsl(var(--foreground))',
                            '--color-text-muted': 'hsl(var(--muted-foreground))'
                            } as React.CSSProperties}>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                strokeWidth={2}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
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
        </Card>
    );
}

export default DailyTimeBreakdownChart;
