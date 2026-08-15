"use client";

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

interface VerifiedGateProps {
  children: React.ReactNode;
  actionLabel?: string;
}

export default function VerifiedGate({ children, actionLabel }: VerifiedGateProps) {
  const { isLoaded, user } = useUser();
  const [showModal, setShowModal] = useState(false);

  // Check if verified. By default we can assume 'isVerified' exists on publicMetadata.
  const isVerified = user?.publicMetadata?.isVerified === true;

  const handleCapture = (e: React.MouseEvent) => {
    // If not loaded, or not logged in, or not verified
    if (isLoaded && (!user || !isVerified)) {
      e.preventDefault();
      e.stopPropagation();
      setShowModal(true);
    }
  };

  return (
    <>
      <div onClickCapture={handleCapture} className="contents cursor-pointer">
        {children}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="glass glass-card max-w-md w-full p-8 rounded-3xl animate-enter text-[var(--text-primary)] relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[200px] h-[200px] rounded-full bg-blue-500/20 blur-[80px] pointer-events-none" />
            
            <div className="text-center mb-6 relative z-10">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 mx-auto flex items-center justify-center text-white mb-6 shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Verified Campus Citizen Required</h2>
              <p className="opacity-70 text-sm leading-relaxed">
                {actionLabel 
                  ? `${actionLabel} requires a 10-second Student ID scan.` 
                  : "Sending Pokéballs, 48h chats, and releasing escrow require a 10-second Student ID scan."}
              </p>
            </div>

            <div className="space-y-3 relative z-10">
              <Link 
                href="/verify"
                className="w-full bg-blue-500 text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg active:scale-95"
              >
                Scan Student ID Now
              </Link>
              <button 
                onClick={() => setShowModal(false)}
                className="w-full bg-black/5 dark:bg-white/5 py-4 px-4 rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors font-semibold"
              >
                Browse as Guest
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
