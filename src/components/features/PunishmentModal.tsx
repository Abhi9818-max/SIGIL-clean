
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
import { AlertTriangle, Zap, Sword } from 'lucide-react';
import { Separator } from '../ui/separator';

interface PunishmentModalProps {
  isOpen: boolean;
  onAcceptDare: () => void;
  onDecline: () => void;
  penalty: number;
  taskName?: string;
  dare?: string;
}

const PunishmentModal: React.FC<PunishmentModalProps> = ({ isOpen, onAcceptDare, onDecline, penalty, taskName, dare }) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onDecline}>
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
                    A penalty of <span className="font-bold">{penalty.toLocaleString()} XP</span> has been deducted.
                </AlertDescription>
            </Alert>
            
            {dare && (
                <>
                <Separator />
                <Alert>
                    <Sword className="h-4 w-4" />
                    <AlertTitle>A Dare is Issued</AlertTitle>
                    <AlertDescription>
                        You may choose to accept a new pact: <span className="font-semibold italic">"{dare}"</span>.
                    </AlertDescription>
                </Alert>
                </>
            )}
        </div>

        <DialogFooter className="gap-2 sm:flex-col sm:space-x-0">
          {dare ? (
            <>
               <Button onClick={onAcceptDare} className="w-full">
                <Sword className="mr-2 h-4 w-4" />
                Accept Dare
              </Button>
               <Button onClick={onDecline} className="w-full" variant="secondary">
                Decline Dare (Take Penalty Only)
              </Button>
            </>
          ) : (
             <Button onClick={onDecline} className="w-full">
                Acknowledge
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PunishmentModal;
