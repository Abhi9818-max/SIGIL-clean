
"use client";

import React from 'react';
import type { UserLevelInfo } from '@/types';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface LevelIndicatorProps {
  levelInfo: UserLevelInfo | null;
  className?: string;
}

const LevelIndicator: React.FC<LevelIndicatorProps> = ({ levelInfo, className }) => {
  if (!levelInfo) {
    return <div className={cn("flex items-center min-h-[40px]", className)} />; // Placeholder for loading
  }

  const { 
    currentLevel, 
    levelName, 
    tierIcon, 
    tierName, 
    tierGroup, // Added tierGroup
    progressPercentage, 
    totalAccumulatedValue,
    valueTowardsNextLevel,
    pointsForNextLevel,
    isMaxLevel
  } = levelInfo;

  const getTierProgressClassName = (group: number): string => {
    // Map tierGroup to Tailwind CSS classes defined in tailwind.config.ts
    switch (group) {
      case 1: return 'bg-progress-tier-group-1';
      case 2: return 'bg-progress-tier-group-2';
      case 3: return 'bg-progress-tier-group-3';
      case 4: return 'bg-progress-tier-group-4';
      case 5: return 'bg-progress-tier-group-5';
      default: return 'bg-progress-tier-group-1'; // Fallback
    }
  };

  const progressColorClass = getTierProgressClassName(tierGroup);
  const maxLevelProgressColorClass = getTierProgressClassName(5); // Use group 5 color for max level text

  let tooltipText = `${valueTowardsNextLevel.toLocaleString()} / ${pointsForNextLevel ? pointsForNextLevel.toLocaleString() : 'MAX'} XP`;
  if (isMaxLevel) {
      tooltipText = `Max Level Reached! Total XP: ${totalAccumulatedValue.toLocaleString()}`;
  }


  return (
    <div className={cn("flex flex-col items-start", className)}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg" title={tierName}>{tierIcon}</span>
        <span className="text-sm font-semibold text-foreground truncate max-w-[150px] md:max-w-[200px]" title={`${tierName}: ${levelName}`}>
          Lv. {currentLevel}: {levelName}
        </span>
      </div>
      {!isMaxLevel && (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-32 md:w-40">
                 <Progress value={progressPercentage} className="h-2.5" indicatorClassName={progressColorClass} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipText} ({progressPercentage.toFixed(0)}%)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {isMaxLevel && (
         <p className={cn("text-xs font-semibold", maxLevelProgressColorClass.replace('bg-', 'text-'))}>{tooltipText}</p>
      )}
    </div>
  );
};

export default LevelIndicator;
