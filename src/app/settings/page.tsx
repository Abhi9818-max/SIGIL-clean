
"use client";

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Settings as SettingsIcon, Download, Upload, Trash2, AlertTriangle, LayoutDashboard } from 'lucide-react';
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


export default function SettingsPage() {
  const { getUserLevelInfo } = useUserRecords();
  const { dashboardSettings, updateDashboardSetting } = useSettings();
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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

  const dashboardComponents: { key: keyof DashboardSettings, label: string, category: 'Stats' | 'Main' }[] = [
      { key: 'showTotalLast30Days', label: 'Total Last 30 Days Card', category: 'Stats' },
      { key: 'showCurrentStreak', label: 'Current Streak Card', category: 'Stats' },
      { key: 'showDailyConsistency', label: 'Daily Consistency Card', category: 'Stats' },
      { key: 'showHighGoalStat', label: 'High Goal Card', category: 'Stats' },
      { key: 'showTaskFilterBar', label: 'Task Filter Bar', category: 'Main' },
      { key: 'showContributionGraph', label: 'Contribution Graph', category: 'Main' },
      { key: 'showTodoList', label: 'Pacts Card', category: 'Main' },
      { key: 'showProgressChart', label: 'Progress Chart', category: 'Main' },
      { key: 'showAISuggestions', label: 'AI Coach Card', category: 'Main' },
  ];

  return (
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
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-primary flex items-center gap-2"><LayoutDashboard className="h-5 w-5" /> Dashboard Layout</h3>
              <div className="p-4 border rounded-lg space-y-4">
                  <p className="text-sm text-muted-foreground">Choose which components to display on the main dashboard.</p>
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Stats Panel Cards</h4>
                    <div className="space-y-3 pl-2">
                        {dashboardComponents.filter(c => c.category === 'Stats').map(({ key, label }) => (
                            <div key={key} className="flex items-center justify-between">
                                <Label htmlFor={key} className="font-normal">{label}</Label>
                                <Switch
                                    id={key}
                                    checked={dashboardSettings[key]}
                                    onCheckedChange={(checked) => updateDashboardSetting(key, checked)}
                                />
                            </div>
                        ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold text-sm mb-3">Main Dashboard Components</h4>
                     <div className="space-y-3 pl-2">
                      {dashboardComponents.filter(c => c.category === 'Main').map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between">
                              <Label htmlFor={key} className="font-normal">{label}</Label>
                              <Switch
                                  id={key}
                                  checked={dashboardSettings[key]}
                                  onCheckedChange={(checked) => updateDashboardSetting(key, checked)}
                              />
                          </div>
                      ))}
                    </div>
                  </div>
              </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-medium text-primary">Data Management</h3>
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

          </CardContent>
        </Card>
      </main>
    </div>
  );
}
