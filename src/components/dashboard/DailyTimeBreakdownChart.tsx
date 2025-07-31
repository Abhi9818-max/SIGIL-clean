
"use client";

import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Clock, PlusCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Separator } from '../ui/separator';

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
    const { getDailyTimeBreakdown, taskDefinitions, addRecord } = useUserRecords();
    const data = getDailyTimeBreakdown();
    const { toast } = useToast();

    const [selectedQuickLogTask, setSelectedQuickLogTask] = useState<string>('');
    const [quickLogValue, setQuickLogValue] = useState<string>('');
    
    const timeBasedTasks = useMemo(() => {
        return taskDefinitions.filter(t => t.unit === 'minutes' || t.unit === 'hours');
    }, [taskDefinitions]);

    const handleQuickLog = () => {
        if (!selectedQuickLogTask || !quickLogValue) {
             toast({
                title: 'Missing Information',
                description: 'Please select a task and enter a value.',
                variant: 'destructive',
            });
            return;
        }

        const task = taskDefinitions.find(t => t.id === selectedQuickLogTask);
        if (!task) return;

        addRecord({
            date: format(new Date(), 'yyyy-MM-dd'),
            value: Number(quickLogValue),
            taskType: selectedQuickLogTask,
            notes: 'Logged via dashboard widget.'
        });

        toast({
            title: 'Time Logged!',
            description: `${quickLogValue} ${task.unit} logged for "${task.name}".`,
        });

        setQuickLogValue('');
        setSelectedQuickLogTask('');
    };

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
                        <p className="text-sm">Log your minutes or hours below.</p>
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
             {timeBasedTasks.length > 0 && (
                <>
                <Separator />
                <CardFooter className="pt-6">
                    <div className="w-full space-y-3">
                         <p className="text-sm font-medium text-muted-foreground">Quick Log Time</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                           <Select value={selectedQuickLogTask} onValueChange={setSelectedQuickLogTask}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a task..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {timeBasedTasks.map(task => (
                                        <SelectItem key={task.id} value={task.id}>
                                            {task.name} ({task.unit})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input 
                                type="number" 
                                placeholder="e.g., 30"
                                value={quickLogValue}
                                onChange={(e) => setQuickLogValue(e.target.value)}
                            />
                            <Button onClick={handleQuickLog} className="w-full sm:w-auto">
                                <PlusCircle className="mr-2 h-4 w-4" /> Log
                            </Button>
                        </div>
                    </div>
                </CardFooter>
                </>
             )}
        </Card>
    );
}

export default DailyTimeBreakdownChart;
