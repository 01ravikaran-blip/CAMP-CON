'use client';

import { useEffect, useRef } from 'react';

export function useComputeNode() {
  const lastPulse = useRef<number>(Date.now());
  
  useEffect(() => {
    // Ping interval: 15 minutes
    const PING_INTERVAL_MS = 15 * 60 * 1000;
    let timeoutId: NodeJS.Timeout;

    const pingComputeNode = async () => {
      // Only ping if the document is visible to ensure active presence
      if (document.visibilityState === 'visible') {
        try {
          await fetch('/api/energy/compute-pulse', { method: 'POST' });
          lastPulse.current = Date.now();
        } catch (e) {
          console.error('Failed to pulse compute node', e);
        }
      }
      
      timeoutId = setTimeout(pingComputeNode, PING_INTERVAL_MS);
    };

    timeoutId = setTimeout(pingComputeNode, PING_INTERVAL_MS);

    // Also ping when tab becomes visible if it's been more than the interval
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastPulse = Date.now() - lastPulse.current;
        if (timeSinceLastPulse >= PING_INTERVAL_MS) {
          clearTimeout(timeoutId);
          pingComputeNode();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
