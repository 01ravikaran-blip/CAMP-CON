'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Timer, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '../../../components/Toast';

export default function ReactionGame() {
  const [gameState, setGameState] = useState<'WAGER' | 'WAITING' | 'READY' | 'END'>('WAGER');
  const [wagerAmount, setWagerAmount] = useState(10);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const { showToast } = useToast();
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startGame = () => {
    setGameState('WAITING');
    // Random delay between 2 and 6 seconds
    const delay = Math.floor(Math.random() * 4000) + 2000;
    
    timeoutRef.current = setTimeout(() => {
      setGameState('READY');
      startTimeRef.current = Date.now();
    }, delay);
  };

  const handleTap = async () => {
    if (gameState === 'WAITING') {
      // Tapped too early
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setGameState('END');
      setReactionTime(null);
      await processWager(false, 0);
    } else if (gameState === 'READY') {
      // Valid tap
      const timeTaken = Date.now() - startTimeRef.current;
      setReactionTime(timeTaken);
      setGameState('END');
      
      const isWin = timeTaken < 300; // Win if < 300ms
      let multiplier = 0;
      if (timeTaken < 200) multiplier = 3.0; // God tier
      else if (timeTaken < 250) multiplier = 2.0; // Great
      else if (timeTaken < 300) multiplier = 1.2; // Good
      
      await processWager(isWin, multiplier);
    }
  };

  const processWager = async (isWin: boolean, multiplier: number) => {
    try {
      const res = await fetch('/api/games/wager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: 'REACTION',
          wagerAmount,
          currency: 'ENERGY',
          outcome: isWin ? 'WIN' : 'LOSS',
          multiplier: isWin ? multiplier : 1
        })
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.error || 'Failed to process wager', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4 flex flex-col items-center">
      <div className="max-w-md w-full bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
        
        <AnimatePresence mode="wait">
          {gameState === 'WAGER' && (
            <motion.div key="wager" exit={{ opacity: 0, scale: 0.9 }}>
              <div className="text-center mb-8">
                <Timer className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h1 className="text-2xl font-black">Reaction Tap</h1>
                <p className="text-gray-500 text-sm mt-2">Wait for Green, then tap as fast as possible. &lt; 300ms wins.</p>
              </div>

              <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-6 mb-8 text-center">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Wager Energy</h3>
                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => setWagerAmount(Math.max(10, wagerAmount - 10))} className="w-10 h-10 rounded-full bg-white dark:bg-black font-bold text-xl">-</button>
                  <span className="text-4xl font-black">{wagerAmount} ⚡</span>
                  <button onClick={() => setWagerAmount(Math.min(50, wagerAmount + 10))} className="w-10 h-10 rounded-full bg-white dark:bg-black font-bold text-xl">+</button>
                </div>
              </div>

              <button 
                onClick={startGame}
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold text-lg"
              >
                Place Wager & Ready
              </button>
            </motion.div>
          )}

          {gameState === 'WAITING' && (
            <motion.div 
              key="waiting" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={handleTap}
              className="absolute inset-0 bg-red-500 flex items-center justify-center cursor-pointer"
            >
              <h2 className="text-4xl font-black text-white text-center">Wait...</h2>
            </motion.div>
          )}

          {gameState === 'READY' && (
            <motion.div 
              key="ready" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={handleTap}
              className="absolute inset-0 bg-green-500 flex items-center justify-center cursor-pointer"
            >
              <h2 className="text-5xl font-black text-white text-center">TAP NOW!</h2>
            </motion.div>
          )}

          {gameState === 'END' && (
            <motion.div key="end" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              {!reactionTime ? (
                <>
                  <XCircle className="w-24 h-24 text-red-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-black text-red-500 mb-2">Too Early!</h2>
                  <p className="text-gray-500 mb-8">You tapped before Green. You lost {wagerAmount} ⚡ Energy.</p>
                </>
              ) : reactionTime < 300 ? (
                <>
                  <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-black text-green-500 mb-2">{reactionTime} ms</h2>
                  <p className="text-gray-500 mb-8">Godlike reflexes! Wager multiplied.</p>
                </>
              ) : (
                <>
                  <XCircle className="w-24 h-24 text-red-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-black text-red-500 mb-2">{reactionTime} ms</h2>
                  <p className="text-gray-500 mb-8">Too slow! Must be &lt; 300ms. You lost {wagerAmount} ⚡ Energy.</p>
                </>
              )}

              <div className="space-y-4">
                <button onClick={() => setGameState('WAGER')} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl">Try Again</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
