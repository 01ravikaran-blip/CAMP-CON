"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
    const pathname = usePathname();

    // Hide on login/signup/verify pages
    if (['/login', '/signup', '/verify', '/'].includes(pathname)) return null;

    const isActive = (path: string) => pathname === path;

    return (
        <div className="fixed bottom-0 left-0 w-full glass-premium border-t border-white/5 p-2 pb-6 flex justify-around items-end z-50">
            <Link href="/feed" className={`flex flex-col items-center p-3 rounded-2xl transition-all btn-premium ${isActive('/feed') ? 'text-blue-500 bg-blue-500/5' : 'opacity-40 hover:opacity-100'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </Link>

            <Link href="/map" className={`flex flex-col items-center p-3 rounded-2xl transition-all btn-premium ${isActive('/map') ? 'text-blue-500 bg-blue-500/5' : 'opacity-40 hover:opacity-100'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </Link>

            <Link href="/marketplace" className={`flex flex-col items-center p-3 rounded-2xl transition-all btn-premium ${isActive('/marketplace') ? 'text-blue-500 bg-blue-500/5' : 'opacity-40 hover:opacity-100'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </Link>

            {/* Central Agent - Apple Physical Style */}
            <Link href="/agent" className="relative -top-10 group">
                <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_10px_30px_rgba(37,99,235,0.4),inset_0_2px_4px_rgba(255,255,255,0.3)] border-2 border-white/20 transform group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
                    <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                {/* Glow Background */}
                <div className="absolute inset-x-0 -bottom-2 h-4 bg-blue-500/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Link>


            <Link href="/games" className={`flex flex-col items-center p-3 rounded-2xl transition-all btn-premium ${isActive('/games') ? 'text-blue-500 bg-blue-500/5' : 'opacity-40 hover:opacity-100'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
            </Link>

            <Link href="/profile" className={`flex flex-col items-center p-3 rounded-2xl transition-all btn-premium ${isActive('/profile') ? 'text-blue-500 bg-blue-500/5' : 'opacity-40 hover:opacity-100'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </Link>
        </div>
    );
}
