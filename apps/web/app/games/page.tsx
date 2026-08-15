"use client";

import { useState, useEffect } from 'react';
import LoadingIndicator from '../../components/LoadingIndicator';
import { useToast } from '../../components/Toast';

export default function GamesPage() {
    const { showToast } = useToast();
    const [xp, setXp] = useState(120);
    const [level, setLevel] = useState(2);
    const [spinning, setSpinning] = useState(false);
    const [activeTab, setActiveTab] = useState<'arcade' | 'challenges' | 'redeem'>('arcade');
    const [lastSpin, setLastSpin] = useState<number | null>(null);

    useEffect(() => {
        const storedXp = localStorage.getItem('user_xp');
        if (storedXp) setXp(parseInt(storedXp));

        const storedLastSpin = localStorage.getItem('last_spin_time');
        if (storedLastSpin) setLastSpin(parseInt(storedLastSpin));
    }, []);

    const canSpin = () => {
        if (!lastSpin) return true;
        const now = Date.now();
        const diff = now - lastSpin;
        return diff > 24 * 60 * 60 * 1000; // 24 hours
    };

    const handleSpin = () => {
        if (spinning) return;
        if (!canSpin()) {
            const nextSpin = new Date(lastSpin! + 24 * 60 * 60 * 1000);
            showToast(`Next spin available at ${nextSpin.toLocaleTimeString()}`, 'warning');
            return;
        }

        setSpinning(true);
        setTimeout(() => {
            const reward = Math.floor(Math.random() * 50) + 10;
            const newXp = xp + reward;
            setXp(newXp);
            setSpinning(false);
            setLastSpin(Date.now());

            localStorage.setItem('user_xp', newXp.toString());
            localStorage.setItem('last_spin_time', Date.now().toString());

            showToast(`🎉 You won ${reward} XP! It has been added to your ledger.`, 'success');
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-500 p-4 pb-24 text-[var(--text-primary)]">
            <header className="flex justify-between items-center mb-6 pt-4 px-2">
                <h1 className="text-3xl font-extrabold tracking-tight">Campus Games</h1>
                <div className="px-4 py-1.5 rounded-full glass bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 font-bold text-sm border border-blue-500/10">
                    LVL {level} • {xp} XP
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-8 bg-black/5 dark:bg-white/5 p-1 rounded-2xl mx-2">
                <button
                    onClick={() => setActiveTab('arcade')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'arcade' ? 'bg-white shadow-lg text-black dark:bg-white/10 dark:text-white' : 'opacity-50 hover:opacity-100'}`}
                >
                    Arcade 🕹️
                </button>
                <button
                    onClick={() => setActiveTab('challenges')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'challenges' ? 'bg-white shadow-lg text-black dark:bg-white/10 dark:text-white' : 'opacity-50 hover:opacity-100'}`}
                >
                    Challenges 🤺
                </button>
                <button
                    onClick={() => setActiveTab('redeem')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'redeem' ? 'bg-white shadow-lg text-black dark:bg-white/10 dark:text-white' : 'opacity-50 hover:opacity-100'}`}
                >
                    Redeem 🎁
                </button>
            </div>

            {activeTab === 'arcade' ? (
                <div className="animate-enter px-2 space-y-8">
                    {/* Daily Spin */}
                    <div className="glass glass-card p-10 flex flex-col items-center bg-gradient-to-b from-blue-600/5 to-transparent relative overflow-hidden group">
                        <div className="text-center mb-10 z-10">
                            <h3 className="text-2xl font-black mb-1">Daily Lucky Spin</h3>
                            <p className="text-sm opacity-50">Win free XP every 24 hours</p>
                        </div>

                        <div className="relative w-40 h-40 flex items-center justify-center mb-10 z-10">
                            <div className={`transition-all duration-700 ${spinning ? 'scale-110' : 'scale-100'}`}>
                                {spinning ? (
                                    <LoadingIndicator size="lg" color="#3b82f6" />
                                ) : (
                                    <div className="w-32 h-32 rounded-full glass flex items-center justify-center text-5xl shadow-2xl border-white/20">
                                        💎
                                    </div>
                                )}
                            </div>
                            {/* Decorative ring */}
                            <div className="absolute inset-0 border-2 border-dashed border-blue-500/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
                        </div>

                        <button
                            onClick={handleSpin}
                            disabled={spinning || !canSpin()}
                            className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[22px] font-black text-white shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all z-10 btn-premium"
                        >
                            {spinning ? 'GENERATING WIN...' : !canSpin() ? 'COME BACK TOMORROW ⏳' : 'SPIN FOR XP 💎'}
                        </button>
                        {!canSpin() && (
                            <p className="mt-4 text-[10px] opacity-40 uppercase tracking-widest font-bold">1 Spin Per Day Limit Active</p>
                        )}
                    </div>

                    {/* Trivia Sections */}
                    <section>
                        <h3 className="font-bold text-lg mb-4 px-1 opacity-80">Campus Quests</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { title: "History 101", desc: "Test your knowledge of the founders.", reward: "+50 XP", color: "blue" },
                                { title: "Cafeteria Hotspots", desc: "Guess the busiest spot on Tuesdays.", reward: "+20 XP", color: "purple" }
                            ].map((game, i) => (
                                <div key={i} className="glass p-5 rounded-2xl flex justify-between items-center hover:bg-white/5 cursor-pointer border border-white/5 transition-all active:scale-[0.98]">
                                    <div>
                                        <h4 className={`font-bold text-${game.color}-500 mb-1`}>{game.title}</h4>
                                        <p className="text-sm opacity-50">{game.desc}</p>
                                    </div>
                                    <div className="bg-white/10 px-3 py-1.5 rounded-lg text-xs font-bold">{game.reward}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            ) : activeTab === 'challenges' ? (
                <div className="animate-enter px-2 space-y-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-2xl relative overflow-hidden mb-8">
                        <div className="z-10 relative">
                            <h2 className="text-2xl font-black mb-2">Battle Real Users</h2>
                            <p className="text-white/80 text-sm mb-4 max-w-[200px]">Challenge your friends to earn double XP and campus rank!</p>
                            <button className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-bold shadow-lg hover:px-8 transition-all">
                                START SEARCHING 🔍
                            </button>
                        </div>
                        <div className="absolute top-[-20px] right-[-20px] text-8xl opacity-20 rotate-12">⚔️</div>
                    </div>

                    <h3 className="font-bold text-lg mb-4 opacity-80">Active Challenges</h3>
                    <div className="space-y-4">
                        {[
                            { name: "Rahul Singh", rank: "Pro", status: "Invite Sent", action: "Resend" },
                            { name: "Priya Sharma", rank: "Novice", status: "Challenged You", action: "Accept" },
                            { name: "Amit Kumar", rank: "Elite", status: "In Game", action: "Spectate" }
                        ].map((user, i) => (
                            <div key={i} className="glass p-4 rounded-2xl flex items-center gap-4 border border-white/5">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center font-bold">
                                    {user.name[0]}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm">{user.name} <span className="opacity-40 font-normal text-xs ml-2">[{user.rank}]</span></h4>
                                    <p className="text-xs opacity-50 text-blue-400">{user.status}</p>
                                </div>
                                <button className="px-4 py-1.5 rounded-lg bg-white/10 text-xs font-black hover:bg-white/20 transition-all">
                                    {user.action.toUpperCase()}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="animate-enter px-2 space-y-8">
                    <div className="glass p-8 rounded-[32px] bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                        <h3 className="text-2xl font-black mb-2 text-green-500">Rewards Shop</h3>
                        <p className="text-sm opacity-60 mb-6">Exchange your earned XP for real campus perks.</p>

                        <div className="space-y-4">
                            {[
                                { item: "Free Campus Coffee", cost: "500 XP", icon: "☕", available: xp >= 500 },
                                { item: "Library Prime Seat", cost: "1000 XP", icon: "📚", available: xp >= 1000 },
                                { item: "Cafeteria Voucher ($5)", cost: "2500 XP", icon: "🍕", available: xp >= 2500 },
                                { item: "VIP Event Pass", cost: "5000 XP", icon: "🎟️", available: xp >= 5000 },
                            ].map((reward, i) => (
                                <div key={i} className={`p-4 rounded-2xl glass border border-white/5 flex justify-between items-center ${reward.available ? 'opacity-100' : 'opacity-40'}`}>
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl">{reward.icon}</span>
                                        <div>
                                            <h4 className="font-bold">{reward.item}</h4>
                                            <p className="text-xs text-blue-400 font-bold">{reward.cost}</p>
                                        </div>
                                    </div>
                                    <button
                                        disabled={!reward.available}
                                        onClick={() => showToast(`Voucher for ${reward.item} generated! Check your email.`, 'success')}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${reward.available ? 'bg-green-500 text-white shadow-lg' : 'bg-white/10 cursor-not-allowed'}`}
                                    >
                                        REDEEM
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
