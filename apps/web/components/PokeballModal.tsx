'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PokeballModal({ 
  isOpen, 
  onClose, 
  targetUser, 
  targetId 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  targetUser: string,
  targetId: string 
}) {
  const [costData, setCostData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [throwing, setThrowing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen && targetId) {
      setLoading(true);
      fetch(`/api/social/cost?targetUserId=${targetId}`)
        .then(res => res.json())
        .then(data => {
          setCostData(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, targetId]);

  const handleThrow = async () => {
    setThrowing(true);
    try {
      const res = await fetch('/api/social/throw-pokeball', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: targetId,
          initialMessage: message
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Wait a moment for animation
      setTimeout(() => {
        alert('Pokéball caught successfully!');
        onClose();
        setThrowing(false);
      }, 1000);
    } catch (e: any) {
      alert(e.message || 'Throw failed');
      setThrowing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-red-500 to-red-400 rounded-full mx-auto mb-3 shadow-lg flex items-center justify-center border-4 border-white/10">
            <span className="text-2xl">🔴</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Throw Pokéball</h2>
          <p className="text-gray-400 text-sm">Target: <span className="font-semibold text-white">{targetUser}</span></p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Calculating connection cost...</div>
        ) : costData?.error ? (
          <div className="text-center py-8 text-red-400 text-sm">{costData.error}</div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-400">Target Rank</span>
                <span className="text-purple-400 font-bold">Top {costData?.targetRank}</span>
              </div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-400">Energy Cost</span>
                <span className="text-yellow-400 font-bold">{costData?.finalCost} ⚡</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
                <span className="text-gray-400">Your Energy</span>
                <span className={costData?.requesterEnergy >= costData?.finalCost ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                  {costData?.requesterEnergy} ⚡
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Initial Pitch (Optional)</label>
              <textarea 
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Say hi..."
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                rows={2}
              />
              <p className="text-[10px] text-gray-500 mt-1">First message of the month is FREE. Extra pitches cost 15 ⚡</p>
            </div>

            <button
              onClick={handleThrow}
              disabled={throwing || costData?.requesterEnergy < costData?.finalCost}
              className="w-full py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-xl text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              {throwing ? (
                <motion.div 
                  animate={{ x: [0, 100, 200] }} 
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute inset-0 flex items-center justify-center text-2xl"
                >
                  🔴
                </motion.div>
              ) : (
                "Throw Pokéball"
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
