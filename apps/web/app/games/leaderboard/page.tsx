'use client';

import { useState } from 'react';
import { Trophy, Medal, Star, Target, Users } from 'lucide-react';

const MOCK_DEPARTMENTS = [
  { id: 'CSE', name: 'Computer Science', points: 15420, players: 450 },
  { id: 'MECH', name: 'Mechanical', points: 12100, players: 380 },
  { id: 'ECE', name: 'Electronics', points: 10500, players: 310 },
  { id: 'CIVIL', name: 'Civil', points: 8900, players: 290 },
];

const MOCK_PLAYERS = [
  { id: '1', name: 'Alex M.', dept: 'CSE', points: 3400, rank: 1 },
  { id: '2', name: 'Sarah K.', dept: 'MECH', points: 3100, rank: 2 },
  { id: '3', name: 'Rahul D.', dept: 'CSE', points: 2950, rank: 3 },
  { id: '4', name: 'Priya S.', dept: 'ECE', points: 2800, rank: 4 },
];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'DEPARTMENTS' | 'PLAYERS'>('DEPARTMENTS');

  return (
    <div className="min-h-screen pt-24 pb-24 px-4 max-w-4xl mx-auto">
      
      <div className="text-center mb-12">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-4xl font-black tracking-tight">Campus Leaderboards</h1>
        <p className="text-gray-500 mt-2">Compete in mini-games to earn points for your department.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-black/5 dark:bg-white/5 rounded-2xl p-1 mb-8 max-w-sm mx-auto">
        <button 
          onClick={() => setTab('DEPARTMENTS')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${tab === 'DEPARTMENTS' ? 'bg-white dark:bg-black shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
        >
          Departments
        </button>
        <button 
          onClick={() => setTab('PLAYERS')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${tab === 'PLAYERS' ? 'bg-white dark:bg-black shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
        >
          Top Players
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {tab === 'DEPARTMENTS' && MOCK_DEPARTMENTS.map((dept, idx) => (
          <div key={dept.id} className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl p-6 flex items-center shadow-sm">
            <div className="w-12 text-center font-black text-2xl text-gray-400">#{idx + 1}</div>
            
            <div className="flex-1 px-4">
              <h3 className="text-xl font-bold">{dept.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <Users size={14} /> {dept.players} active players
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-blue-500">{dept.points.toLocaleString()}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Points</div>
            </div>
          </div>
        ))}

        {tab === 'PLAYERS' && MOCK_PLAYERS.map((player) => (
          <div key={player.id} className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl p-6 flex items-center shadow-sm">
            <div className="w-12 text-center">
              {player.rank === 1 ? <Medal className="w-8 h-8 text-yellow-500 mx-auto" /> : 
               player.rank === 2 ? <Medal className="w-8 h-8 text-gray-400 mx-auto" /> : 
               player.rank === 3 ? <Medal className="w-8 h-8 text-amber-600 mx-auto" /> : 
               <span className="font-black text-xl text-gray-400">#{player.rank}</span>}
            </div>
            
            <div className="flex-1 px-4">
              <h3 className="text-lg font-bold">{player.name}</h3>
              <div className="text-sm font-medium px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded-md inline-block mt-1">
                {player.dept}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-black">{player.points.toLocaleString()} ⚡</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
