"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function ArchivedPostsPage() {
    const router = useRouter();
    const { user: clerkUser, isLoaded } = useUser();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArchived = async () => {
            if (!isLoaded || !clerkUser) return;
            const username = clerkUser.username || clerkUser.firstName || 'Student';

            try {
                const SOCIAL_URL = process.env.NODE_ENV === 'production'
                    ? 'https://camp-con-social.onrender.com'
                    : 'http://localhost:3003';

                const res = await fetch(`${SOCIAL_URL}/posts/archived?username=${username}`);
                const data = await res.json();
                if (Array.isArray(data)) setPosts(data);
            } catch (e) {
                console.error("Failed to fetch archive");
            } finally {
                setLoading(false);
            }
        };
        fetchArchived();
    }, [isLoaded, clerkUser]);

    const handleRestore = async (id: string) => {
        try {
            const SOCIAL_URL = process.env.NODE_ENV === 'production'
                ? 'https://camp-con-social.onrender.com'
                : 'http://localhost:3003';

            await fetch(`${SOCIAL_URL}/posts/${id}/unarchive`, { method: 'PUT' });
            setPosts(posts.filter(p => p._id !== id));
        } catch (e) {
            alert("Failed to restore");
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-4 text-[var(--text-primary)]">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="text-xl">←</button>
                <h1 className="text-2xl font-bold">Archived Posts 📁</h1>
            </div>

            {loading ? (
                <div className="text-center opacity-50 mt-10">Loading...</div>
            ) : posts.length === 0 ? (
                <div className="text-center opacity-50 mt-10">No archived posts.</div>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => (
                        <div key={post._id} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] flex justify-between items-center">
                            <div className="flex-1 min-w-0 mr-4">
                                <p className="font-bold truncate">{post.content || 'Media Post'}</p>
                                <p className="text-xs opacity-50">{new Date(post.created_at).toLocaleDateString()}</p>
                            </div>
                            <button
                                onClick={() => handleRestore(post._id)}
                                className="px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-sm font-bold hover:bg-blue-500/20 transition-colors"
                            >
                                Restore
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
