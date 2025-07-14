
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Zap } from 'lucide-react';

interface PunishmentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  penalty: number;
  dare: string;
  taskName?: string; // Optional: name of the task if it's a dark streak breach
}

const PunishmentModal: React.FC<PunishmentModalProps> = ({ isOpen, onAccept, penalty, dare, taskName }) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {taskName ? <Zap className="h-6 w-6 text-yellow-400" /> : <AlertTriangle className="h-6 w-6 text-destructive" />}
            {taskName ? 'Dark Streak Broken' : 'Consistency Breach'}
          </DialogTitle>
          <DialogDescription className="text-left pt-2">
            {taskName
              ? `You did not record an entry for "${taskName}" yesterday, breaking your pact.`
              : `Your pact of daily consistency has been broken. The void demands a toll for this lapse.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Penalty Incurred</AlertTitle>
                <AlertDescription>
                    A penalty of <span className="font-bold">{penalty.toLocaleString()} XP</span> has been deducted from your bonus points.
                </AlertDescription>
            </Alert>
             <Alert>
                <Zap className="h-4 w-4" />
                <AlertTitle>Redemption Dare</AlertTitle>
                <AlertDescription>
                    To reclaim your focus, the spirits issue a dare:
                    <span className="block font-semibold italic mt-2 text-foreground">"{dare}"</span>
                </AlertDescription>
            </Alert>
        </div>

        <DialogFooter>
          <Button onClick={onAccept} className="w-full">
            Accept & Add Dare to To-Do List
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PunishmentModal;
