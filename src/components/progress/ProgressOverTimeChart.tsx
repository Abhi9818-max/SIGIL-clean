
"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { LineChart, CartesianGrid, XAxis, YAxis, Line } from 'recharts';
import type { AggregatedTimeDataPoint } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface ProgressOverTimeChartProps {
  selectedTaskFilterId: string | null;
}

const ProgressOverTimeChart: React.FC<ProgressOverTimeChartProps> = ({ selectedTaskFilterId }) => {
  const { getWeeklyAggregatesForChart, getTaskDefinitionById } = useUserRecords();
  const [chartData, setChartData] = useState<AggregatedTimeDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const task = selectedTaskFilterId ? getTaskDefinitionById(selectedTaskFilterId) : null;
  const chartTitle = task ? `${task.name} Progress` : "Overall Progress";
  const defaultChartColor = "hsl(var(--primary))";

  useEffect(() => {
    setIsLoading(true);
    const data = getWeeklyAggregatesForChart(12, selectedTaskFilterId);
    setChartData(data);
    setIsLoading(false);
  }, [selectedTaskFilterId, getWeeklyAggregatesForChart]);

  const chartConfig = useMemo(() => {
    let color = defaultChartColor;
    let label = "Total Value"; 

    if (task) {
      color = task.color;
      label = task.name;
    }
    return {
      value: {
        label: label,
        color: color,
      },
    } satisfies ChartConfig;
  }, [task, defaultChartColor]);


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-accent" />
          <CardTitle>{chartTitle}</CardTitle>
        </div>
        <CardDescription>Total weekly values over the last 12 weeks.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] w-full">
            <Skeleton className="h-full w-full" />
          </div>
        ) : chartData.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 h-[250px] flex items-center justify-center">Not enough data to display chart.</p>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
                top: 5,
                bottom: 5,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
                width={30}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Line
                dataKey="value"
                type="monotone"
                stroke={`var(--color-value)`}
                strokeWidth={2}
                dot={true}
                name={chartConfig.value.label}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressOverTimeChart;
