"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR 'window not defined' error
const MapClient = dynamic(() => import('../../components/MapClient'), {
    ssr: false,
    loading: () => <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">Loading Map... 🌍</div>
});

export default function MapPage() {
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const SOCIAL_URL = process.env.NODE_ENV === 'production'
                    ? 'https://camp-con-social.onrender.com'
                    : 'http://localhost:3003';

                const res = await fetch(`${SOCIAL_URL}/posts`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Filter posts with location
                    const withLoc = data.filter(p => p.location && p.location.lat);
                    setPosts(withLoc);
                }
            } catch (e) { }
        };
        fetchLocations();
    }, []);

    return (
        <div className="w-full h-full min-h-[calc(100vh-4rem)] relative">
            <div className="absolute top-0 left-0 w-full z-[1000] p-4 pointer-events-none">
                <div className="bg-white/90 dark:bg-black/90 p-2 rounded-xl shadow-lg inline-block pointer-events-auto">
                    <h1 className="text-sm font-bold">📍 Campus Map</h1>
                </div>
            </div>

            <MapClient posts={posts} />

            <div className="absolute bottom-20 left-0 w-full z-[1000] pointer-events-none flex justify-center pb-4">
                <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg pointer-events-auto font-bold text-sm"
                >
                    Refresh Area 🔄
                </button>
            </div>
        </div>
    );
}
