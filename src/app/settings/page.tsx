

"use client";

import React, { useState, useRef } from 'react';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Settings as SettingsIcon, Download, Upload, Trash2, AlertTriangle, LayoutDashboard, CalendarDays, Database, User, Camera, Image as ImageIcon, PieChart } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LOCAL_STORAGE_KEYS } from '@/lib/config';
import { Switch } from '@/components/ui/switch';
import type { DashboardSettings } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AvatarSelectionDialog from '@/components/settings/AvatarSelectionDialog';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Simple hash function to get a number from a string for consistent default avatars
const simpleHash = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

export default function SettingsPage() {
  const { getUserLevelInfo } = useUserRecords();
  const { dashboardSettings, updateDashboardSetting } = useSettings();
  const { user, userData, updateProfilePicture } = useAuth();
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';
  
  const handleExportData = () => {
    try {
      const allData: Record<string, any> = {};
      LOCAL_STORAGE_KEYS.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          allData[key] = JSON.parse(data);
        }
      });

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(allData, null, 2))}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `sigil_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      toast({
        title: "Export Successful",
        description: "Your data has been downloaded as a JSON file.",
      });

    } catch (error) {
      console.error("Failed to export data:", error);
      toast({
        title: "Export Failed",
        description: "Could not export your data. Check the console for errors.",
        variant: "destructive",
      });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File could not be read.");
        }
        const importedData = JSON.parse(text);
        
        // Clear existing data first
        LOCAL_STORAGE_KEYS.forEach(key => {
            localStorage.removeItem(key);
        });

        // Import new data
        Object.keys(importedData).forEach(key => {
          if (LOCAL_STORAGE_KEYS.includes(key)) {
            localStorage.setItem(key, JSON.stringify(importedData[key]));
          }
        });

        toast({
          title: "Import Successful",
          description: "Your data has been imported. The app will now reload.",
        });

        setTimeout(() => {
          window.location.reload();
        }, 2000);

      } catch (error) {
        console.error("Failed to import data:", error);
        toast({
          title: "Import Failed",
          description: "The file was not valid JSON or was corrupted.",
          variant: "destructive",
        });
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    setIsClearing(true);
    try {
      LOCAL_STORAGE_KEYS.forEach(key => {
        localStorage.removeItem(key);
      });
      
      toast({
        title: "Data Cleared",
        description: "All your data has been removed. The app will now reload.",
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error("Failed to clear data:", error);
      toast({
        title: "Clear Failed",
        description: "Could not clear all data. Check the console for errors.",
        variant: "destructive",
      });
      setIsClearing(false);
    }
  };

  const dashboardComponents: { key: keyof DashboardSettings, label: string, category: 'Main' }[] = [
      { key: 'showTaskFilterBar', label: 'Task Filter Bar', category: 'Main' },
      { key: 'showContributionGraph', label: 'Contribution Graph', category: 'Main' },
      { key: 'showTodoList', label: 'Pacts Card', category: 'Main' },
      { key: 'showProgressChart', label: 'Progress Chart', category: 'Main' },
      { key: 'showTimeBreakdownChart', label: 'Daily Time Breakdown', category: 'Main' },
      { key: 'showAISuggestions', label: 'AI Coach Card', category: 'Main' },
  ];

  const statComponents: { key: keyof DashboardSettings, label: string, hasDaysInput?: keyof DashboardSettings }[] = [
      { key: 'showTotalLast30Days', label: 'Total Value Card', hasDaysInput: 'totalDays' },
      { key: 'showCurrentStreak', label: 'Current Streak Card' },
      { key: 'showDailyConsistency', label: 'Daily Consistency Card', hasDaysInput: 'consistencyDays' },
      { key: 'showHighGoalStat', label: 'High Goal Card' },
  ];

  const handleDaysChange = (key: keyof DashboardSettings, value: string) => {
    // Allow empty string for editing, otherwise convert to number
    const numValue = value === '' ? '' : Number(value);
    
    // Only update if it's an empty string or a valid number within range
    if (numValue === '' || (typeof numValue === 'number' && numValue >= 1 && numValue <= 365)) {
        updateDashboardSetting(key, numValue as any); // Cast to any to allow empty string
    }
  };

  const handleDaysBlur = (key: keyof DashboardSettings, value: string | number) => {
    // If the input is empty or invalid on blur, reset to a default value (e.g., 30)
    if (value === '' || Number(value) <= 0) {
      updateDashboardSetting(key, 30);
    }
  };
  
  const getAvatarForId = (id: string | undefined) => {
      if (!id) return '';
      const avatarNumber = (simpleHash(id) % 12) + 1;
      return `/avatars/avatar-${avatarNumber}.jpeg`;
  }

  const userAvatar = userData?.photoURL || getAvatarForId(user?.uid);


  return (
    <>
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
      <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
        <Card className="shadow-lg w-full max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-6 w-6 text-primary" />
              <CardTitle>Settings</CardTitle>
            </div>
            <CardDescription>
              Manage your application data and settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Profile</TabsTrigger>
                <TabsTrigger value="layout"><LayoutDashboard className="mr-2 h-4 w-4" />Layout</TabsTrigger>
                <TabsTrigger value="data"><Database className="mr-2 h-4 w-4" />Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-primary">Profile Information</h3>
                  <div className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={userAvatar} alt={userData?.username}/>
                          <AvatarFallback className="text-3xl">
                            {userData?.username ? userData.username.charAt(0).toUpperCase() : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xl font-semibold">{userData?.username}</p>
                          <p className="text-sm text-muted-foreground">Level {levelInfo?.currentLevel} {levelInfo?.levelName}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2" 
                            onClick={() => setIsAvatarDialogOpen(true)}
                          >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Change Avatar
                          </Button>
                        </div>
                      </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="layout" className="mt-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg space-y-4">
                      <p className="text-sm text-muted-foreground">Choose which components to display on the main dashboard.</p>
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-3">Stats Panel Cards</h4>
                        <div className="space-y-3 pl-2">
                            {statComponents.map(({ key, label, hasDaysInput }) => (
                                <div key={key} className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor={key.toString()} className="font-normal">{label}</Label>
                                        <Switch
                                            id={key.toString()}
                                            checked={!!dashboardSettings[key]}
                                            onCheckedChange={(checked) => updateDashboardSetting(key, checked)}
                                        />
                                    </div>
                                    {hasDaysInput && dashboardSettings[key] && (
                                         <div className="flex items-center gap-2 pl-4 animate-fade-in-up">
                                            <CalendarDays className="h-4 w-4 text-muted-foreground"/>
                                            <Label htmlFor={`${hasDaysInput}-input`} className="text-xs text-muted-foreground whitespace-nowrap">Time Period (days)</Label>
                                            <Input
                                                id={`${hasDaysInput}-input`}
                                                type="number"
                                                className="h-8 w-20"
                                                value={dashboardSettings[hasDaysInput] as number}
                                                onChange={(e) => handleDaysChange(hasDaysInput, e.target.value)}
                                                onBlur={(e) => handleDaysBlur(hasDaysInput, e.target.value)}
                                                min={1}
                                                max={365}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold text-sm mb-3">Main Dashboard Components</h4>
                         <div className="space-y-3 pl-2">
                          {dashboardComponents.map(({ key, label }) => (
                              <div key={key} className="flex items-center justify-between">
                                  <Label htmlFor={key.toString()} className="font-normal">{label}</Label>
                                  <Switch
                                      id={key.toString()}
                                      checked={!!dashboardSettings[key]}
                                      onCheckedChange={(checked) => updateDashboardSetting(key, checked)}
                                  />
                              </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <PieChart className="h-4 w-4"/>
                          Chart Display
                        </h4>
                         <div className="space-y-3 pl-2">
                          <div>
                            <Label className="font-normal">Time Pie Chart Labels</Label>
                            <RadioGroup 
                              value={dashboardSettings.pieChartLabelFormat || 'percentage'}
                              onValueChange={(value: 'percentage' | 'time') => updateDashboardSetting('pieChartLabelFormat', value)}
                              className="mt-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="percentage" id="r-percent" />
                                <Label htmlFor="r-percent" className="font-normal">Percentage</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="time" id="r-time" />
                                <Label htmlFor="r-time" className="font-normal">Time (HH:MM)</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                      </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="data" className="mt-6">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-primary">Data Backup & Restore</h3>
                        <div className="p-4 border rounded-lg space-y-4">
                            <p className="text-sm text-muted-foreground">Export all your data to a JSON file for backup, or import a previous backup.</p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button onClick={handleExportData} className="w-full">
                                    <Download className="mr-2 h-4 w-4"/>
                                    Export Data
                                </Button>
                                <Label htmlFor="import-file" className={cn("w-full", buttonVariants())}>
                                    <Upload className="mr-2 h-4 w-4"/>
                                    Import Data
                                </Label>
                                <Input id="import-file" type="file" accept=".json" className="hidden" onChange={handleImportData} disabled={isImporting}/>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                        <div className="p-4 border border-destructive/50 rounded-lg space-y-4 bg-destructive/10">
                            <p className="text-sm text-destructive/90">These actions are irreversible. Please be certain before proceeding.</p>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                  <Trash2 className="mr-2 h-4 w-4"/>
                                   Clear All Data
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete all your records, tasks, goals, achievements, and settings. This action cannot be undone. It is highly recommended to export your data first.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClearData} disabled={isClearing} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                        {isClearing ? "Clearing..." : "Yes, delete everything"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </div>
              </TabsContent>
            </Tabs>

          </CardContent>
        </Card>
      </main>
    </div>
    <AvatarSelectionDialog
        isOpen={isAvatarDialogOpen}
        onOpenChange={setIsAvatarDialogOpen}
        onSelect={(url) => updateProfilePicture(url)}
        currentAvatar={userData?.photoURL}
    />
    </>
  );
}
