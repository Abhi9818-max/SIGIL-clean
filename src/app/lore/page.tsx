
"use client";

import React from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';

export default function LorePage() {
  const { getUserLevelInfo } = useUserRecords();
  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

  return (
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
      <Header 
        onAddRecordClick={() => {}} 
        onManageTasksClick={() => {}}
      />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up flex items-center justify-center">
        <Card className="shadow-lg w-full max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
              <BookX className="h-8 w-8 text-destructive" />
              <CardTitle>Lorebook Disabled</CardTitle>
            </div>
            <CardDescription>
              The AI-powered lore generation feature has been disabled to remove the need for a billing account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              All core features like record tracking, leveling, and tasks are still fully functional.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
