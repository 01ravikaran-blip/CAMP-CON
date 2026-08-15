"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

interface Message {
    _id: string;
    sender: string;
    content: string;
    timestamp: string;
    room: string;
}

export default function ChatRoomPage({ params }: { params: { roomId: string } }) {
    const router = useRouter();
    const { roomId } = params; // roomId format: dm_user1_user2
    const { user: clerkUser, isLoaded } = useUser();

    // Extract other user name from roomId logic
    // We assume the current user is one of them.
    const [currentUser, setCurrentUser] = useState('');
    const [otherUser, setOtherUser] = useState('');

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isLoaded) {
            if (!clerkUser) {
                router.push('/login');
                return;
            }
            const username = clerkUser.username || clerkUser.firstName || 'Student';
            setCurrentUser(username);

            // Derive other user
            if (roomId.startsWith('dm_')) {
                const parts = roomId.replace('dm_', '').split('_');
                const other = parts.find(p => p !== username);
                if (other) setOtherUser(other);
            } else {
                setOtherUser('Chat Room');
            }
        }
    }, [isLoaded, clerkUser, roomId, router]);

    // Polling for messages
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const CHAT_URL = process.env.NODE_ENV === 'production'
                    ? 'https://camp-con-chat.onrender.com'
                    : 'http://localhost:3006';

                const res = await fetch(`${CHAT_URL}/messages/${roomId}`);
                if (res.ok) {
                    const data = await res.json();
                    // Simple check to avoid constant re-renders if no new messages
                    // In a real app, compare IDs or lengths more efficiently
                    setMessages(prev => {
                        if (prev.length !== data.length) return data;
                        return prev;
                    });
                }
            } catch (e) {
                console.error("Poll failed");
            } finally {
                setLoading(false);
            }
        };

        fetchMessages(); // Initial fetch
        const interval = setInterval(fetchMessages, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [roomId]);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const tempData = {
            sender: currentUser,
            content: inputText,
            room: roomId,
            university: clerkUser?.publicMetadata?.university,
            timestamp: new Date().toISOString()
        };

        // Optimistic update
        setMessages(prev => [...prev, { ...tempData, _id: 'temp-' + Date.now() } as Message]);
        setInputText('');

        try {
            const CHAT_URL = process.env.NODE_ENV === 'production'
                ? 'https://camp-con-chat.onrender.com'
                : 'http://localhost:3006';

            await fetch(`${CHAT_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tempData)
            });
        } catch (e) {
            alert('Failed to send');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-20"> {/* pb-20 for bottom nav space? actually chat usually hides nav or sits above */}
            {/* Header */}
            <div className="p-4 glass border-b border-[var(--border-color)] flex items-center gap-4 sticky top-0 z-10">
                <button onClick={() => router.back()} className="text-xl">←</button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center font-bold text-white">
                        {otherUser[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h2 className="font-bold">{otherUser}</h2>
                        <span className="text-xs opacity-50">Online</span>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                    const isMe = msg.sender === currentUser;
                    return (
                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${isMe
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-tl-none'
                                }`}>
                                <p>{msg.content}</p>
                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'opacity-40'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 glass border-t border-[var(--border-color)] sticky bottom-0">
                <div className="flex gap-2">
                    <input
                        className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full px-4 py-2 outline-none focus:border-blue-500 transition-colors"
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg active:scale-90 transition-transform"
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
}
