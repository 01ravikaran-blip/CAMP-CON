import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import BottomNav from '../components/BottomNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Smart Campus Super-App',
  description: 'The ultimate student companion',
};

import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { ThemeProvider } from '../context/ThemeContext';
import { TenantProvider } from '../context/TenantContext';

import WakeUpServices from '../components/WakeUpServices';
import TopProgressBar from '../components/TopProgressBar';
import PageTransition from '../components/PageTransition';
import { ToastProvider } from '../components/Toast';
import { Suspense } from 'react';
import MessengerBar from '../components/MessengerBar';
import EnergyBar from '../components/EnergyBar';
import ComputeNodeProvider from '../components/ComputeNodeProvider';
import DevHUD from '../components/DevHUD';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen pb-16 md:pb-0">
        {/* @ts-ignore - Clerk Appearance Type mismatch */}
        <ClerkProvider telemetry={false} appearance={{ baseTheme: dark }}>
          <ThemeProvider>
            <TenantProvider>
              <WakeUpServices />
              <ComputeNodeProvider />
              <Suspense fallback={null}>
                <TopProgressBar />
              </Suspense>
              <ToastProvider>

                <PageTransition>
                  {children}
                </PageTransition>
                <MessengerBar />
                <BottomNav />
                <DevHUD />
              </ToastProvider>
            </TenantProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
