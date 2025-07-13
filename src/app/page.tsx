
'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import QuoteCard from '@/components/layout/QuoteCard';
import ContributionGraph from '@/components/records/ContributionGraph';
import RecordModal from '@/components/records/RecordModal';
import StatsPanel from '@/components/records/StatsPanel';
import ManageTasksModal from '@/components/manage-tasks/ManageTasksModal';
import TaskFilterBar from '@/components/records/TaskFilterBar';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useTodos } from '@/components/providers/TodoProvider';
import { format } from 'date-fns';
import WeeklyProgressCard from '@/components/progress/WeeklyProgressCard';
import ProgressOverTimeChart from '@/components/progress/ProgressOverTimeChart';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import type { UserLevelInfo } from '@/types';
import { TIER_INFO } from '@/lib/config';
import type { Quote } from '@/lib/quotes';
import { QUOTES } from '@/lib/quotes';
import TodoListCard from '@/components/todo/TodoListCard';
import AISuggestionsCard from '@/components/records/AISuggestionsCard';

const LOCAL_STORAGE_KEY_SHOWN_TIER_TOASTS = 'shownTierWelcomeToasts';

export default function HomePage() {
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<string | null>(null);
  const [isManageTasksModalOpen, setIsManageTasksModalOpen] = useState(false);
  const [selectedTaskFilterId, setSelectedTaskFilterId] = useState<string | null>(null);
  const [currentLevelInfo, setCurrentLevelInfo] = useState<UserLevelInfo | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  const {
    taskDefinitions,
    getUserLevelInfo,
    records,
    totalBonusPoints,
    awardTierEntryBonus,
  } = useUserRecords();
  const { toast } = useToast();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setQuote(randomQuote);
  }, []);

  useEffect(() => {
    const levelInfo = getUserLevelInfo();
    setCurrentLevelInfo(levelInfo);
  }, [getUserLevelInfo, records, totalBonusPoints]);

  useEffect(() => {
    if (currentLevelInfo) {
      const newTierSlug = currentLevelInfo.tierSlug;
      let shownTierToasts: string[] = [];
      try {
        const storedShownToasts = localStorage.getItem(LOCAL_STORAGE_KEY_SHOWN_TIER_TOASTS);
        if (storedShownToasts) {
          shownTierToasts = JSON.parse(storedShownToasts);
        }
      } catch (error) {
        console.error("Failed to load shown tier toasts from localStorage:", error);
        shownTierToasts = [];
      }

      if (!shownTierToasts.includes(newTierSlug)) {
        const newTierData = TIER_INFO.find(tier => tier.slug === newTierSlug);
        if (newTierData) {
          let toastDescription = newTierData.welcomeMessage;

          if (newTierData.tierEntryBonus && newTierData.tierEntryBonus > 0 && newTierData.minLevel > TIER_INFO[0].minLevel) {
            awardTierEntryBonus(newTierData.tierEntryBonus);
            toastDescription += ` You earned ${newTierData.tierEntryBonus} bonus XP!`;
          }

          toast({
            title: `✨ You've reached: ${newTierData.name}! ✨`,
            description: toastDescription,
            duration: 10000,
          });

          shownTierToasts.push(newTierSlug);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY_SHOWN_TIER_TOASTS, JSON.stringify(shownTierToasts));
          } catch (error) {
            console.error("Failed to save shown tier toasts to localStorage:", error);
          }
        }
      }
    }
  }, [currentLevelInfo, toast, awardTierEntryBonus]);

  const handleDayClick = (date: string) => {
    setSelectedDateForModal(date);
    setIsRecordModalOpen(true);
  };

  const handleAddRecordClick = () => {
    setSelectedDateForModal(format(new Date(), 'yyyy-MM-dd'));
    setIsRecordModalOpen(true);
  };

  const handleManageTasksClick = () => {
    setIsManageTasksModalOpen(true);
  };

  const pageTierClass = currentLevelInfo ? `page-tier-group-${currentLevelInfo.tierGroup}` : 'page-tier-group-1';

  return (
    <div className={cn("min-h-screen flex flex-col transition-colors duration-700 ease-in-out", pageTierClass)}>
      <Header
        onAddRecordClick={handleAddRecordClick}
        onManageTasksClick={handleManageTasksClick}
      />
      <QuoteCard quote={quote} />
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8 animate-fade-in-up">
        <StatsPanel selectedTaskFilterId={selectedTaskFilterId} />

        <TaskFilterBar
          taskDefinitions={taskDefinitions}
          selectedTaskId={selectedTaskFilterId}
          onSelectTask={(taskId) => setSelectedTaskFilterId(taskId)}
        />
        <ContributionGraph
          onDayClick={handleDayClick}
          selectedTaskFilterId={selectedTaskFilterId}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <TodoListCard />
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <ProgressOverTimeChart selectedTaskFilterId={selectedTaskFilterId} />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <WeeklyProgressCard selectedTaskFilterId={selectedTaskFilterId} />
            </div>
            <div className="sm:col-span-2 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <AISuggestionsCard />
            </div>
          </div>
        </div>
      </main>
      <RecordModal
        isOpen={isRecordModalOpen}
        onOpenChange={setIsRecordModalOpen}
        selectedDate={selectedDateForModal}
        defaultTaskTypeId={selectedTaskFilterId}
      />
      <ManageTasksModal
        isOpen={isManageTasksModalOpen}
        onOpenChange={setIsManageTasksModalOpen}
      />
      <footer className="text-center py-4 text-sm text-muted-foreground border-t border-border">
        S.I.G.I.L. &copy; {currentYear}
      </footer>
    </div>
  );
}
