
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Wand2, BookOpen, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { generateLore } from '@/ai/flows/lore-flow';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';

interface LoreEntry {
  title: string;
  story: string;
  timestamp: string;
}

const LOCAL_STORAGE_LORE_KEY = 'sigiLLoreEntries';

export default function LorePage() {
  const { getUserLevelInfo, taskDefinitions, getAllRecordsStringified } = useUserRecords();
  const [loreEntries, setLoreEntries] = useState<LoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedLore = localStorage.getItem(LOCAL_STORAGE_LORE_KEY);
      if (storedLore) {
        setLoreEntries(JSON.parse(storedLore));
      }
    } catch (e) {
      console.error("Failed to load lore entries from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_LORE_KEY, JSON.stringify(loreEntries));
    } catch (e) {
      console.error("Failed to save lore entries to localStorage", e);
    }
  }, [loreEntries]);

  const handleGenerateLore = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const levelInfo = getUserLevelInfo();
      const records = getAllRecordsStringified();
      const tasks = JSON.stringify(taskDefinitions);

      const result = await generateLore({
        level: levelInfo.currentLevel,
        levelName: levelInfo.levelName,
        tierName: levelInfo.tierName,
        tasks,
        records
      });

      const newEntry: LoreEntry = {
        ...result,
        timestamp: new Date().toISOString(),
      };
      
      setLoreEntries(prev => [newEntry, ...prev]);

      toast({
        title: "📜 Lore Generated!",
        description: `A new chapter, "${result.title}", has been written.`,
      });

    } catch (e) {
      console.error("Error generating lore:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Failed to generate lore. This may be due to a network issue or API configuration problem. Please ensure Genkit is running locally (\`npm run genkit:dev\`) and you are authenticated with Google Cloud. Details: ${errorMessage}`);
      toast({
        title: "Lore Generation Failed",
        description: "Could not write a new chapter to your history.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [getUserLevelInfo, getAllRecordsStringified, taskDefinitions, toast]);

  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

  return (
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
      <Header 
        onAddRecordClick={() => {}} 
        onManageTasksClick={() => {}}
      />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
        <Card className="shadow-lg w-full max-w-4xl mx-auto">
          <CardHeader>
             <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <CardTitle>The Lorebook of S.I.G.I.L.</CardTitle>
            </div>
            <CardDescription>
              Your journey, your legend. Generate unique, AI-powered stories based on your progress and achievements. Each entry is a new chapter in your personal saga.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 text-center">
              <Button onClick={handleGenerateLore} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Writing your legend...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate New Lore Entry
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-destructive/10 border border-destructive/50 text-destructive-foreground rounded-md">
                 <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-3 mt-1" />
                    <div>
                        <p className="font-semibold">Generation Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
              </div>
            )}
            
            <Separator />

            {loreEntries.length === 0 && !isLoading ? (
              <div className="text-center text-muted-foreground py-10">
                <p>Your story has not yet been written.</p>
                <p className="text-sm">Click the button above to generate the first chapter.</p>
              </div>
            ) : (
              <ScrollArea className="h-[60vh] md:h-[calc(100vh-500px)] pr-4 mt-6">
                <div className="space-y-6">
                  {loreEntries.map((entry, index) => (
                    <article key={index} className="p-4 border rounded-lg bg-card-foreground/5 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                      <h3 className="text-xl font-semibold text-primary mb-2">{entry.title}</h3>
                      <p className="text-sm whitespace-pre-wrap font-serif leading-relaxed text-foreground/90">{entry.story}</p>
                       <p className="text-xs text-muted-foreground mt-4 text-right">
                        Written on {new Date(entry.timestamp).toLocaleDateString()}
                      </p>
                    </article>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
