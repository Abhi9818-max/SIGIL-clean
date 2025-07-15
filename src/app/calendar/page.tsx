
"use client";

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import ContributionGraph from '@/components/records/ContributionGraph';
import RecordModal from '@/components/records/RecordModal';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CornerDownLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CalendarPage() {
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<string | null>(null);
  const { getUserLevelInfo, taskDefinitions, records } = useUserRecords();
  
  const handleDayClick = (date: string) => {
    setSelectedDateForModal(date);
    setIsRecordModalOpen(true);
  };

  const handleAddRecordClick = () => {
    setSelectedDateForModal(format(new Date(), 'yyyy-MM-dd'));
    setIsRecordModalOpen(true);
  };
  
  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

  return (
    <>
      <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
        <Header 
          onAddRecordClick={handleAddRecordClick} 
          onManageTasksClick={() => { /* Not needed on this page, but prop is required */ }}
        />
        <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
           <Card className="shadow-lg w-full max-w-7xl mx-auto">
             <CardHeader>
                <CardTitle>Contribution Calendar</CardTitle>
                <CardDescription>A full overview of your activity for the year. Click any day to add or edit a record.</CardDescription>
             </CardHeader>
             <CardContent>
                <ContributionGraph
                    onDayClick={handleDayClick}
                    selectedTaskFilterId={null} // Show all tasks on this view
                    displayMode="full"
                />
             </CardContent>
           </Card>
          
           <div className="text-center mt-8">
              <Button asChild variant="outline">
                  <Link href="/">
                      <CornerDownLeft className="mr-2 h-4 w-4" />
                      Return to Dashboard
                  </Link>
              </Button>
          </div>
        </main>
      </div>
      <RecordModal
        isOpen={isRecordModalOpen}
        onOpenChange={setIsRecordModalOpen}
        selectedDate={selectedDateForModal}
      />
    </>
  );
}
