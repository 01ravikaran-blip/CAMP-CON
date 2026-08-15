import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import BottomNav from '../components/BottomNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Smart Campus Super-App',
  description: 'The ultimate student companion',
};

import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '../context/ThemeContext';

import WakeUpServices from '../components/WakeUpServices';
import TopProgressBar from '../components/TopProgressBar';
import PageTransition from '../components/PageTransition';
import { ToastProvider } from '../components/Toast';
import { Suspense } from 'react';
import MessengerBar from '../components/MessengerBar';
import EnergyBar from '../components/EnergyBar';
import ComputeNodeProvider from '../components/ComputeNodeProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased min-h-screen pb-16 md:pb-0">
          <ThemeProvider>
            <WakeUpServices />
            <ComputeNodeProvider />
            <Suspense fallback={null}>
              <TopProgressBar />
            </Suspense>
            <ToastProvider>
              <div className="fixed top-4 right-4 z-50">
                <EnergyBar />
              </div>
              <PageTransition>
                {children}
              </PageTransition>
              <MessengerBar />
              <BottomNav />
            </ToastProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
