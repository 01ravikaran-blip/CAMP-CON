"use client";

import { useState, useEffect } from 'react';
import { useToast } from './Toast';

export default function MessengerBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const fetchChats = async () => {
        const user = localStorage.getItem('user');
        if (!user) return;
        const username = JSON.parse(user).username;

        setLoading(true);
        try {
            const CHAT_URL = process.env.NODE_ENV === 'production'
                ? 'https://camp-con-chat.onrender.com'
                : 'http://localhost:3006';
            const res = await fetch(`${CHAT_URL}/chats/${username}`);
            if (res.ok) {
                const data = await res.json();
                setChats(data);
            }
        } catch (e) {
            console.error("Messenger error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchChats();
        }
    }, [isOpen]);

    return (
        <div className={`fixed bottom-24 right-6 z-[100] transition-all duration-300 ${isOpen ? 'w-80 h-[500px]' : 'w-16 h-16'}`}>
            {isOpen ? (
                <div className="w-full h-full glass-premium rounded-[32px] shadow-2xl border border-white/20 flex flex-col overflow-hidden animate-enter">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h2 className="font-black text-sm uppercase tracking-widest">Messages</h2>
                        <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loading && <div className="text-center py-10 opacity-50 text-xs">Loading conversations...</div>}
                        {!loading && chats.length === 0 && (
                            <div className="text-center py-10 opacity-50 text-xs flex flex-col items-center gap-2">
                                <span className="text-3xl">🏜️</span>
                                No active chats yet.
                            </div>
                        )}
                        {chats.map((chat, i) => (
                            <div
                                key={i}
                                onClick={() => window.location.href = `/chat/${chat.id}`}
                                className="flex gap-3 p-3 rounded-2xl glass hover:bg-white/10 cursor-pointer transition-all active:scale-[0.98] border border-white/5"
                            >
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500/20 to-purple-500/20 flex items-center justify-center font-bold text-xs">
                                    {chat.name[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-xs truncate">{chat.name}</h4>
                                        <span className="text-[10px] opacity-40 font-bold whitespace-nowrap ml-2">
                                            {chat.time ? new Date(chat.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <p className="text-[10px] opacity-60 truncate">{chat.lastMsg || 'Tap to chat'}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-white/5 border-t border-white/10 text-center">
                        <button
                            onClick={() => window.location.href = '/chat'}
                            className="text-[10px] font-black uppercase text-blue-400 hover:text-blue-300"
                        >
                            View All Messages
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl border-2 border-white/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative"
                >
                    <span className="text-2xl group-hover:rotate-12 transition-transform">💬</span>
                    {chats.some(c => c.unread) && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-[var(--bg-primary)] text-[10px] flex items-center justify-center font-bold">!</span>
                    )}
                </button>
            )}
        </div>
    );
}
