
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
import type { BreachCheckResult } from '@/types';
import { AlertTriangle } from 'lucide-react';

interface ConsistencyBreachModalProps {
  isOpen: boolean;
  onAccept: () => void;
  breachInfo: BreachCheckResult | null;
}

const ConsistencyBreachModal: React.FC<ConsistencyBreachModalProps> = ({ isOpen, onAccept, breachInfo }) => {
  if (!isOpen || !breachInfo) return null;

  const { penalty } = breachInfo;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Consistency Breach
          </DialogTitle>
          <DialogDescription className="text-left pt-2">
            Your pact of daily consistency has been broken. The void demands a toll for this lapse.
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
        </div>

        <DialogFooter>
          <Button onClick={onAccept} className="w-full">
            Acknowledge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConsistencyBreachModal;
