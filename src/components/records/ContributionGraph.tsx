
"use client";

import React, { useEffect, useRef } from 'react';
import DaySquare from './DaySquare';
import type { DayData, MonthColumn } from '@/types';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { getMonthlyGraphData } from '@/lib/date-utils';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getMonth, parseISO, isFuture } from 'date-fns';

interface ContributionGraphProps {
  onDayClick: (date: string) => void;
  selectedTaskFilterId: string | null;
}

const ContributionGraph: React.FC<ContributionGraphProps> = ({ onDayClick, selectedTaskFilterId }) => {
  const { records, taskDefinitions } = useUserRecords();
  const [clientToday, setClientToday] = React.useState<Date | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null); 
  const monthColumnRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    setClientToday(new Date()); 
  }, []);

  const monthlyGraphData: MonthColumn[] = React.useMemo(() => {
    if (!clientToday || taskDefinitions.length === 0) return [];
    return getMonthlyGraphData(records, taskDefinitions, selectedTaskFilterId, clientToday); 
  }, [records, taskDefinitions, clientToday, selectedTaskFilterId]);

  useEffect(() => {
    if (clientToday && monthlyGraphData.length > 0) {
      const currentMonthIndex = getMonth(clientToday); 
      const targetMonthEl = monthColumnRefs.current.get(currentMonthIndex);

      if (targetMonthEl && scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            const scrollAreaWidth = viewport.clientWidth;
            const targetScrollLeft = targetMonthEl.offsetLeft - (scrollAreaWidth / 2) + (targetMonthEl.offsetWidth / 2);
            
            setTimeout(() => {
              viewport.scrollTo({
                  left: targetScrollLeft,
                  behavior: 'smooth' 
              });
            }, 100);
        }
      }
    }
  }, [monthlyGraphData, clientToday]); 

  if (!clientToday || (monthlyGraphData.length === 0 && taskDefinitions.length > 0)) {
    return <div className="p-4 text-center text-muted-foreground">Loading graph data...</div>;
  }
  if (taskDefinitions.length === 0) {
      return <div className="p-4 text-center text-muted-foreground">Please define tasks in 'Manage Tasks' to see the graph.</div>;
  }

  return (
    <div className="p-4 rounded-lg shadow-md bg-card">
      <div className="flex gap-3">
        <ScrollArea className="w-full whitespace-nowrap" ref={scrollAreaRef}>
          <div className="flex gap-x-4"> 
            {monthlyGraphData.map((monthCol, monthIdx) => (
              <div
                key={monthCol.monthLabel}
                className="flex flex-col items-center flex-shrink-0"
                ref={el => {
                  if (el) {
                    monthColumnRefs.current.set(monthIdx, el);
                  } else {
                    monthColumnRefs.current.delete(monthIdx);
                  }
                }}>
                <div className="text-xs font-medium mb-1 text-center h-5 flex items-center">{monthCol.monthLabel}</div>
                <div className="grid grid-cols-7 grid-rows-6 gap-1"> 
                  {monthCol.weeks.map((week, weekIdx) =>
                    week.map((day, dayInWeekIdx) => {
                      const key = day.isPlaceholder
                        ? `ph-${monthCol.monthLabel}-${weekIdx}-${dayInWeekIdx}`
                        : day.date;
                      return day.isPlaceholder ? (
                        <div key={key} className="w-6 h-6 rounded-sm" />
                      ) : (
                        <div key={key} className="w-6 h-6">
                          <DaySquare 
                            day={day as DayData} 
                            onClick={() => {
                              // Prevent opening modal for future dates
                              const clickedDate = parseISO(day.date);
                              if (!isFuture(clickedDate) || isFuture(new Date(day.date))) {
                                onDayClick(day.date);
                              }
                            }} 
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
};

export default ContributionGraph;
