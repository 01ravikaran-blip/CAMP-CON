"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';

export default function SettingsPage() {
    const router = useRouter();
    const { signOut } = useClerk();
    const [search, setSearch] = useState(''); // NEW
    const [settings, setSettings] = useState({
        ghost_mode: false,
        notifications: true,
        nsfw_filter: true,
        dark_mode: true
    });

    useEffect(() => {
        // Load from local or API
        const saved = localStorage.getItem('settings');
        if (saved) setSettings(JSON.parse(saved));
    }, []);

    const toggle = (key: keyof typeof settings) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);
        localStorage.setItem('settings', JSON.stringify(newSettings));
    };

    // Filter Logic
    const showPrivacy = "Privacy & Safety".toLowerCase().includes(search.toLowerCase()) ||
        "Ghost Mode".toLowerCase().includes(search.toLowerCase()) ||
        "NSFW Filter".toLowerCase().includes(search.toLowerCase());

    const showAccount = "Account".toLowerCase().includes(search.toLowerCase()) ||
        "Change Password".toLowerCase().includes(search.toLowerCase()) ||
        "Delete Account".toLowerCase().includes(search.toLowerCase());

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-4 pb-24 text-[var(--text-primary)]">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-xl">←</button>
                    <h1 className="text-2xl font-bold">Settings ⚙️</h1>
                </div>
                {/* Search Bar */}
                <div className="relative">
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search settings..."
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full p-3 pl-10 outline-none focus:bg-[var(--bg-secondary)] focus:border-[var(--accent)] transition-colors text-[var(--text-primary)]"
                    />
                    <span className="absolute left-3 top-3 text-[var(--text-secondary)]">🔍</span>
                </div>
            </div>

            <div className="space-y-6">
                {/* Privacy Section */}
                {showPrivacy && (
                    <div>
                        <h2 className="text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase">Privacy & Safety</h2>
                        <div className="glass rounded-xl overflow-hidden border border-[var(--border-color)]">
                            <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]">
                                <div>
                                    <h3 className="font-bold">Ghost Mode 👻</h3>
                                    <p className="text-xs text-[var(--text-secondary)]">Hide your location on the map</p>
                                </div>
                                <button
                                    onClick={() => toggle('ghost_mode')}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${settings.ghost_mode ? 'bg-purple-600' : 'bg-[var(--bg-tertiary)]'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.ghost_mode ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="p-4 flex justify-between items-center bg-[var(--bg-secondary)]">
                                <div>
                                    <h3 className="font-bold">NSFW Filter 🛡️</h3>
                                    <p className="text-xs text-[var(--text-secondary)]">Blur sensitive content</p>
                                </div>
                                <button
                                    onClick={() => toggle('nsfw_filter')}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${settings.nsfw_filter ? 'bg-green-500' : 'bg-[var(--bg-tertiary)]'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.nsfw_filter ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Account Section */}
                {showAccount && (
                    <div>
                        <h2 className="text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase">Account</h2>
                        <div className="glass rounded-xl overflow-hidden border border-[var(--border-color)]">
                            <button className="w-full text-left font-bold flex justify-between p-4 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors">
                                Change Password <span>›</span>
                            </button>
                            <button className="w-full text-left font-bold flex justify-between p-4 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors">
                                Verification Status <span className="text-green-500">Verified ✓</span>
                            </button>
                            <button onClick={() => router.push('/settings/archive')} className="w-full text-left font-bold flex justify-between p-4 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors">
                                Archived Posts <span>›</span>
                            </button>
                            <button className="w-full text-left font-bold text-red-500 p-4 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                                Delete Account
                            </button>
                        </div>
                    </div>
                )}

                <div className="pt-6 mt-6 border-t border-[var(--border-color)]">
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to log out?')) {
                                signOut().then(() => router.push('/login'));
                            }
                        }}
                        className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors"
                    >
                        Log Out
                    </button>
                    <p className="text-center text-xs opacity-40 mt-4">CAMP-CON v1.0.0 • Campus Connect</p>
                </div>
            </div>
        </div>
    );
}
