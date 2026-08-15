"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'message';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    onReply?: (text: string) => void;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, onReply?: (text: string) => void) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', onReply?: (text: string) => void) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type, onReply }]);

        // Auto-dismiss after 4s, but don't dismiss if user is typing (simplified: just increase time for messages)
        const timeout = type === 'message' ? 10000 : 4000;
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, timeout);
    }, []);

    const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-6 right-6 z-[10000] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto min-w-[320px] max-w-[400px] p-4 rounded-[22px] glass-premium border border-white/10 shadow-2xl animate-enter flex flex-col gap-3 transition-all`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${toast.type === 'success' ? 'bg-green-500/20 text-green-500' :
                                toast.type === 'error' ? 'bg-red-500/20 text-red-500' :
                                    toast.type === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                                        toast.type === 'message' ? 'bg-purple-500/20 text-purple-500' :
                                            'bg-blue-500/20 text-blue-500'
                                }`}>
                                {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : toast.type === 'message' ? '💬' : 'ℹ️'}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-black text-[var(--text-primary)] leading-tight">{toast.message}</p>
                            </div>
                        </div>

                        {toast.onReply && (
                            <div className="flex gap-2 mt-1 animate-in fade-in slide-in-from-top-1">
                                <input
                                    type="text"
                                    placeholder="Type a reply..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:ring-1 ring-purple-500 transition-all text-[var(--text-primary)]"
                                    value={replyTexts[toast.id] || ''}
                                    onChange={(e) => setReplyTexts(prev => ({ ...prev, [toast.id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && replyTexts[toast.id]) {
                                            toast.onReply?.(replyTexts[toast.id]);
                                            setToasts(prev => prev.filter(t => t.id !== toast.id));
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        if (replyTexts[toast.id]) {
                                            toast.onReply?.(replyTexts[toast.id]);
                                            setToasts(prev => prev.filter(t => t.id !== toast.id));
                                        }
                                    }}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:opacity-90 transition-opacity"
                                >
                                    REPLY
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}
