
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Wand2, Loader2, Sparkles } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { generateSuggestions } from '@/ai/flows/suggestions-flow';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';

const AISuggestionsCard: React.FC = () => {
  
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>("AI features are temporarily unavailable due to high demand. Please try again later.");

  const handleGenerateSuggestion = useCallback(async () => {
    // This function is currently disabled.
    // The error state is set by default to inform the user.
  }, []);

  return (
    <Card className="shadow-lg flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-accent" />
          <CardTitle>Performance Coach</CardTitle>
        </div>
        <CardDescription>Leverage AI to get suggestions based on your performance.</CardDescription>
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

      </CardContent>
       <CardFooter>
        <p className="text-xs text-muted-foreground text-center w-full">AI features are temporarily rate-limited.</p>
      </CardFooter>
    </Card>
  );
};

export default AISuggestionsCard;
