
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Settings, ListChecks, Menu as MenuIcon, AppWindow, Award, Sparkles, Server, BarChart2, Share2, Trophy, Target, ShieldCheck, LogOut, Users } from 'lucide-react';
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
import { useAuth } from '@/components/providers/AuthProvider';

interface HeaderProps {
  onAddRecordClick: () => void;
  onManageTasksClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddRecordClick, onManageTasksClick }) => {
  const { getUserLevelInfo } = useUserRecords(); 
  const { logout } = useAuth();
  const [isLevelDetailsModalOpen, setIsLevelDetailsModalOpen] = useState(false);
  const pathname = usePathname();
  const [levelInfo, setLevelInfo] = useState<UserLevelInfo | null>(null);

  useEffect(() => {
    try {
      const info = getUserLevelInfo();
      setLevelInfo(info);
    } catch (error) {
      console.error('Error getting level info:', error);
      setLevelInfo(null);
    }
  }, [getUserLevelInfo]);

  const headerTierClass = levelInfo ? `header-tier-group-${levelInfo.tierGroup}` : 'header-tier-group-1';
  const isDashboardPage = pathname === '/';

  const navLinks = [
    { href: "/friends", label: "Friends", icon: Users },
    { href: "/todo", label: "Pacts", icon: ListChecks },
    { href: "/high-goals", label: "High Goals", icon: ShieldCheck },
    { href: "/insights", label: "Insights", icon: BarChart2 },
    { href: "/achievements", label: "Achievements", icon: Trophy },
    { href: "/constellations", label: "Constellations", icon: Sparkles },
  ];

  const mobileMenuLinks = [
    ...navLinks,
    { href: "/echoes", label: "Echoes", icon: Share2 },
    { isSeparator: true },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/widget", label: "Widget", icon: AppWindow },
    { href: "/test-api", label: "Test API", icon: Server },
  ];

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
            {navLinks.map(link => (
              <Button asChild key={link.href} variant={pathname === link.href ? "secondary" : "ghost"} size="sm">
                <Link href={link.href}>
                  <link.icon className="mr-1.5 h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            ))}
            
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">More Options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center w-full">
                        <Settings className="mr-2 h-4 w-4" /> Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="flex items-center w-full text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

                {isDashboardPage && (
                  <>
                    <DropdownMenuItem onClick={onManageTasksClick} className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Tasks
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onAddRecordClick} className="flex items-center w-full">
                      Add Record
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {mobileMenuLinks.map((link, index) => {
                  if (link.isSeparator) {
                    return <DropdownMenuSeparator key={`sep-${index}`} />;
                  }
                  return (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link href={link.href!} className="flex items-center w-full">
                        <link.icon className="mr-2 h-4 w-4" />
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="flex items-center w-full text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
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
