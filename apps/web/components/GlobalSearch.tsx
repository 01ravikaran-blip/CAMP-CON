"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function GlobalSearch() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [results, setResults] = useState<{ users: any[], posts: any[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounce search
    useEffect(() => {
        const fetchResults = async () => {
            if (query.trim().length < 2) {
                setResults(null);
                return;
            }

            setLoading(true);
            try {
                const SOCIAL_URL = process.env.NODE_ENV === 'production'
                    ? 'https://camp-con-social.onrender.com'
                    : 'http://localhost:3003';

                const res = await fetch(`${SOCIAL_URL}/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data);
            } catch (e) {
                console.error("Search failed");
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchResults, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [query]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative z-50 w-full max-w-md mx-auto" ref={containerRef}>
            <div className={`flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 transition-all ${isFocused ? 'bg-white/10 ring-2 ring-blue-500/20' : ''}`}>
                <span className="opacity-50 mr-2">🔍</span>
                <input
                    className="bg-transparent outline-none w-full text-sm placeholder:opacity-50 text-[var(--text-primary)]"
                    placeholder="Search people, tags, content..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                />
                {loading && <div className="w-4 h-4 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />}
                {query && !loading && (
                    <button
                        onClick={() => { setQuery(''); setResults(null); setIsFocused(false); }}
                        className="ml-2 text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isFocused && results && (results.users.length > 0 || results.posts.length > 0) && (
                <div className="absolute top-12 left-0 right-0 bg-[var(--bg-secondary)] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl max-h-96 overflow-y-auto">
                    {/* Users */}
                    {results.users.length > 0 && (
                        <div className="p-2">
                            <h3 className="text-xs font-bold opacity-50 px-2 mb-1 uppercase tracking-wider text-[var(--text-secondary)]">People</h3>
                            {results.users.map((u: any, i: number) => (
                                <div
                                    key={i}
                                    onClick={() => { router.push(`/profile/${u.username}`); setIsFocused(false); }}
                                    className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                                        {u.username[0]?.toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-[var(--text-primary)]">{u.username}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Posts */}
                    {results.posts.length > 0 && (
                        <div className="p-2 border-t border-white/5">
                            <h3 className="text-xs font-bold opacity-50 px-2 mb-1 uppercase tracking-wider text-[var(--text-secondary)]">Posts</h3>
                            {results.posts.map((p: any, i: number) => (
                                <div key={i} className="p-2 hover:bg-white/5 rounded-lg cursor-pointer flex gap-3 transition-colors">
                                    <div className="text-xl">
                                        {p.type === 'reel' ? '🎬' : p.type === 'voice' ? '🎤' : '📝'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate opacity-90 text-[var(--text-primary)]">{p.content || 'Media Post'}</p>
                                        <p className="text-xs opacity-50 text-[var(--text-secondary)]">by @{p.username}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* No Results State */}
            {isFocused && query.length >= 2 && !loading && (!results || (results.users.length === 0 && results.posts.length === 0)) && (
                <div className="absolute top-12 left-0 right-0 bg-[var(--bg-secondary)] border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-sm opacity-50">No results found for "{query}"</p>
                </div>
            )}
        </div>
    );
}
