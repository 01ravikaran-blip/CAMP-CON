"use client";

import { useState, useRef, useEffect } from 'react';

type Message = {
    id: number;
    role: 'user' | 'ai';
    text: string;
};

const INITIAL_MESSAGES: Message[] = [
    { id: 1, role: 'ai', text: "Hi! I'm Campus Genius 🧠. I can help you with verification, finding events, or safety issues. How can I help today?" }
];

export default function AIAssistantPage() {
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Mock AI Delay & Logic
        setTimeout(() => {
            let aiResponseText = "I'm not sure about that. Try asking about 'verification' or 'events'.";

            const lowerInput = userMsg.text.toLowerCase();
            if (lowerInput.includes("verify") || lowerInput.includes("id")) {
                aiResponseText = "To verify, go to the Verification tab and upload a photo of your Student ID card. Make sure the text is clear!";
            } else if (lowerInput.includes("event") || lowerInput.includes("party")) {
                aiResponseText = "There is a 'Star Night' event happening this Friday at the Main Audi. Check the Feed for details!";
            } else if (lowerInput.includes("safe") || lowerInput.includes("report")) {
                aiResponseText = "Your safety is priority. You can report users via the Safety Center or by tapping the three dots on any post.";
            }

            const aiMsg: Message = { id: Date.now() + 1, role: 'ai', text: aiResponseText };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-black">

            {/* Header */}
            <header className="glass p-4 text-center z-10">
                <h1 className="font-bold text-lg">Campus Genius 🤖</h1>
                <p className="text-xs opacity-60">AI Support Assistant</p>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] p-3 rounded-2xl shadow-sm animate-enter ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white dark:bg-gray-800 rounded-bl-none'
                                }`}
                        >
                            <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-bl-none shadow-sm">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 glass pb-8">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask anything..."
                        className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-3 outline-none focus:ring-2 ring-blue-500 transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-transform"
                    >
                        ↑
                    </button>
                </div>
            </div>

        </div>
    );
}
