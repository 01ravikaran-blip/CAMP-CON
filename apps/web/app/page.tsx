"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen flex flex-col items-center p-6 md:p-12 transition-colors duration-500 relative overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">

      {/* Dynamic Background Blob */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 blur-[100px] animate-pulse pointer-events-none"
        style={{ background: 'var(--accent)' }}
      />

      {/* Top Navigation */}
      <nav className="z-20 w-full max-w-6xl flex justify-between items-center py-4 mb-16 animate-enter">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            C
          </div>
          <span className="font-bold text-xl tracking-tight">CAMP-CON</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Switcher */}
          <div className="hidden md:flex glass rounded-full p-1 gap-1">
            {(['light', 'dark'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`p-2 rounded-full transition-all ${theme === t ? 'bg-white/20 shadow-sm' : 'hover:bg-white/10'}`}
                title={`${t.charAt(0).toUpperCase() + t.slice(1)} Mode`}
              >
                {t === 'light' ? '☀️' : '🌙'}
              </button>
            ))}
          </div>

          <Link
            href="/login"
            className="px-6 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-all font-bold text-sm shadow-xl active:scale-95"
            id="login-button-desktop"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="z-10 max-w-4xl w-full flex flex-col items-center gap-12 text-center">

        <div className="space-y-6 animate-enter" style={{ animationDelay: '0.1s' }}>
          <div className="inline-block px-4 py-1.5 rounded-full glass border border-white/10 text-xs font-bold tracking-widest uppercase opacity-80 mb-4">
            🔒 Exclusive Campus Network
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-[var(--text-primary)] to-[var(--text-primary)]/50">
            The Digital Heart <br /> of Your Campus.
          </h1>
          <p className="text-lg md:text-xl opacity-70 max-w-2xl mx-auto leading-relaxed">
            Connect with verified students, explore private maps, and trade in your exclusive campus marketplace. No randoms, just your community.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row gap-4 animate-enter w-full sm:w-auto" style={{ animationDelay: '0.3s' }}>
          <Link
            href="/verify"
            className="px-10 py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:scale-[1.03] active:scale-95 transition-all text-center"
          >
            Get Verified & Join 🚀
          </Link>
          <Link
            href="/login"
            className="px-10 py-5 rounded-2xl glass border border-white/10 font-bold text-lg hover:bg-white/5 active:scale-95 transition-all text-center md:hidden"
            id="login-button-mobile"
          >
            Login Access 🔑
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
          {[
            { title: "Ghost Mode", desc: "Share live locations with your inner circle while staying invisible to others.", icon: "👻" },
            { title: "Verified Only", desc: "Mandatory Student ID verification ensuring a 100% authentic community.", icon: "🛡️" },
            { title: "Marketplace", desc: "Buy, sell, and trade safely within your campus bubble.", icon: "🛍️" }
          ].map((item, i) => (
            <div
              key={i}
              className="glass glass-card p-8 flex flex-col items-start gap-4 animate-enter group hover:bg-white/[0.03] transition-colors"
              style={{ animationDelay: `${0.4 + (i * 0.1)}s` }}
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</div>
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-sm opacity-60 text-left leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer/Theme Switcher Mobile */}
        <div className="mt-16 opacity-40 text-sm flex flex-col items-center gap-6 pb-12">
          <p>© 2026 CAMP-CON. Exclusive to Verified Institution Partners.</p>
          <div className="flex md:hidden glass rounded-full p-1 gap-1">
            {(['light', 'dark'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${theme === t ? 'bg-white/20' : ''}`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

      </section>
    </main>
  );
}
