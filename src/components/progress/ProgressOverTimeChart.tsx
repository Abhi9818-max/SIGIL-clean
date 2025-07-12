
"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  // ChartLegend, // Legend not explicitly shown in the image for this chart, can be re-added if needed
  // ChartLegendContent,
  // ChartStyle, // Style is applied via ChartContainer
  type ChartConfig
} from "@/components/ui/chart";
import { LineChart, CartesianGrid, XAxis, YAxis, Line } from 'recharts';
import type { AggregatedTimeDataPoint } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface ProgressOverTimeChartProps {
  selectedTaskFilterId: string | null;
}

const ProgressOverTimeChart: React.FC<ProgressOverTimeChartProps> = ({ selectedTaskFilterId }) => {
  const { getWeeklyAggregatesForChart, getTaskDefinitionById, taskDefinitions } = useUserRecords();
  const [chartData, setChartData] = useState<AggregatedTimeDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const staticTitle = "Overall Progress (Last 12 Weeks)"; // Static title from image

  const defaultChartColor = "hsl(var(--primary))";

  useEffect(() => {
    setIsLoading(true);
    const data = getWeeklyAggregatesForChart(12, selectedTaskFilterId);
    setChartData(data);
    setIsLoading(false);
  }, [selectedTaskFilterId, getWeeklyAggregatesForChart]);

  const chartConfig = useMemo(() => {
    let color = defaultChartColor;
    let label = "Total Value"; // Default label if no specific task is selected or found

    if (selectedTaskFilterId) {
      const task = getTaskDefinitionById(selectedTaskFilterId);
      if (task) {
        color = task.color;
        label = task.name; // Use task name for legend/tooltip if a task is selected
      }
    }
    return {
      value: {
        label: label,
        color: color,
      },
    } satisfies ChartConfig;
  }, [selectedTaskFilterId, getTaskDefinitionById, defaultChartColor]);


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-accent" />
          <CardTitle>{staticTitle}</CardTitle>
        </div>
        <CardDescription>Weekly total record values.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] w-full">
            <Skeleton className="h-full w-full" />
          </div>
        ) : chartData.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">Not enough data to display chart.</p>
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
                name={chartConfig.value.label} // For tooltip to show correct label
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressOverTimeChart;
