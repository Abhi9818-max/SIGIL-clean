
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { generateSigil } from '@/ai/flows/sigil-flow';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';

const LOCAL_STORAGE_SIGIL_KEY = 'sigiLSigilImage';

export default function SigilPage() {
  const { getUserLevelInfo } = useUserRecords();
  const [sigilUrl, setSigilUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedSigil = localStorage.getItem(LOCAL_STORAGE_SIGIL_KEY);
      if (storedSigil) {
        setSigilUrl(storedSigil);
      }
    } catch (e) {
      console.error("Failed to load sigil from localStorage", e);
    }
  }, []);

  const handleGenerateSigil = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const levelInfo = getUserLevelInfo();

      const result = await generateSigil({
        levelName: levelInfo.levelName,
        tierName: levelInfo.tierName,
      });

      setSigilUrl(result.imageUrl);
      localStorage.setItem(LOCAL_STORAGE_SIGIL_KEY, result.imageUrl);

      toast({
        title: "✨ Sigil Forged!",
        description: "Your new emblem has been generated and saved.",
      });

    } catch (e) {
      console.error("Error generating sigil:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Failed to forge your sigil. This may be due to a network issue or API configuration problem. Please ensure Genkit is running locally (\`npm run genkit:dev\`) and you are authenticated with Google Cloud. Details: ${errorMessage}`);
      toast({
        title: "Sigil Generation Failed",
        description: "The AI could not forge your emblem.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [getUserLevelInfo, toast]);

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
                <ImageIcon className="h-6 w-6 text-primary" />
                <CardTitle>Your Sigil</CardTitle>
            </div>
            <CardDescription>
              A unique emblem representing your current standing. Generate a new sigil to reflect your growth and power.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="w-full aspect-square bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-border overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p>Forging your sigil...</p>
                    </div>
                ) : sigilUrl ? (
                     <Image 
                        src={sigilUrl} 
                        alt="Generated Sigil" 
                        width={512} 
                        height={512} 
                        className="object-contain w-full h-full"
                        data-ai-hint="emblem logo"
                    />
                ) : (
                    <div className="text-center text-muted-foreground">
                        <p>Your sigil awaits generation.</p>
                    </div>
                )}
            </div>
             <Button onClick={handleGenerateSigil} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  {sigilUrl ? 'Forge a New Sigil' : 'Forge Your Sigil'}
                </>
              )}
            </Button>
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/50 text-destructive-foreground rounded-md">
                 <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-3 mt-1" />
                    <div>
                        <p className="font-semibold">Generation Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
