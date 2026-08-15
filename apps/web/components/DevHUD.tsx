"use client";

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { isDeveloper } from '../lib/auth';
import { useTenant } from '../context/TenantContext';

export default function DevHUD() {
  const { user, isLoaded } = useUser();
  const { setCampus } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Gated HUD
  if (!isLoaded || !isDeveloper(undefined, user)) return null;

  const handleRefillEnergy = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/energy/refill', { method: 'POST' });
      if (res.ok) {
        alert('Energy refilled to maximum!');
      } else {
        alert('Failed to refill energy');
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleToggleGodMode = () => {
    // This is a UI toggle that would hook into your map state. 
    // For now, we mock it via local storage or a global state.
    const isGodMode = localStorage.getItem('dev_god_mode') === 'true';
    localStorage.setItem('dev_god_mode', isGodMode ? 'false' : 'true');
    alert(`God Mode Radar is now ${!isGodMode ? 'ON' : 'OFF'}!`);
  };

  const handleTenantSwitch = () => {
    const slug = prompt("Enter campus slug (e.g. 'cu', 'tiet', 'global'):");
    if (slug) {
      setCampus(slug);
      alert(`Tenant manually switched to ${slug}`);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-black/80 backdrop-blur-md border border-white/20 text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
      >
        <span className="text-xl">🛠️</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 glass glass-card p-4 rounded-3xl shadow-2xl animate-enter border border-blue-500/30">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-sm tracking-widest text-blue-400">DEV HUD</h3>
        <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">✕</button>
      </div>
      
      <div className="flex flex-col gap-2">
        <button 
          onClick={handleRefillEnergy}
          disabled={loading}
          className="text-left px-4 py-3 bg-black/30 hover:bg-blue-600/50 border border-white/10 rounded-xl text-sm transition-colors"
        >
          ⚡ Refill Energy to Max
        </button>
        
        <button 
          onClick={handleToggleGodMode}
          className="text-left px-4 py-3 bg-black/30 hover:bg-green-600/50 border border-white/10 rounded-xl text-sm transition-colors"
        >
          📡 Toggle God Mode Radar
        </button>
        
        <button 
          onClick={handleTenantSwitch}
          className="text-left px-4 py-3 bg-black/30 hover:bg-purple-600/50 border border-white/10 rounded-xl text-sm transition-colors"
        >
          🏢 Switch Campus Tenant
        </button>

        <Link 
          href="/events/create"
          className="text-left px-4 py-3 bg-black/30 hover:bg-orange-600/50 border border-white/10 rounded-xl text-sm transition-colors block"
        >
          🎟️ Open Event Creator
        </Link>
        <Link 
          href="/admin/events"
          className="text-left px-4 py-3 bg-black/30 hover:bg-red-600/50 border border-white/10 rounded-xl text-sm transition-colors block"
        >
          📷 Open QR Host
        </Link>
      </div>
    </div>
  );
}
