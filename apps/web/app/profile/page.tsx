"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from '../../context/ThemeContext';
import PostCard from '../../components/PostCard';
import { compressImage } from '../../utils/compressImage';
import { fileToBase64 } from '../../utils/fileToBase64';

import { useUser, useAuth } from '@clerk/nextjs';

export default function ProfilePage() {
    const router = useRouter();
    const { theme } = useTheme();
    const { user: clerkUser, isLoaded } = useUser();
    const { getToken } = useAuth();
    const [user, setUser] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'replies' | 'media' | 'likes' | 'saved'>('posts');
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Edit Form State
    const [editForm, setEditForm] = useState({
        bio: '',
        instagram: '',
        twitter: '',
        avatar: ''
    });

    useEffect(() => {
        if (isLoaded) {
            if (!clerkUser) {
                router.push('/login');
                return;
            }
            const username = clerkUser.username || clerkUser.firstName || 'Student';
            fetchProfile(username);
        }
    }, [isLoaded, clerkUser, activeTab]);

    const fetchProfile = async (username: string) => {
        setLoading(true);
        try {
            // 1. Get User Details
            try {
                const AUTH_URL = process.env.NODE_ENV === 'production' ? 'https://camp-con-auth.onrender.com' : 'http://localhost:3001';
                const userRes = await fetch(`${AUTH_URL}/user/${username}`);
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData);
                    setEditForm({
                        bio: userData.bio || '',
                        instagram: userData.social_links?.instagram || '',
                        twitter: userData.social_links?.twitter || '',
                        avatar: userData.avatar || ''
                    });
                } else {
                    // Fallback for demo if backend not ready
                    setUser({ username, bio: '', following: 0, followers: 0 });
                }
            } catch (e) {
                setUser({ username, bio: '', following: 0, followers: 0 });
            }

            // 2. Get Posts based on Active Tab
            const SOCIAL_URL = process.env.NODE_ENV === 'production' ? 'https://camp-con-social.onrender.com' : 'http://localhost:3003';
            let url = `${SOCIAL_URL}/posts?`;

            switch (activeTab) {
                case 'posts':
                    url += `username=${username}`;
                    break;
                case 'reels':
                    url += `username=${username}`; // Filter client side for type='reel' or add backend filter
                    break;
                case 'replies':
                    url += `repliedBy=${username}`;
                    break;
                case 'media':
                    url += `username=${username}&mediaOnly=true`;
                    break;
                case 'likes':
                    url += `likedBy=${username}`;
                    break;
                case 'saved':
                    // We need to fetch via the new batch endpoint
                    const bookmarks = user?.bookmarks || [];
                    if (bookmarks.length === 0) {
                        setPosts([]);
                        setLoading(false);
                        return;
                    }
                    const SOCIAL_URL_BATCH = process.env.NODE_ENV === 'production' ? 'https://camp-con-social.onrender.com' : 'http://localhost:3003';
                    const batchRes = await fetch(`${SOCIAL_URL_BATCH}/posts/batch`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: bookmarks })
                    });
                    if (batchRes.ok) {
                        setPosts(await batchRes.json());
                    }
                    setLoading(false);
                    return;
            }

            const postsRes = await fetch(url);
            if (postsRes.ok) {
                let postsData = await postsRes.json();

                // Client-side filtering if needed (e.g. reels until backend supports it explicitly)
                if (activeTab === 'reels') {
                    postsData = postsData.filter((p: any) => p.type === 'reel');
                }

                setPosts(Array.isArray(postsData) ? postsData : []);
            }
        } catch (e) {
            console.error("Error fetching profile", e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        const token = await getToken();
        if (!token) return;

        try {
            const AUTH_URL = process.env.NODE_ENV === 'production' ? 'https://camp-con-auth.onrender.com' : 'http://localhost:3001';
            await fetch(`${AUTH_URL}/user/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    bio: editForm.bio,
                    avatar: editForm.avatar,
                    social_links: { instagram: editForm.instagram, twitter: editForm.twitter }
                })
            });
            setIsEditing(false);
            fetchProfile(user.username);
        } catch (e) {
            alert('Failed to update');
        }
    };

    if (loading && !user) return <div className="min-h-screen flex items-center justify-center text-[var(--text-primary)]">Loading...</div>;

    return (
        <div className={`min-h-screen pb-24 ${theme === 'light' ? 'bg-gray-50 text-black' : 'bg-black text-white'}`}>
            {/* Header */}
            <div className="sticky top-0 z-50 glass border-b border-white/10 p-4 flex items-center justify-between backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-xl">←</button>
                    <div>
                        <h1 className="text-lg font-bold leading-tight">{user?.username}</h1>
                        <p className="text-xs opacity-60">{posts.length} Posts</p>
                    </div>
                </div>
                <button onClick={() => router.push('/settings')} className="text-2xl">⚙️</button>
            </div>

            {/* Profile Info */}
            <div className="px-5 pt-4 pb-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 p-1 relative group">
                        <div className="w-full h-full rounded-full bg-[var(--bg-primary)] flex items-center justify-center overflow-hidden relative">
                            {/* Live Preview: Show editForm.avatar if editing, otherwise user.avatar */}
                            {(isEditing ? editForm.avatar : user?.avatar) ? (
                                <img src={isEditing ? editForm.avatar : user.avatar} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl">👤</span>
                            )}

                            {/* Camera Overlay - Triggers Upload Directly */}
                            <label
                                onClick={() => setIsEditing(true)}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                            >
                                📷
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        // Ensure we enter edit mode so the preview shows
                                        setIsEditing(true);

                                        // Persistence Fix: Use Base64
                                        const compressed = await compressImage(file);
                                        const base64 = await fileToBase64(compressed);

                                        // Update Local State Immediately
                                        setEditForm(prev => ({ ...prev, avatar: base64 }));
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                    {isEditing ? (
                        <div className="flex gap-2">
                            <button onClick={() => { setIsEditing(false); setEditForm(prev => ({ ...prev, avatar: user.avatar })); }} className="px-4 py-1.5 rounded-full border border-white/20 text-sm font-bold opacity-70 hover:opacity-100">Cancel</button>
                            <button onClick={handleUpdateProfile} className="px-4 py-1.5 rounded-full bg-[var(--accent)] text-white text-sm font-bold hover:opacity-90">Save</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="px-4 py-1.5 rounded-full border border-[var(--border-color)] text-sm font-bold hover:bg-[var(--bg-secondary)] transition-colors">
                            Edit Profile
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="space-y-4 mb-4 p-4 glass rounded-xl border border-[var(--border-color)] animate-enter">
                        <div className="space-y-1">
                            <label className="text-xs opacity-50 uppercase font-bold text-[var(--text-secondary)]">Bio</label>
                            <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} className="w-full bg-transparent border-b border-[var(--border-color)] p-2 outline-none h-20 resize-none text-[var(--text-primary)]" placeholder="Tell us about yourself..." />
                        </div>
                        <div className="space-y-1">
                            {/* Removed redundant avatar upload here since it's on the main image now, or keep as backup text */}
                            <p className="text-xs text-[var(--text-secondary)] text-center">💡 Tip: Tap your profile picture above to change it.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <h2 className="text-xl font-bold mb-1 text-[var(--text-primary)]">{user?.username}</h2>
                        {clerkUser?.publicMetadata?.university && (
                            <div className="flex flex-col gap-2 mt-2">
                                <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20 w-fit">
                                    🎓 {clerkUser.publicMetadata.university as string}
                                </div>
                                <button
                                    onClick={async () => {
                                        const newValue = !clerkUser.publicMetadata.isFindable;
                                        await fetch('/api/user/update-metadata', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ metadata: { isFindable: newValue } })
                                        });
                                        window.location.reload(); // Quick refresh to update Clerk state
                                    }}
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border transition-all w-fit ${
                                        clerkUser?.publicMetadata?.isFindable
                                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                    }`}
                                >
                                    {clerkUser?.publicMetadata?.isFindable ? '🟢 Findable' : '⚪ Hidden'}
                                </button>
                            </div>
                        )}
                        <p className="text-sm opacity-90 leading-relaxed whitespace-pre-wrap mb-4 text-[var(--text-secondary)]">{user?.bio || ""}</p>

                        <div className="flex gap-6 text-sm mb-4 text-[var(--text-secondary)]">
                            <div><span className="font-bold text-[var(--text-primary)]">{user?.following || 0}</span> <span className="opacity-60">Following</span></div>
                            <div><span className="font-bold text-[var(--text-primary)]">{user?.followers || 0}</span> <span className="opacity-60">Followers</span></div>
                        </div>
                    </>
                )}
            </div>

            <div className="flex border-b border-white/10 mt-2 overflow-x-auto no-scrollbar">
                {['posts', 'replies', 'media', 'likes', 'saved'].map((tab) => {
                    const currentUsername = clerkUser?.username || clerkUser?.firstName || 'Student';
                    if (tab === 'saved' && user?.username !== currentUsername) return null;

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 min-w-[80px] text-center py-3 text-sm font-bold capitalize transition-colors relative ${activeTab === tab ? 'text-blue-400' : 'opacity-50 hover:opacity-80'}`}
                        >
                            {tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 rounded-full" />}
                        </button>
                    );
                })}
            </div>

            {/* Content Display Switcher */}
            {['posts', 'replies', 'likes', 'saved'].includes(activeTab) ? (
                // --- LIST VIEW (X-Style) for Text/Mixed Content ---
                <div className="flex flex-col">
                    {posts.map((post) => (
                        <PostCard
                            key={post._id}
                            post={post}
                            currentUser={user?.username || 'Guest'}
                            onUpdate={() => fetchProfile(user?.username)}
                        />
                    ))}
                    {posts.length === 0 && (
                        <div className="py-20 text-center opacity-40 text-sm">
                            <p className="text-4xl mb-2">📭</p>
                            No {activeTab} found
                        </div>
                    )}
                </div>
            ) : (
                // --- GRID VIEW (Instagram-Style) for Media/Reels ---
                <div className="grid grid-cols-3 gap-0.5 mt-0.5">
                    {posts.map((post: any) => (
                        <div key={post._id} className="aspect-square bg-white/5 relative group cursor-pointer overflow-hidden border border-black">
                            {post.media_url || post.image_url ? (
                                <img src={post.media_url || post.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            ) : (
                                // Fallback for text-only posts if they somehow appear in media tab
                                <div className="w-full h-full flex items-center justify-center p-2 text-[10px] text-center opacity-70 bg-gray-900 group-hover:bg-gray-800 transition-colors">
                                    <span className="line-clamp-4">{post.content}</span>
                                </div>
                            )}
                            {post.type === 'reel' && <span className="absolute top-2 right-2 text-lg shadow-black drop-shadow-md">🎥</span>}
                            {post.type === 'voice' && <span className="absolute top-2 right-2 text-lg shadow-black drop-shadow-md">🎤</span>}

                            {/* Hover Overlay Stats */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                <span className="flex items-center gap-1">❤️ {post.likes || 0}</span>
                                <span className="flex items-center gap-1">💬 {post.comments?.length || 0}</span>
                            </div>
                        </div>
                    ))}
                    {posts.length === 0 && (
                        <div className="col-span-3 py-20 text-center opacity-40 text-sm">
                            <p className="text-4xl mb-2">🖼️</p>
                            No media shared yet
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
