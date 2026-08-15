"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CAMPUS_REGISTRY, CampusConfig } from '../config/campuses';

interface TenantContextType {
  activeCampus: CampusConfig | null;
  setCampus: (slug: string) => void;
  autoDetectCampus: () => void;
  isSelecting: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Haversine formula
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [activeCampus, setActiveCampus] = useState<CampusConfig | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Read from cookies
    const cookies = document.cookie.split(';');
    const tenantCookie = cookies.find(c => c.trim().startsWith('x-tenant-slug='));
    
    if (tenantCookie) {
      const slug = tenantCookie.split('=')[1];
      const campus = CAMPUS_REGISTRY.find(c => c.slug === slug);
      if (campus) {
        setActiveCampus(campus);
        return;
      }
    }
    
    // If no campus found, prompt selection
    setIsSelecting(true);
  }, []);

  const setCampus = (slug: string) => {
    const campus = CAMPUS_REGISTRY.find(c => c.slug === slug);
    if (campus) {
      document.cookie = `x-tenant-slug=${slug}; path=/; max-age=31536000`; // 1 year
      setActiveCampus(campus);
      setIsSelecting(false);
      // Reload to apply middleware scoping correctly across the app
      window.location.reload();
    }
  };

  const autoDetectCampus = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        let closestCampus = CAMPUS_REGISTRY[0];
        let minDistance = Infinity;

        CAMPUS_REGISTRY.forEach(campus => {
          if (campus.slug === 'global') return;
          const dist = getDistanceFromLatLonInM(latitude, longitude, campus.coordinates.latitude, campus.coordinates.longitude);
          if (dist < minDistance) {
            minDistance = dist;
            closestCampus = campus;
          }
        });

        if (minDistance <= closestCampus.radiusMeters * 2) { // Give some buffer
          setCampus(closestCampus.slug);
        } else {
          alert("You are not near any supported campus. Defaulting to Global Guest Network.");
          setCampus('global');
        }
      }, (error) => {
        console.error(error);
        alert("Location access denied or failed. Please select manually.");
      });
    }
  };

  const filteredCampuses = CAMPUS_REGISTRY.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.shortName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TenantContext.Provider value={{ activeCampus, setCampus, autoDetectCampus, isSelecting }}>
      {children}
      
      {isSelecting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="glass glass-card max-w-md w-full p-6 rounded-3xl animate-enter text-[var(--text-primary)]">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mx-auto flex items-center justify-center text-white text-3xl font-black mb-4 shadow-xl">
                C
              </div>
              <h2 className="text-2xl font-bold">Select Your Campus</h2>
              <p className="opacity-70 text-sm mt-2">Join your local community.</p>
            </div>

            <button 
              onClick={autoDetectCampus}
              className="w-full bg-blue-500/20 text-blue-500 font-bold py-3 px-4 rounded-2xl mb-4 hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              Auto-Detect Location
            </button>

            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Search campuses..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/10 dark:bg-white/10 rounded-2xl py-3 px-4 outline-none border border-white/5 focus:border-blue-500/50 transition-colors"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 mb-4">
              {filteredCampuses.map(campus => (
                <button
                  key={campus.id}
                  onClick={() => setCampus(campus.slug)}
                  className="w-full text-left p-4 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold">{campus.name}</div>
                    <div className="text-xs opacity-60">{campus.city}</div>
                  </div>
                  <div className="text-sm font-black text-blue-500">{campus.shortName}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
