
"use client";

import React from 'react';
import type { UserLevelInfo } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

interface EchoCardProps {
  levelInfo: UserLevelInfo | null;
  summary: string;
}

const EchoCard: React.FC<EchoCardProps> = ({ levelInfo, summary }) => {
  if (!levelInfo) {
    // Render a loading state or placeholder if levelInfo is not available
    return <Card className="aspect-[16/9] flex items-center justify-center bg-card-foreground/5"><p>Loading Echo...</p></Card>;
  }

  const {
    currentLevel,
    levelName,
    tierName,
    tierIcon,
    tierGroup,
    progressPercentage,
    totalAccumulatedValue,
  } = levelInfo;

  const getTierProgressClassName = (group: number): string => {
    switch (group) {
      case 1: return 'bg-progress-tier-group-1';
      case 2: return 'bg-progress-tier-group-2';
      case 3: return 'bg-progress-tier-group-3';
      case 4: return 'bg-progress-tier-group-4';
      case 5: return 'bg-progress-tier-group-5';
      default: return 'bg-progress-tier-group-1';
    }
  };
  const progressColorClass = getTierProgressClassName(tierGroup);
  
  // Dynamically create a gradient based on the tier's theme colors
  const gradientStyle = {
    '--bg-start': `hsl(var(--tier-group-${tierGroup}-page-bg-start))`,
    '--bg-end': `hsl(var(--tier-group-${tierGroup}-page-bg-end))`,
    backgroundImage: `linear-gradient(135deg, var(--bg-start), var(--bg-end))`,
  } as React.CSSProperties;


  return (
    <Card 
      className={cn("w-full aspect-[16/9] shadow-2xl text-foreground p-6 flex flex-col justify-between border-2 border-border/30 overflow-hidden")}
      style={gradientStyle}
    >
      <CardHeader className="p-0">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">{levelName}</h3>
                <p className="text-sm text-primary/80 font-medium">{tierIcon} {tierName}</p>
            </div>
            <div className="flex items-center gap-2 text-foreground/80">
                <TrendingUp className="h-5 w-5" />
                <span className="text-lg font-semibold">S.I.G.I.L.</span>
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-grow flex items-center justify-center">
         <blockquote className="text-center max-w-md">
            <p className="text-xl md:text-2xl font-serif italic text-foreground/90 leading-tight">
              "{summary || '...'}"
            </p>
          </blockquote>
      </CardContent>

      <CardFooter className="p-0 flex flex-col items-start gap-2">
        <div className="w-full">
          <div className="flex justify-between text-xs font-mono text-foreground/80 mb-1">
            <span>Level {currentLevel}</span>
            <span>Total XP: {totalAccumulatedValue.toLocaleString()}</span>
          </div>
          <Progress value={progressPercentage} className="h-3" indicatorClassName={progressColorClass} />
        </div>
      </CardFooter>
    </Card>
  );
};

export default EchoCard;
