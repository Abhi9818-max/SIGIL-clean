
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Wand2, Gift, CheckSquare, Loader2, Sparkles } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { generateSuggestions } from '@/ai/flows/suggestions-flow';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';

const AISuggestionsCard: React.FC = () => {
  const {
    taskDefinitions,
    checkAndAwardAutomatedGoal,
    isGoalMetForLastPeriod,
    getUserLevelInfo,
    getAllRecordsStringified,
  } = useUserRecords();
  
  const [isCheckingAllGoals, setIsCheckingAllGoals] = useState(false);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>("AI features are temporarily unavailable due to high demand. Please try again later.");
  const { toast } = useToast();

  const eligibleGoalTasks = useMemo(() => {
    return taskDefinitions.filter(
      task => task.goalValue && task.goalValue > 0 && task.goalInterval && !isGoalMetForLastPeriod(task.id)
    );
  }, [taskDefinitions, isGoalMetForLastPeriod]);

  const handleCheckAllGoals = async () => {
    setIsCheckingAllGoals(true);

    const goalPromises = eligibleGoalTasks.map(task => checkAndAwardAutomatedGoal(task.id));
    const results = await Promise.all(goalPromises);
    
    let goalsChecked = 0;
    results.forEach(result => {
      if (result.error) {
        toast({
          title: `Goal Check: ${result.taskName || 'Task'}`,
          description: result.error,
          variant: "destructive",
        });
      } else if (result) {
        goalsChecked++;
        let description = '';
        if (result.metGoal) {
          if (result.goalType === 'at_least') {
            description = `Goal Met! You recorded ${result.actualValue} / ${result.goalValue} for ${result.periodName}.`;
          } else {
            description = `Goal Met! You recorded ${result.actualValue}, staying under the max of ${result.goalValue} for ${result.periodName}.`;
          }
          if (result.bonusAwarded !== null && result.bonusAwarded > 0) {
            description += ` You earned ${result.bonusAwarded} bonus points!`;
          }
          toast({
            title: `🎉 Goal Achieved: ${result.taskName}`,
            description: description,
            duration: 7000,
          });
        } else {
           if (result.goalType === 'at_least') {
            description = `Goal not met for ${result.periodName}. You recorded ${result.actualValue} / ${result.goalValue}. Keep pushing!`;
          } else {
            description = `Goal failed for ${result.periodName}. You recorded ${result.actualValue}, exceeding the max of ${result.goalValue}.`;
          }
          toast({
            title: `🎯 Goal Update: ${result.taskName}`,
            description: description,
            duration: 7000,
          });
        }
      }
    });

    if (goalsChecked === 0) {
        toast({
            title: "No New Goals to Check",
            description: "All your past goals have already been evaluated.",
        });
    }

    setIsCheckingAllGoals(false);
  };

  const handleGenerateSuggestion = useCallback(async () => {
    // This function is now disabled
  }, []);

  const hasConfiguredGoals = useMemo(() => {
    return taskDefinitions.some(task => task.goalValue && task.goalValue > 0 && task.goalInterval);
  }, [taskDefinitions]);

  return (
    <Card className="shadow-lg flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-accent" />
          <CardTitle>Performance Coach</CardTitle>
        </div>
        <CardDescription>Leverage AI to get suggestions and automatically check goals.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2 text-foreground/90 flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-yellow-400" />
            AI-Powered Suggestion
          </h4>
           <Button
            onClick={handleGenerateSuggestion}
            variant="outline"
            size="sm"
            className="w-full mb-3"
            disabled={true}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Get New Suggestion
          </Button>

          {suggestionError && (
             <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>AI Service Unavailable</AlertTitle>
                <AlertDescription>{suggestionError}</AlertDescription>
            </Alert>
          )}

          {suggestion && (
            <Alert className="mt-2">
                <AlertTitle className="font-semibold">Suggestion:</AlertTitle>
                <AlertDescription>{suggestion}</AlertDescription>
            </Alert>
          )}

        </div>

        <Separator />

        {hasConfiguredGoals ? (
          <>
            <div>
              <h4 className="text-sm font-semibold mb-2 text-foreground/90 flex items-center">
                <Gift className="h-4 w-4 mr-2 text-yellow-400" />
                Automated Goal Check & Rewards
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Check your performance against set goals for the last completed period (daily, weekly, or monthly). Bonuses are awarded automatically if criteria are met.
              </p>
              <Button
                onClick={handleCheckAllGoals}
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isCheckingAllGoals || eligibleGoalTasks.length === 0}
              >
                {isCheckingAllGoals ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckSquare className="mr-2 h-4 w-4" />
                )}
                {isCheckingAllGoals ? 'Checking...' : (eligibleGoalTasks.length > 0 ? 'Check All Completed Goals' : 'All Goals Checked')}
              </Button>
              {eligibleGoalTasks.length === 0 && (
                 <p className="text-xs text-muted-foreground text-center mt-2">All eligible goals for the last completed periods have been checked.</p>
              )}
            </div>
          </>
        ) : (
            <p className="text-sm text-muted-foreground">Define goals for your tasks in "Manage Tasks" to enable automated reward checking.</p>
        )}
      </CardContent>
       <CardFooter>
        <p className="text-xs text-muted-foreground text-center w-full">AI features are temporarily rate-limited.</p>
      </CardFooter>
    </Card>
  );
};

export default AISuggestionsCard;
