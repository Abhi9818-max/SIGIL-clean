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
  manifest: '/manifest.json',
  themeColor: '#000000', // Or match your brand color
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* Meta for PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className={`font-sans antialiased`}>
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
