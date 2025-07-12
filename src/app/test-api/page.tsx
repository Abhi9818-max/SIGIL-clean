
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Code, Server, Zap } from 'lucide-react';
import Link from 'next/link';

export default function TestApiPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendTestRecord = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/metamorph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskName: "Test Task from API",
          taskType: "learning",
          date: new Date().toISOString().split('T')[0], // Today's date
          value: 100
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "✅ API Call Successful",
          description: "A test record was sent. Check your server logs to see the received data!",
          duration: 7000,
        });
      } else {
        throw new Error(result.message || "An unknown error occurred.");
      }

    } catch (error) {
      console.error("Failed to send test record:", error);
      toast({
        title: "❌ API Call Failed",
        description: error instanceof Error ? error.message : "Could not send test record.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-6 w-6 text-primary" />
            <CardTitle>Metamorph API Tester</CardTitle>
          </div>
          <CardDescription>
            This page demonstrates how an external application can send data to your S.I.G.I.L. app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Clicking the button below simulates an external app (like a habit tracker) sending a POST request to your app's <code>/api/metamorph</code> endpoint.
          </p>
          <div className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
            <p className="font-bold mb-1 flex items-center gap-1"><Code className="h-3 w-3" /> Request Body (Example):</p>
            <pre className="text-muted-foreground">
{`{
  "taskName": "Test Task",
  "taskType": "learning",
  "date": "YYYY-MM-DD",
  "value": 100
}`}
            </pre>
          </div>
          <Button onClick={handleSendTestRecord} disabled={isLoading} className="w-full">
            {isLoading ? "Sending..." : <><Zap className="mr-2 h-4 w-4" /> Send Test Record to API</>}
          </Button>
          <p className="text-xs text-center text-muted-foreground pt-2">
            After clicking, check the server logs in your development environment to see the confirmation message.
          </p>
        </CardContent>
      </Card>
      <div className="absolute bottom-4">
        <Button asChild variant="outline">
            <Link href="/">
                Return to Dashboard
            </Link>
        </Button>
      </div>
    </div>
  );
}
