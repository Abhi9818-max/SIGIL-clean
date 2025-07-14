
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2, Download, Share2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import EchoCard from '@/components/echoes/EchoCard';
import { useToast } from "@/hooks/use-toast";
import { toPng } from 'html-to-image';
import { generateEcho } from '@/ai/flows/echo-flow';

const LOCAL_STORAGE_ECHO_SUMMARY_KEY = 'sigiLEchoSummary';

export default function EchoesPage() {
  const { getUserLevelInfo, getAllRecordsStringified } = useUserRecords();
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>('');
  const echoCardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    try {
      const storedSummary = localStorage.getItem(LOCAL_STORAGE_ECHO_SUMMARY_KEY);
      if (storedSummary) {
        setSummary(JSON.parse(storedSummary));
      }
    } catch (e) {
      console.error("Failed to load echo summary from localStorage", e);
    }
  }, []);

  useEffect(() => {
    if(summary) {
        try {
          localStorage.setItem(LOCAL_STORAGE_ECHO_SUMMARY_KEY, JSON.stringify(summary));
        } catch (e)      {
          console.error("Failed to save echo summary to localStorage", e);
        }
    }
  }, [summary]);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const levelInfo = getUserLevelInfo();
        const recentRecords = getAllRecordsStringified();

        const result = await generateEcho({
            levelName: levelInfo.levelName,
            tierName: levelInfo.tierName,
            recentRecords: recentRecords,
        });

        if (result && result.summary) {
            setSummary(result.summary);
            toast({
                title: "🔮 Echo Generated!",
                description: "A new summary of your deeds has been chronicled.",
            });
        } else {
            throw new Error("AI did not return a valid summary.");
        }
    } catch (e) {
      console.error("Error generating echo:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred. Ensure Genkit is running.";
      setError(`Failed to generate echo. Details: ${errorMessage}`);
      toast({
        title: "Echo Generation Failed",
        description: "The Chronicler fell silent.",
        variant: "destructive"
      });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!echoCardRef.current) return;
    try {
      const dataUrl = await toPng(echoCardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `sigil-echo-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Download Started", description: "Your Echo image is being downloaded." });
    } catch (err) {
      console.error('Failed to download image', err);
      toast({ title: "Download Failed", description: "Could not create the image file.", variant: "destructive" });
    }
  };


  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

  return (
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
      <Header 
        onAddRecordClick={() => {}} 
        onManageTasksClick={() => {}}
      />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
        <Card className="shadow-lg w-full max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Share2 className="h-6 w-6 text-primary" />
              <CardTitle>Echoes of Your Journey</CardTitle>
            </div>
            <CardDescription>Generate a shareable Echo of your current status, a snapshot of your legend to be shared or kept as a trophy.</CardDescription>
          </CardHeader>
          <CardContent>
            
            <div ref={echoCardRef} className="mb-6">
              <EchoCard levelInfo={levelInfo} summary={summary} />
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

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleGenerateSummary} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Chronicling...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate New Summary
                  </>
                )}
              </Button>
               <Button onClick={handleDownloadImage} variant="secondary">
                <Download className="mr-2 h-4 w-4" />
                Download as Image
              </Button>
            </div>

          </CardContent>
        </Card>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t border-border">
        S.I.G.I.L. Echoes &copy; {currentYear}
      </footer>
    </div>
  );
}
