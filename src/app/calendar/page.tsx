
"use client";

import React, { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import ContributionGraph from '@/components/records/ContributionGraph';
import RecordModal from '@/components/records/RecordModal';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CornerDownLeft, Calendar } from 'lucide-react';
import { format, getYear } from 'date-fns';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

export default function CalendarPage() {
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<string | null>(null);
  const { getUserLevelInfo, taskDefinitions, records } = useUserRecords();
  const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));

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

  const availableYears = useMemo(() => {
    const years = new Set(records.map(r => getYear(new Date(r.date))));
    years.add(getYear(new Date())); // Ensure current year is always an option
    return Array.from(years).sort((a, b) => b - a);
  }, [records]);

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
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle>Contribution Calendar</CardTitle>
                    <CardDescription>A full overview of your activity. Click any day to add or edit a record.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="year-select" className="flex-shrink-0">Year</Label>
                    <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                      <SelectTrigger className="w-[120px]" id="year-select">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map(year => (
                          <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
             </CardHeader>
             <CardContent>
                <ContributionGraph
                    year={selectedYear}
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
