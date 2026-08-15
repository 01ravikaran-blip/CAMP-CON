"use client";

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';

interface PostCardProps {
    post: any;
    currentUser: string; // The logged-in username
    onUpdate?: () => void; // Callback to refresh parent list
}

export default function PostCard({ post, currentUser, onUpdate }: PostCardProps) {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const [showMenu, setShowMenu] = useState(false);
    const [localVote, setLocalVote] = useState<'up' | 'down' | null>(null);
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [isBookmarked, setIsBookmarked] = useState(false);

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            const bookmarks = JSON.parse(user).bookmarks || [];
            setIsBookmarked(bookmarks.includes(post._id));
        }
    }, [post._id]);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const hasViewedRef = useRef(false);
    const [repostAnimating, setRepostAnimating] = useState(false);
    const [likeAnimating, setLikeAnimating] = useState(false);

    const SOCIAL_URL = process.env.NODE_ENV === 'production'
        ? 'https://camp-con-social.onrender.com'
        : 'http://localhost:3003';

    // Initial vote state (optimistic UI)
    useEffect(() => {
        if (post.upvotes?.includes(currentUser)) setLocalVote('up');
        else if (post.downvotes?.includes(currentUser)) setLocalVote('down');
        else setLocalVote(null);
    }, [post, currentUser]);

    // Track View on Mount (Once)
    useEffect(() => {
        if (!hasViewedRef.current) {
            hasViewedRef.current = true;
            fetch(`${SOCIAL_URL}/posts/${post._id}/view`, { method: 'POST' }).catch(() => { });
        }
    }, [post._id]);

    const handleVote = async (type: 'up' | 'down') => {
        // Optimistic update
        if (type === 'up' && localVote !== 'up') {
            setLikeAnimating(true);
            setTimeout(() => setLikeAnimating(false), 500);
        }

        if (localVote === type) {
            setLocalVote(null); // Toggle off if already active
            // In a real app we'd call 'remove' API, leveraging same endpoint logic
        } else {
            setLocalVote(type);
        }

        try {
            await fetch(`${SOCIAL_URL}/posts/${post._id}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser, type })
            });
            if (onUpdate) onUpdate();
        } catch (e) {
            console.error("Vote failed");
        }
    };

    const handleRepost = async () => {
        setRepostAnimating(true);
        setTimeout(() => setRepostAnimating(false), 600);
        try {
            const res = await fetch(`${SOCIAL_URL}/posts/${post._id}/repost`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser })
            });
            if (!res.ok) {
                const err = await res.json();
                if (err.error === 'Already reposted') showToast('Already reposted! 🔄', 'info');
            } else {
                showToast('Reposted successfully! 🚀', 'success');
                if (onUpdate) onUpdate();
            }
        } catch (e) {
            showToast('Repost failed', 'error');
        }
    };

    const handleComment = async () => {
        if (!commentText.trim()) return;
        try {
            await fetch(`${SOCIAL_URL}/posts/${post._id}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser, text: commentText })
            });
            setCommentText('');
            showToast('Reply posted! 💬', 'success');
            if (onUpdate) onUpdate();
        } catch (e) {
            showToast('Reply failed', 'error');
        }
    };

    const handleRequestNote = async () => {
        try {
            await fetch(`${SOCIAL_URL}/posts/${post._id}/request-note`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser })
            });
            showToast('Community Note Requested. If enough users agree, AI will intervene.', 'info');
            setShowMenu(false);
            if (onUpdate) onUpdate();
        } catch (e) {
            showToast('Request failed', 'error');
        }
    };

    const handleBookmark = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Please login to save posts', 'warning');
            return;
        }

        try {
            const AUTH_URL = process.env.NODE_ENV === 'production' ? 'https://camp-con-auth.onrender.com' : 'http://localhost:3001';
            const res = await fetch(`${AUTH_URL}/user/bookmark`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ postId: post._id })
            });

            if (res.ok) {
                const data = await res.json();
                setIsBookmarked(data.isBookmarked);

                // Update local storage user object
                const userObj = JSON.parse(localStorage.getItem('user') || '{}');
                userObj.bookmarks = data.bookmarks;
                localStorage.setItem('user', JSON.stringify(userObj));

                showToast(data.isBookmarked ? 'Post saved to your profile' : 'Post removed from saved', 'success');
            }
        } catch (e) {
            showToast('Failed to save post', 'error');
        }
    };

    const calculateScore = () => {
        const up = post.upvotes?.length || 0;
        const down = post.downvotes?.length || 0;
        // Adjust for optimistic local state if needed, but for simplicity showing server state + local visual
        return up - down;
    };

    const handleAction = async (action: 'archive' | 'delete') => {
        if (!confirm(`Are you sure you want to ${action} this post?`)) return;

        const endpoint = action === 'delete'
            ? `${SOCIAL_URL}/posts/${post._id}`
            : `${SOCIAL_URL}/posts/${post._id}/archive`;

        const method = action === 'delete' ? 'DELETE' : 'PUT';

        try {
            await fetch(endpoint, { method });
            showToast(`Post ${action}d successfully`, 'success');
            if (onUpdate) onUpdate();
        } catch (e) {
            showToast('Action failed', 'error');
        }
        setShowMenu(false);
    };

    const isOwner = currentUser === post.username;

    return (
        <div className="border-b border-[var(--border-color)] p-4 hover:bg-[var(--bg-secondary)] transition-colors relative group text-[var(--text-primary)]">
            <div className="flex gap-3">
                {/* User Avatar */}
                <div
                    onClick={() => !post.is_anonymous && (window.location.href = `/profile/${post.username}`)}
                    className={`w-10 h-10 rounded-full flex-shrink-0 cursor-pointer flex items-center justify-center font-bold text-sm ${post.is_anonymous ? 'bg-purple-600' : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                        }`}
                >
                    {post.is_anonymous ? '👻' : (post.username?.[0] || 'U')}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 mb-1">
                            <span
                                className="font-bold text-[15px] truncate hover:underline cursor-pointer text-[var(--text-primary)]"
                                onClick={() => !post.is_anonymous && (window.location.href = `/profile/${post.username}`)}
                            >
                                {post.is_anonymous ? 'Anonymous' : post.username}
                            </span>
                            {post.is_anonymous && <span className="text-[10px] bg-purple-900 text-purple-200 px-1.5 rounded">Ghost</span>}
                            <span className="text-sm text-[var(--text-secondary)]">
                                · {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        {/* Meatballs Menu - APPLE STYLE */}
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                                className="p-2.5 rounded-xl hover:bg-white/10 transition-all btn-premium opacity-40 hover:opacity-100"
                                title="More"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 top-6 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 w-48 overflow-hidden text-sm animate-enter">
                                    {isOwner && (
                                        <>
                                            <button onClick={() => handleAction('archive')} className="w-full text-left px-4 py-3 hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors">
                                                📁 Archive Post
                                            </button>
                                            <button onClick={() => handleAction('delete')} className="w-full text-left px-4 py-3 hover:bg-[var(--bg-secondary)] text-red-500 font-bold transition-colors">
                                                🗑️ Delete Post
                                            </button>
                                            <div className="h-px bg-[var(--border-color)] my-0" />
                                        </>
                                    )}
                                    <button className="w-full text-left px-4 py-3 hover:bg-[var(--bg-secondary)] text-red-500 font-bold transition-colors">🚫 Block @{post.username}</button>
                                    <button className="w-full text-left px-4 py-3 hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors">🔇 Mute @{post.username}</button>
                                    <button className="w-full text-left px-4 py-3 hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors">👎 Not Interested</button>
                                    <div className="h-px bg-[var(--border-color)] my-0" />
                                    <button onClick={handleRequestNote} className="w-full text-left px-4 py-3 hover:bg-[var(--bg-secondary)] text-yellow-500 font-bold transition-colors">
                                        ⚠️ Request Community Note
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap">{post.content}</p>

                    {/* Media Rendering - Supports Albums & Mixed Content */}
                    {(post.media?.length > 0 || post.media_url) && (
                        <div className={`mt-3 rounded-xl overflow-hidden border border-[var(--border-color)] ${(post.media?.length > 1) ? 'grid grid-cols-2 gap-0.5' : ''
                            }`}>
                            {/* Normalize legacy to array */}
                            {(post.media?.length > 0 ? post.media : [{ url: post.media_url, type: post.type === 'voice' ? 'audio' : post.type === 'reel' ? 'video' : 'image' }]).map((item: any, i: number) => (
                                <div key={i} className={`relative overflow-hidden ${item.type === 'audio' ? 'col-span-2' : ''}`}>
                                    {item.type === 'video' ? (
                                        <video src={item.url} controls className="w-full max-h-[500px] object-cover bg-black" />
                                    ) : item.type === 'audio' ? (
                                        <div className="p-3 bg-[var(--bg-tertiary)] flex items-center gap-3 w-full">
                                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">▶</div>
                                            <audio controls src={item.url} className="w-full h-8" />
                                        </div>
                                    ) : (
                                        <img src={item.url} className="w-full h-full max-h-[500px] object-cover hover:scale-105 transition-transform duration-500" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tags & Location */}
                    {(post.location || post.tags) && (
                        <div className="flex gap-2 mt-2 text-xs opacity-60">
                            {post.location && (
                                <span className="flex items-center gap-1 text-blue-400">
                                    📍 {post.location.name || 'Location Tagged'}
                                </span>
                            )}
                            {post.tags && (
                                <span className="text-blue-400">{post.tags}</span>
                            )}
                        </div>
                    )}

                    {/* Community Notes System */}
                    {post.community_notes_data?.is_triggered && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-3 text-sm">
                            <div className="flex items-center gap-2 text-yellow-500 mb-2">
                                <span className="text-lg">⚖️</span>
                                <span className="font-bold uppercase text-xs tracking-wider">Readers Added Context</span>
                            </div>
                            <div className="space-y-2 mb-2 max-h-40 overflow-y-auto custom-scrollbar">
                                {post.community_notes_data.thread.map((note: any, i: number) => (
                                    <div key={i} className={`p-2 rounded-lg ${note.is_system ? 'bg-yellow-500/10 border-l-2 border-yellow-500' : 'bg-[var(--bg-tertiary)]'}`}>
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <p className="text-xs font-bold opacity-70 text-[var(--text-primary)]">{note.username} {note.is_system && '(System)'}</p>
                                            <span className="text-[9px] opacity-40 text-[var(--text-secondary)]">{new Date(note.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="opacity-90 text-[var(--text-primary)]">{note.text}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Input for adding context */}
                            {showNoteInput ? (
                                <div className="mt-2 animate-enter">
                                    <textarea
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        placeholder="Provide evidence or context..."
                                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-2 text-xs h-16 resize-none mb-2 focus:ring-1 focus:ring-yellow-500 outline-none text-[var(--text-primary)]"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setShowNoteInput(false)} className="text-xs opacity-60 hover:opacity-100 text-[var(--text-primary)]">Cancel</button>
                                        <button
                                            onClick={async () => {
                                                if (!noteText.trim()) return;
                                                try {
                                                    await fetch(`${SOCIAL_URL}/posts/${post._id}/note-reply`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ username: currentUser, text: noteText })
                                                    });
                                                    setNoteText('');
                                                    setShowNoteInput(false);
                                                    if (onUpdate) onUpdate();
                                                } catch (e) {
                                                    alert('Failed to submit note');
                                                }
                                            }}
                                            className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs px-3 py-1.5 rounded-full font-bold transition-colors"
                                        >
                                            Submit
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setShowNoteInput(true)} className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 font-medium">
                                    <span>Rate Helpfulness / Add Context</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Action Bar - Apple/X Hybrid Style (FIXED ICONS & LABELS) */}
                    <div className="flex items-center justify-between text-sm text-[var(--text-secondary)] mt-4 max-w-lg px-0.5">

                        {/* Reply / Comment */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
                            className="flex items-center gap-2 hover:text-blue-500 group/comment transition-all p-2 -ml-2 rounded-xl hover:bg-blue-500/5 btn-premium"
                            title="Reply"
                        >
                            <svg className="w-5 h-5 group-hover/comment:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-xs font-medium">{post.comments?.length || 0}</span>
                        </button>

                        {/* Repost */}
                        <button
                            onClick={(e) => { e.stopPropagation(); handleRepost(); }}
                            className={`flex items-center gap-2 group/repost transition-all p-2 rounded-xl hover:bg-green-500/5 btn-premium ${post.repostedBy?.includes(currentUser) ? 'text-green-500 font-bold' : 'hover:text-green-500'}`}
                            title="Repost"
                        >
                            <svg className={`w-5 h-5 group-hover/repost:scale-110 transition-transform ${repostAnimating ? 'animate-spin-once' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m0 0H15" />
                            </svg>
                            <span className="text-xs font-medium">{post.reposts || 0}</span>
                        </button>

                        {/* Score System (Combined Up/Down with Net Score) */}
                        <div className="flex items-center gap-1 group/vote bg-black/5 dark:bg-white/5 rounded-2xl p-0.5">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleVote('up'); }}
                                className={`p-1.5 rounded-xl transition-all btn-premium ${localVote === 'up' ? 'text-orange-500 bg-orange-500/10' : 'hover:text-orange-500'}`}
                                title="Upvote"
                            >
                                <svg className={`w-5 h-5 group-hover/vote:scale-125 transition-transform ${likeAnimating ? 'animate-like-bounce' : ''}`} fill={localVote === 'up' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                                </svg>
                            </button>

                            <span className={`text-xs font-black min-w-[24px] text-center ${calculateScore() > 0 ? 'text-orange-500' : calculateScore() < 0 ? 'text-blue-500' : ''}`}>
                                {calculateScore() === 0 ? '0' : calculateScore() > 0 ? `+${calculateScore()}` : calculateScore()}
                            </span>

                            <button
                                onClick={(e) => { e.stopPropagation(); handleVote('down'); }}
                                className={`p-1.5 rounded-xl transition-all btn-premium ${localVote === 'down' ? 'text-blue-500 bg-blue-500/10' : 'hover:text-blue-500'}`}
                                title="Downvote"
                            >
                                <svg className="w-5 h-5 group-hover/vote:scale-125 transition-transform" fill={localVote === 'down' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        {/* Stats */}
                        <button className="flex items-center gap-2 hover:text-blue-500 group/stats transition-all p-2 rounded-xl hover:bg-blue-500/5 btn-premium" title="Views">
                            <svg className="w-5 h-5 group-hover/stats:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="text-xs font-medium">{(post.views || 0).toLocaleString()}</span>
                        </button>

                        {/* Bookmark / Save */}
                        <button
                            onClick={handleBookmark}
                            className={`p-2.5 rounded-xl transition-all btn-premium ${isBookmarked ? 'text-yellow-500 bg-yellow-500/10 opacity-100' : 'opacity-40 hover:opacity-100'}`}
                            title={isBookmarked ? "Saved" : "Save"}
                        >
                            <svg className="w-5 h-5" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); showToast('Share link copied!', 'success'); }}
                            className="p-2.5 rounded-xl transition-all btn-premium opacity-40 hover:opacity-100"
                            title="Share"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        </button>
                    </div>

                    {/* Comments Section */}
                    {showComments && (
                        <div className="mt-3 pl-4 border-l-2 border-[var(--border-color)] animate-enter" onClick={e => e.stopPropagation()}>
                            {post.comments?.map((c: any, i: number) => (
                                <div key={i} className="mb-2 text-xs text-[var(--text-primary)]">
                                    <span className="font-bold">{c.username}</span>
                                    <span className="mx-1 text-[var(--text-secondary)]">·</span>
                                    <span className="opacity-90">{c.text}</span>
                                </div>
                            ))}
                            <div className="flex gap-2 mt-2">
                                <input
                                    className="bg-transparent border-b border-[var(--border-color)] text-xs w-full outline-none py-2 text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors placeholder-[var(--text-secondary)]"
                                    placeholder="Post your reply..."
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleComment()}
                                />
                                <button onClick={handleComment} className="text-[var(--accent)] text-xs font-bold px-3 py-1 rounded-full hover:bg-[var(--accent)]/10 disabled:opacity-50" disabled={!commentText.trim()}>Reply</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
