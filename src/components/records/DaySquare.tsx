
"use client";

import React from 'react';
import type { DayData } from '@/types';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format, parseISO, isFuture } from 'date-fns';

interface DaySquareProps {
  day: DayData;
  onClick: () => void;
}

// Helper function to parse HSL string (e.g., "hsl(H S% L%)" or "hsl(H,S%,L%)")
const parseHsl = (hslString: string): { h: number; s: number; l: number } | null => {
  const hslRegex = /hsl\(\s*(\d+)\s*,?\s*(\d+)%\s*,?\s*(\d+)%\s*\)/;
  const match = hslString.match(hslRegex);
  if (match) {
    return {
      h: parseInt(match[1], 10),
      s: parseInt(match[2], 10),
      l: parseInt(match[3], 10),
    };
  }
  return null;
};

const DaySquare: React.FC<DaySquareProps> = ({ day, onClick }) => {
  const dayDate = parseISO(day.date);

  const getSquareStyle = (): React.CSSProperties => {
    if (isFuture(dayDate) && format(dayDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')) {
        return { backgroundColor: 'transparent' };
    }

    // Level 0: No activity or placeholder
    if (day.level === 0 || day.value === null) {
      return { backgroundColor: `var(--contribution-level-0)` };
    }

    // Activity with a defined task color
    if (day.taskColor && day.level > 0 && day.level <= 4) {
      const parsedColor = parseHsl(day.taskColor);
      if (parsedColor) {
        const baseLightness = parsedColor.l;
        const darknessFactor = 15; // Decrease lightness by this % for each step up in level
        let newLightness;

        switch (day.level) {
          case 1:
            newLightness = baseLightness;
            break;
          case 2:
            newLightness = Math.max(0, baseLightness - darknessFactor);
            break;
          case 3:
            newLightness = Math.max(0, baseLightness - 2 * darknessFactor);
            break;
          case 4:
            newLightness = Math.max(0, baseLightness - 3 * darknessFactor);
            break;
          default:
            return { backgroundColor: day.taskColor };
        }
        return { backgroundColor: `hsl(${parsedColor.h}, ${parsedColor.s}%, ${newLightness}%)` };
      } else {
        return { backgroundColor: day.taskColor }; // Fallback to original task color
      }
    }

    // Fallback: Activity exists (level 1-4) but no taskColor defined for it
    if (day.level > 0 && day.level <= 4) {
      return { backgroundColor: `var(--contribution-level-${day.level})` };
    }

    // Default fallback
    return { backgroundColor: `var(--contribution-level-0)` };
  };

  const formattedDate = format(dayDate, "MMM d, yyyy");
  let tooltipText = `No records on ${formattedDate}`;
  if (day.value !== null && day.value > 0) { // Ensure value is positive for meaningful record
     if(day.taskName){
        tooltipText = `${day.value} for ${day.taskName} on ${formattedDate}`;
     } else {
        tooltipText = `${day.value} ${day.value === 1 ? 'record' : 'records'} on ${formattedDate}`;
     }
  }


  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={isFuture(dayDate) && format(dayDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')}
            className={cn(
              "aspect-square w-full h-full rounded-sm focus:outline-none focus:ring-2 focus:ring-ring",
              "hover:shadow-md hover:brightness-110",
              "transition-all duration-200 ease-out",
              (isFuture(dayDate) && format(dayDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')) ? "cursor-not-allowed" : ""
            )}
            style={getSquareStyle()}
            aria-label={tooltipText}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DaySquare;
