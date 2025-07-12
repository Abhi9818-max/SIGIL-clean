"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { UserLevelInfo } from '@/types';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { LEVEL_NAMES, TIER_INFO } from '@/lib/config';
import { BookOpen } from 'lucide-react';

interface LevelDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  levelInfo: UserLevelInfo | null;
}

const LevelDetailsModal: React.FC<LevelDetailsModalProps> = ({ isOpen, onOpenChange, levelInfo }) => {
  if (!levelInfo) return null;

  const {
    currentLevel,
    levelName,
    tierName,
    tierIcon,
    tierGroup,
    welcomeMessage,
    progressPercentage,
    totalAccumulatedValue,
    valueTowardsNextLevel,
    pointsForNextLevel,
    isMaxLevel,
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <span className="text-4xl">{tierIcon}</span>
            <span>{tierName}</span>
          </DialogTitle>
          <DialogDescription className="text-left italic pt-2">
            "{welcomeMessage}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-lg">Level {currentLevel}: {levelName}</h4>
            <p className="text-sm text-muted-foreground">Your current standing in the S.I.G.I.L. system.</p>
          </div>

          <div>
            <h4 className="font-semibold text-md mb-2">Progress to Next Level</h4>
            {isMaxLevel ? (
              <p className={cn("font-semibold text-lg", progressColorClass.replace('bg-', 'text-'))}>Max Level Reached!</p>
            ) : (
              <>
                <Progress value={progressPercentage} className="h-4" indicatorClassName={progressColorClass} />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{valueTowardsNextLevel.toLocaleString()} XP</span>
                  <span>{pointsForNextLevel?.toLocaleString()} XP</span>
                </div>
                 <p className="text-center text-sm mt-1">{progressPercentage.toFixed(1)}% complete</p>
              </>
            )}
          </div>
          
          <Separator />

          <div>
            <h4 className="font-semibold text-md mb-2">Statistics</h4>
            <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total XP Earned:</span>
                <span className="font-bold text-lg text-primary">{totalAccumulatedValue.toLocaleString()}</span>
            </div>
          </div>

          <Separator />

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="all-levels">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  View All Levels & Tiers
                </div>
              </AccordionTrigger>
              <AccordionContent>
                 <ScrollArea className="h-[250px] pr-4">
                  <ul className="space-y-4">
                    {TIER_INFO.map(tier => (
                      <li key={tier.slug} className="p-3 rounded-lg bg-muted/20 border border-border/50">
                        <h5 className="font-semibold text-md flex items-center gap-2 mb-2 sticky top-0 bg-muted/30 backdrop-blur-sm py-1 -mx-3 -mt-3 px-3 rounded-t-lg border-b border-border/50">
                          {tier.icon} {tier.name} 
                          <span className="text-sm font-normal text-muted-foreground ml-auto">(Lv. {tier.minLevel}-{tier.maxLevel})</span>
                        </h5>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                          {LEVEL_NAMES.slice(tier.minLevel - 1, tier.maxLevel).map((name, index) => {
                            const levelNumber = tier.minLevel + index;
                            const isCurrent = levelNumber === currentLevel;
                            return (
                              <li key={name} className={cn(
                                "text-sm p-1 rounded-md",
                                isCurrent ? "font-bold text-primary bg-primary/10" : "text-muted-foreground"
                              )}>
                                {name}
                              </li>
                            )
                          })}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LevelDetailsModal;
