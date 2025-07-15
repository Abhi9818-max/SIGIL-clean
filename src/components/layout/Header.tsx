
"use client";
import React, { useState, useEffect } from 'react';
import { TrendingUp, Settings, ListChecks, Menu as MenuIcon, AppWindow, Award, Sparkles, Server, BarChart2, Share2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LevelIndicator from './LevelIndicator'; 
import { useUserRecords } from '@/components/providers/UserRecordsProvider'; 
import type { UserLevelInfo } from '@/types'; 
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LevelDetailsModal from './LevelDetailsModal';

interface HeaderProps {
  onAddRecordClick: () => void;
  onManageTasksClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddRecordClick, onManageTasksClick }) => {
  const { getUserLevelInfo, records, totalBonusPoints } = useUserRecords(); 
  const [levelInfo, setLevelInfo] = useState<UserLevelInfo | null>(null);
  const [isLevelDetailsModalOpen, setIsLevelDetailsModalOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLevelInfo(getUserLevelInfo());
  }, [getUserLevelInfo, records, totalBonusPoints]); 


  const headerTierClass = levelInfo ? `header-tier-group-${levelInfo.tierGroup}` : 'header-tier-group-1';
  const isDashboardPage = pathname === '/';
  const isTodoPage = pathname === '/todo';
  const isWidgetPage = pathname === '/widget';
  const isConstellationsPage = pathname === '/constellations';
  const isTestApiPage = pathname === '/test-api';
  const isInsightsPage = pathname === '/insights';
  const isEchoesPage = pathname === '/echoes';
  const isAchievementsPage = pathname === '/achievements';

  return (
    <>
      <header className={cn("py-3 px-4 md:px-6 sticky top-0 z-50 transition-colors duration-500 backdrop-blur-md border-b border-border/50", headerTierClass)}>
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <TrendingUp className="h-7 w-7" />
              <h1 className="text-xl font-semibold hidden sm:block">S.I.G.I.L.</h1>
            </Link>
          </div>
          
          <div className="flex-shrink-0 mx-2 sm:mx-4"> 
             <button 
              onClick={() => setIsLevelDetailsModalOpen(true)}
              className="p-1 rounded-md hover:bg-accent/20 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="View level details"
            >
              <LevelIndicator levelInfo={levelInfo} />
            </button>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-2">
             <Link href="/todo" passHref>
              <Button variant={isTodoPage ? "secondary" : "ghost"} size="sm">
                <ListChecks className="mr-1.5 h-4 w-4" />
                To-Do List
              </Button>
            </Link>
             <Link href="/insights" passHref>
              <Button variant={isInsightsPage ? "secondary" : "ghost"} size="sm">
                <BarChart2 className="mr-1.5 h-4 w-4" />
                Insights
              </Button>
            </Link>
             <Link href="/achievements" passHref>
              <Button variant={isAchievementsPage ? "secondary" : "ghost"} size="sm">
                <Trophy className="mr-1.5 h-4 w-4" />
                Achievements
              </Button>
            </Link>
             <Link href="/constellations" passHref>
              <Button variant={isConstellationsPage ? "secondary" : "ghost"} size="sm">
                <Sparkles className="mr-1.5 h-4 w-4" />
                Constellations
              </Button>
            </Link>
            {isDashboardPage && (
              <>
                <Button onClick={onManageTasksClick} variant="ghost" size="sm">
                  <Settings className="mr-1.5 h-4 w-4" />
                  Manage Tasks
                </Button>
                <Button onClick={onAddRecordClick} variant="secondary" size="sm">
                  Add Record
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                 <DropdownMenuItem onClick={() => setIsLevelDetailsModalOpen(true)} className="flex items-center w-full">
                  <Award className="mr-2 h-4 w-4" />
                  View Level Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/todo" className="flex items-center w-full">
                    <ListChecks className="mr-2 h-4 w-4" />
                    To-Do List
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link href="/insights" className="flex items-center w-full">
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Insights
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link href="/achievements" className="flex items-center w-full">
                    <Trophy className="mr-2 h-4 w-4" />
                    Achievements
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link href="/constellations" className="flex items-center w-full">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Constellations
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link href="/echoes" className="flex items-center w-full">
                    <Share2 className="mr-2 h-4 w-4" />
                    Echoes
                  </Link>
                </DropdownMenuItem>
                {isDashboardPage && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onManageTasksClick} className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Tasks
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onAddRecordClick} className="flex items-center w-full">
                       {/* Could add a PlusCircleIcon here if desired for "Add Record" */}
                      Add Record
                    </DropdownMenuItem>
                  </>
                )}
                 <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                  <Link href="/widget" className="flex items-center w-full">
                    <AppWindow className="mr-2 h-4 w-4" />
                    Widget
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/test-api" className="flex items-center w-full">
                    <Server className="mr-2 h-4 w-4" />
                    Test API
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <LevelDetailsModal
        isOpen={isLevelDetailsModalOpen}
        onOpenChange={setIsLevelDetailsModalOpen}
        levelInfo={levelInfo}
      />
    </>
  );
};

export default Header;
