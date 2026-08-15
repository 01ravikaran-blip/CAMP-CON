"use client";

import { useState } from 'react';

export default function AgentPage() {
    const [messages, setMessages] = useState<{ role: 'user' | 'agent', content: string }[]>([
        { role: 'agent', content: "Hi! I'm your Campus AI Assistant. I can help you find events, navigate the map, or answer questions about the university. How can I help?" }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;

        // Add User Message
        const newMessages = [...messages, { role: 'user' as const, content: input }];
        setMessages(newMessages);
        setInput('');

        // Simulate AI Response (Mock Logic)
        setTimeout(() => {
            let reply = "I'm simpler than I look! Try asking about 'events' or 'map'.";
            const lowerInput = input.toLowerCase();

            if (lowerInput.includes('event')) reply = "You can check out upcoming events on the Events tab! There's a Hackathon coming up.";
            if (lowerInput.includes('map') || lowerInput.includes('where')) reply = "Open the Map tab (🌍) to find your way around campus. Use the ghost mode if you want privacy!";
            if (lowerInput.includes('sell') || lowerInput.includes('market')) reply = "Head to the Marketplace (🏪) to list your items or find great deals.";
            if (lowerInput.includes('food') || lowerInput.includes('hungry')) reply = "The main cafeteria is open until 10 PM today.";

            setMessages(prev => [...prev, { role: 'agent' as const, content: reply }]);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col pb-20">
            {/* Header */}
            <div className="p-4 border-b border-white/10 glass sticky top-0 z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xl">🤖</div>
                <div>
                    <h1 className="font-bold">Campus Agent</h1>
                    <p className="text-xs text-green-400">● Online</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white/10 text-gray-800 dark:text-gray-200 rounded-bl-none'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="p-4 glass border-t border-white/10">
                <div className="flex gap-2">
                    <input
                        className="flex-1 bg-white/50 dark:bg-white/10 p-3 rounded-xl outline-none"
                        placeholder="Ask anything..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        className="p-3 bg-cyan-500 rounded-xl text-white hover:opacity-80"
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
}
