
"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart as PieChartIcon, Target } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart";
import { PieChart, Pie, Cell } from 'recharts';
import type { TaskDistributionData } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface TaskDistributionChartProps {
  startDate: Date;
  endDate: Date;
  taskId: string | null;
}

const TaskDistributionChart: React.FC<TaskDistributionChartProps> = ({ startDate, endDate, taskId }) => {
  const { getTaskDistribution, taskDefinitions } = useUserRecords();
  const [chartData, setChartData] = useState<TaskDistributionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const data = getTaskDistribution(startDate, endDate, taskId);
    setChartData(data);
    setIsLoading(false);
  }, [startDate, endDate, taskId, getTaskDistribution]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    if (chartData.length > 0) {
      chartData.forEach(item => {
        config[item.name] = {
          label: item.name,
          color: item.fill,
        };
      });
    } else { // Fallback for empty state
        taskDefinitions.forEach(task => {
            config[task.name] = {
                label: task.name,
                color: task.color
            }
        })
    }
    return config;
  }, [chartData, taskDefinitions]);

  const SingleTaskView = () => {
    const task = taskDefinitions.find(t => t.id === taskId);
    const totalValue = chartData.length > 0 ? chartData[0].value : 0;
    if (!task) return null;

    return (
        <div className="h-[250px] flex flex-col items-center justify-center text-center">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold" style={{color: task.color}}>{task.name}</h3>
            <p className="text-3xl font-bold">{totalValue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total recorded value in selected period.</p>
        </div>
    );
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <PieChartIcon className="h-6 w-6 text-accent" />
          <CardTitle>Task Distribution</CardTitle>
        </div>
        <CardDescription>How your total effort is distributed across tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] w-full">
            <Skeleton className="h-full w-full" />
          </div>
        ) : taskId ? (
          <SingleTaskView />
        ) : chartData.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 h-[250px] flex items-center justify-center">
            No data to display for this period.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
              >
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                className="-translate-y-[2rem] flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskDistributionChart;
