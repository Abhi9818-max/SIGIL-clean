
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, KeyRound, User } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

const setupSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters.").max(20, "Username is too long."),
    password: z.string().min(6, "Password must be at least 6 characters.").max(50, "Password is too long."),
});

type LoginForm = z.infer<typeof loginSchema>;
type SetupForm = z.infer<typeof setupSchema>;

export default function LoginPage() {
  const { isInitialSetup, login, setupCredentials } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const setupForm = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: { username: '', password: '' },
  });

  const handleLogin = async (data: LoginForm) => {
    setError(null);
    const success = await login(data.username, data.password);
    if (!success) {
      setError("Invalid username or password.");
    }
  };

  const handleSetup = async (data: SetupForm) => {
    setError(null);
    await setupCredentials(data.username, data.password);
  };
  
  // Use the isInitialSetup flag to determine which form to show
  const FormComponent = isInitialSetup ? setupForm : loginForm;
  const onSubmit = isInitialSetup ? handleSetup : handleLogin;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full shadow-2xl animate-fade-in-up">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <CardTitle>Welcome to S.I.G.I.L.</CardTitle>
          </div>
          <CardDescription>
            {isInitialSetup 
              ? "Create your account to begin your journey." 
              : "Enter your credentials to access your records."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={FormComponent.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="username" type="text" {...FormComponent.register('username')} className="pl-10" />
              </div>
              {FormComponent.formState.errors.username && <p className="text-sm text-destructive mt-1">{FormComponent.formState.errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" {...FormComponent.register('password')} className="pl-10" />
              </div>
              {FormComponent.formState.errors.password && <p className="text-sm text-destructive mt-1">{FormComponent.formState.errors.password.message}</p>}
            </div>
            
            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button type="submit" className="w-full" disabled={FormComponent.formState.isSubmitting}>
              {FormComponent.formState.isSubmitting ? "Processing..." : (isInitialSetup ? 'Create Account & Enter' : 'Login')}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center pt-2">
              {isInitialSetup 
                ? "Your data will be securely stored in the cloud."
                : "Forgot your password? There is no recovery process."
              }
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
