"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function ChatListPage() {
    const router = useRouter();
    const { user: clerkUser, isLoaded } = useUser();
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChats = async () => {
            if (!isLoaded || !clerkUser) return;
            const username = clerkUser.username || clerkUser.firstName || 'Student';

            try {
                const CHAT_URL = process.env.NODE_ENV === 'production'
                    ? 'https://camp-con-chat.onrender.com'
                    : 'http://localhost:3006';

                const university = clerkUser?.publicMetadata?.university;
                let url = `${CHAT_URL}/chats/${username}`;
                if (university) {
                    url += `?university=${encodeURIComponent(university as string)}`;
                }

                const res = await fetch(url);
                const data = await res.json();
                if (Array.isArray(data)) setChats(data);
            } catch (e) {
                console.error("Failed to fetch chats");
            } finally {
                setLoading(false);
            }
        };
        fetchChats();
    }, [isLoaded, clerkUser]);

    const username = clerkUser?.username || clerkUser?.firstName || 'Student';

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 pb-24">
            <h1 className="text-2xl font-bold mb-6">Messages 💬</h1>

            {loading ? (
                <div className="text-center opacity-50 mt-10">Loading chats...</div>
            ) : chats.length === 0 ? (
                <div className="text-center opacity-50 mt-10">
                    <p>No messages yet.</p>
                    <p className="text-sm mt-2">Visit a profile to start a chat!</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => router.push(`/chat/${chat.id}`)}
                            className="glass p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 active:scale-[0.98] transition-all cursor-pointer border border-[var(--border-color)]"
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                {chat.name[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-sm truncate">{chat.name}</h3>
                                    <span className="text-[10px] opacity-50 whitespace-nowrap ml-2">
                                        {chat.time ? new Date(chat.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </div>
                                <p className={`text-xs mt-1 truncate ${chat.unread ? 'font-bold' : 'opacity-60'}`}>
                                    {chat.sender === username ? 'You: ' : ''}{chat.lastMsg}
                                </p>
                            </div>
                            {chat.unread && (
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
