'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Clock, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '../../../components/Toast';
import { useRouter } from 'next/navigation';

const QUESTIONS = [
  { q: 'Which department has the most students?', options: ['CSE', 'Mechanical', 'BioTech', 'Civil'], a: 0 },
  { q: 'What year was the university established?', options: ['1998', '2005', '2012', '2018'], a: 2 },
  { q: 'Where is the main library located?', options: ['Block A', 'Block C', 'Block E', 'Block G'], a: 1 },
];

export default function TriviaGame() {
  const [gameState, setGameState] = useState<'WAGER' | 'PLAY' | 'END'>('WAGER');
  const [wagerAmount, setWagerAmount] = useState(10);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (gameState !== 'PLAY') return;
    
    if (timeLeft === 0) {
      handleAnswer(-1); // Timeout
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  const handleAnswer = (selectedIndex: number) => {
    if (selectedIndex === QUESTIONS[currentQIndex].a) {
      setScore(prev => prev + 1);
      showToast('Correct!', 'success');
    } else {
      showToast('Wrong!', 'error');
    }

    if (currentQIndex + 1 < QUESTIONS.length) {
      setCurrentQIndex(prev => prev + 1);
      setTimeLeft(10);
    } else {
      endGame(score + (selectedIndex === QUESTIONS[currentQIndex].a ? 1 : 0));
    }
  };

  const endGame = async (finalScore: number) => {
    setGameState('END');
    const isWin = finalScore === QUESTIONS.length;
    
    try {
      await fetch('/api/games/wager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: 'TRIVIA',
          wagerAmount,
          currency: 'ENERGY',
          outcome: isWin ? 'WIN' : 'LOSS',
          multiplier: 1.5
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4 flex flex-col items-center">
      <div className="max-w-md w-full bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-2xl">
        
        <AnimatePresence mode="wait">
          {gameState === 'WAGER' && (
            <motion.div key="wager" exit={{ opacity: 0, scale: 0.9 }}>
              <div className="text-center mb-8">
                <Brain className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h1 className="text-2xl font-black">Campus Trivia</h1>
                <p className="text-gray-500 text-sm mt-2">Answer 3 questions correctly to win 1.5x your wager.</p>
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
                onClick={() => { setGameState('PLAY'); setTimeLeft(10); }}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg"
              >
                Start Game
              </button>
            </motion.div>
          )}

          {gameState === 'PLAY' && (
            <motion.div key="play" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-bold text-gray-500">Q {currentQIndex + 1} of {QUESTIONS.length}</span>
                <div className="flex items-center gap-2 text-red-500 font-bold">
                  <Clock size={16} /> {timeLeft}s
                </div>
              </div>

              <h2 className="text-xl font-bold mb-8 leading-tight">{QUESTIONS[currentQIndex].q}</h2>

              <div className="space-y-3">
                {QUESTIONS[currentQIndex].options.map((opt, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className="w-full text-left p-4 rounded-xl border border-black/10 dark:border-white/10 hover:bg-blue-500 hover:text-white hover:border-transparent transition-colors font-medium"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {gameState === 'END' && (
            <motion.div key="end" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              {score === QUESTIONS.length ? (
                <>
                  <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-black text-green-500 mb-2">You Won!</h2>
                  <p className="text-gray-500 mb-8">+{Math.floor(wagerAmount * 1.5)} ⚡ Energy added to your balance.</p>
                </>
              ) : (
                <>
                  <XCircle className="w-24 h-24 text-red-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-black text-red-500 mb-2">Game Over</h2>
                  <p className="text-gray-500 mb-8">You scored {score}/{QUESTIONS.length}. You lost {wagerAmount} ⚡ Energy.</p>
                </>
              )}

              <div className="space-y-4">
                <button onClick={() => { setGameState('WAGER'); setCurrentQIndex(0); setScore(0); }} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl">Play Again</button>
                <button onClick={() => router.push('/games/leaderboard')} className="w-full py-4 bg-black/5 dark:bg-white/10 font-bold rounded-xl">View Leaderboard</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
