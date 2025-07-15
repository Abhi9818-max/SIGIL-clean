
"use client";

import React, { useEffect, useRef } from 'react';
import DaySquare from './DaySquare';
import type { DayData, MonthColumn } from '@/types';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { getMonthlyGraphData } from '@/lib/date-utils';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getMonth, parseISO, isFuture, format } from 'date-fns';

interface ContributionGraphProps {
  onDayClick: (date: string) => void;
  selectedTaskFilterId: string | null;
  displayMode?: 'full' | 'current_month';
}

const ContributionGraph: React.FC<ContributionGraphProps> = ({ 
  onDayClick, 
  selectedTaskFilterId,
  displayMode = 'current_month'
}) => {
  const { records, taskDefinitions } = useUserRecords();
  const [clientToday, setClientToday] = React.useState<Date | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null); 
  const monthColumnRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    setClientToday(new Date()); 
  }, []);

  const monthlyGraphData: MonthColumn[] = React.useMemo(() => {
    if (!clientToday || taskDefinitions.length === 0) return [];
    return getMonthlyGraphData(records, taskDefinitions, selectedTaskFilterId, clientToday, displayMode); 
  }, [records, taskDefinitions, clientToday, selectedTaskFilterId, displayMode]);

  useEffect(() => {
    if (clientToday && monthlyGraphData.length > 0 && displayMode === 'full') {
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
  }, [monthlyGraphData, clientToday, displayMode]); 

  if (!clientToday || (monthlyGraphData.length === 0 && taskDefinitions.length > 0)) {
    return <div className="p-4 text-center text-muted-foreground">Loading graph data...</div>;
  }
  if (taskDefinitions.length === 0) {
      return <div className="p-4 text-center text-muted-foreground">Please define tasks in 'Manage Tasks' to see the graph.</div>;
  }

  const firstMonthData = monthlyGraphData[0];

  return (
    <div className="p-4 rounded-lg shadow-md bg-card">
      <div className="flex gap-3">
        {displayMode === 'current_month' && firstMonthData ? (
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="text-sm font-medium mb-2 text-center h-5 flex items-center">{firstMonthData.monthLabel}</div>
            <div className="grid grid-cols-7 grid-rows-6 gap-1.5 sm:gap-1">
              {firstMonthData.weeks.flat().map((day, dayIdx) => (
                 day.isPlaceholder ? (
                    <div key={`ph-${dayIdx}`} className="w-8 h-8 sm:w-8 sm:h-8 rounded-sm" />
                  ) : (
                    <div key={day.date} className="w-8 h-8 sm:w-8 sm:h-8">
                      <DaySquare 
                        day={day as DayData} 
                        onClick={() => {
                          const clickedDate = parseISO(day.date);
                          if (!isFuture(clickedDate) || format(clickedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
                            onDayClick(day.date);
                          }
                        }} 
                      />
                    </div>
                  )
              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="w-full whitespace-nowrap" ref={scrollAreaRef}>
            <div className="flex gap-x-5 sm:gap-x-8">
              {monthlyGraphData.map((monthCol) => (
                <div
                  key={monthCol.monthLabel}
                  className="flex flex-col items-center flex-shrink-0"
                  ref={el => {
                    if (el) monthColumnRefs.current.set(monthCol.month, el);
                    else monthColumnRefs.current.delete(monthCol.month);
                  }}>
                  <div className="text-sm font-medium mb-2 text-center h-5 flex items-center">{monthCol.monthLabel}</div>
                  <div className="grid grid-cols-7 grid-rows-6 gap-1.5 sm:gap-1"> 
                    {monthCol.weeks.flat().map((day, dayIdx) => (
                      day.isPlaceholder ? (
                        <div key={`ph-${day.date}-${dayIdx}`} className="w-8 h-8 sm:w-8 sm:h-8 rounded-sm" />
                      ) : (
                        <div key={day.date} className="w-8 h-8 sm:w-8 sm:h-8">
                          <DaySquare 
                            day={day as DayData} 
                            onClick={() => {
                              const clickedDate = parseISO(day.date);
                               if (!isFuture(clickedDate) || format(clickedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
                                onDayClick(day.date);
                              }
                            }} 
                          />
                        </div>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default ContributionGraph;
