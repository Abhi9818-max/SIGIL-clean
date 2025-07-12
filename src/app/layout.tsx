
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { UserRecordsProvider } from '@/components/providers/UserRecordsProvider';
import { TodoProvider } from '@/components/providers/TodoProvider';

export const metadata: Metadata = {
  title: 'S.I.G.I.L.',
  description: 'System of Internal Growth in Infinite Loop. Track your personal records with a GitHub-like contribution graph.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`font-mono antialiased`}>
        <UserRecordsProvider>
          <TodoProvider>
              {children}
              <Toaster />
          </TodoProvider>
        </UserRecordsProvider>
      </body>
    </html>
  );
}
