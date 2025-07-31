
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BarChart } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import type { UserData, TaskDefinition } from '@/types';
import { startOfYear, endOfYear, parseISO } from 'date-fns';

interface TaskComparisonChartProps {
    friendData: UserData;
}

const TaskComparisonChart: React.FC<TaskComparisonChartProps> = ({ friendData }) => {
    const { userData } = useAuth();
    const { taskDefinitions: currentUserTasks } = useUserRecords();

    const comparisonData = useMemo(() => {
        const friendTasks = friendData.taskDefinitions || [];
        const currentUserRecords = userData?.records || [];
        const friendRecords = friendData.records || [];

        const allTaskIds = new Set([...currentUserTasks.map(t => t.id), ...friendTasks.map(t => t.id)]);
        
        const data = Array.from(allTaskIds).map(taskId => {
            const task = currentUserTasks.find(t => t.id === taskId) || friendTasks.find(t => t.id === taskId);
            if (!task) return null;

            const currentUserTotal = currentUserRecords
                .filter(r => r.taskType === taskId)
                .reduce((sum, r) => sum + r.value, 0);
            
            const friendUserTotal = friendRecords
                .filter(r => r.taskType === taskId)
                .reduce((sum, r) => sum + r.value, 0);

            return {
                task: task.name,
                [userData?.username || 'You']: currentUserTotal,
                [friendData.username]: friendUserTotal,
            };
        }).filter(Boolean);

        return data as { task: string; [key: string]: number | string; }[];
    }, [friendData, userData, currentUserTasks]);

    if (!comparisonData || comparisonData.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <BarChart className="h-6 w-6 text-primary" />
                        <CardTitle>Task Comparison</CardTitle>
                    </div>
                    <CardDescription>A comparison of total effort across all shared tasks.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No shared tasks with data to compare.
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    const maxVal = Math.max(
      ...comparisonData.map(d => d[userData?.username || 'You']),
      ...comparisonData.map(d => d[friendData.username])
    );
    const friendColor = "hsl(var(--destructive))";
    const userColor = "hsl(var(--primary))";

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <BarChart className="h-6 w-6 text-primary" />
                    <CardTitle>Task Comparison</CardTitle>
                </div>
                <CardDescription>A comparison of total effort across all shared tasks.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={comparisonData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="task" />
                        <PolarRadiusAxis angle={30} domain={[0, maxVal > 0 ? 'auto' : 100]} />
                        <Radar 
                          name={userData?.username || 'You'} 
                          dataKey={userData?.username || 'You'} 
                          stroke={userColor} 
                          fill={userColor} 
                          fillOpacity={0.6} 
                        />
                        <Radar 
                          name={friendData.username} 
                          dataKey={friendData.username} 
                          stroke={friendColor} 
                          fill={friendColor} 
                          fillOpacity={0.6}
                        />
                        <Legend />
                    </RadarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default TaskComparisonChart;
