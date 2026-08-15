'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';

export default function ChatPage({ params }: { params: { id: string } }) {
  const { user: clerkUser } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [connection, setConnection] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const unwrappedParams = params; // Next 15 params promise handling if needed, simplified here

  useEffect(() => {
    // In a real app, this would fetch from /api/chat/[id]/messages
    // For this implementation, we will mock the initial state and rely on real-time updates when messages are sent.
    setConnection({
      id: unwrappedParams.id,
      requesterMsgCount: 3,
      targetMsgCount: 4,
      isPermanent: false,
      chatExpiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
    });

    // Fetch Initial State
    const fetchInitial = async () => {
      try {
        const res = await fetch(`/api/chat/${unwrappedParams.id}/messages`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages) setMessages(data.messages);
          if (data.connectionStatus) setConnection(data.connectionStatus);
        }
      } catch (e) {
        console.error("Failed to fetch initial messages");
      }
    };
    fetchInitial();

    // Live Message Streaming (SSE)
    const eventSource = new EventSource(`/api/realtime?topics=chat:${unwrappedParams.id}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message') {
          setMessages(prev => {
            // Deduplicate to avoid rendering both optimistic and server message
            if (prev.some(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          if (data.connectionStatus) {
            setConnection(data.connectionStatus);
          }
        } else if (data.type === 'reciprocity_unlocked') {
          setConnection((prev: any) => ({ ...prev, isPermanent: true }));
        }
      } catch (err) {
        console.error("Error parsing SSE data", err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [unwrappedParams.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    setSending(true);

    try {
      const res = await fetch(`/api/chat/${unwrappedParams.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputText })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      setMessages([...messages, data.message]);
      setConnection((prev: any) => ({
        ...prev,
        ...data.connectionStatus
      }));
      setInputText('');
    } catch (e: any) {
      alert(e.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const isPermanent = connection?.isPermanent;
  const isLockedAnimation = isPermanent && connection.requesterMsgCount >= 10 && connection.targetMsgCount >= 10;

  return (
    <div className="flex flex-col h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="p-4 border-b border-gray-800 bg-gray-950 flex items-center justify-between sticky top-0 z-10">
        <h1 className="font-bold text-lg">Chat</h1>
      </header>

      {/* Dynamic Pill for 48h Reciprocity */}
      {connection && (
        <div className="sticky top-16 z-20 px-4 py-2 flex justify-center">
          <AnimatePresence mode="wait">
            {!isPermanent ? (
              <motion.div
                key="vanishing"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-gray-900/80 backdrop-blur-xl border border-gray-700 shadow-2xl rounded-full px-5 py-2.5 text-xs font-medium flex items-center gap-3"
              >
                <span className="text-yellow-500 animate-pulse">⏳ 48h Vanishing Chat</span>
                <span className="w-px h-3 bg-gray-700 block"></span>
                <span className="text-gray-300">
                  You: <span className="text-white font-bold">{connection.requesterMsgCount}/10</span>
                </span>
                <span className="text-gray-300">
                  Them: <span className="text-white font-bold">{connection.targetMsgCount}/10</span>
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="locked"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-full px-5 py-2.5 text-xs font-bold shadow-[0_0_20px_rgba(168,85,247,0.5)] flex items-center gap-2"
              >
                <span>🔒 Connection Locked Forever!</span>
                <motion.span 
                  animate={{ y: [0, -5, 0] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  🎉
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === clerkUser?.id;
          return (
            <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-blue-600 rounded-br-sm text-white' : 'bg-gray-800 rounded-bl-sm text-gray-100'}`}>
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-950 border-t border-gray-900 absolute bottom-0 w-full left-0 mb-16 md:mb-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-900 border border-gray-800 rounded-full px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={sending || !inputText.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-full px-6 py-3 font-bold text-sm transition-colors active:scale-95"
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
