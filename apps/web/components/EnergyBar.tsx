'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Trophy } from 'lucide-react';

export default function EnergyBar({ initialEnergy = 100, maxEnergy = 100, rank = 'Batch 1' }) {
  const [energy, setEnergy] = useState(initialEnergy);
  const [nextRefill, setNextRefill] = useState(60 * 60); // 1 hour in seconds
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setNextRefill((prev) => {
        if (prev <= 0) {
          setEnergy((e) => Math.min(e + 5, maxEnergy)); // Regenerate 5 per hour
          return 3600;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [maxEnergy]);

  const percentage = Math.min(100, Math.max(0, (energy / maxEnergy) * 100));
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      className="relative flex items-center gap-3 bg-gray-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-gray-800 cursor-pointer"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
        <Zap size={18} className="fill-yellow-400" />
        <span className="min-w-[30px] text-center">{energy}</span>
      </div>

      <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {showTooltip && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute top-full mt-3 right-0 w-48 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl text-xs z-50 pointer-events-none"
        >
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-800">
            <span className="text-gray-400">Current Energy</span>
            <span className="font-mono font-bold text-yellow-400">{energy} / {maxEnergy}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Next Refill (+5)</span>
            <span className="font-mono text-gray-200">{formatTime(nextRefill)}</span>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-gray-800 mt-2 text-purple-400">
            <Trophy size={14} />
            <span className="font-semibold">Rank: {rank}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
