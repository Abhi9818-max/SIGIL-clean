
"use client";

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Clock } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

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
    const { getDailyTimeBreakdown, taskDefinitions } = useUserRecords();
    const data = getDailyTimeBreakdown();
    
    if (taskDefinitions.filter(t => t.unit === 'minutes' || t.unit === 'hours').length === 0) {
        return (
             <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Clock className="h-6 w-6 text-accent" />
                        <CardTitle>Daily Time Breakdown</CardTitle>
                    </div>
                    <CardDescription>A 24-hour visualization of your time-based tasks.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-center text-muted-foreground">
                        <p>No time-based tasks (minutes/hours) defined.<br/>Please add one in "Manage Tasks" to use this chart.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

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
            </CardContent>
        </Card>
    );
}

export default DailyTimeBreakdownChart;
