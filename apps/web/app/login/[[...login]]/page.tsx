"use client";

import { SignIn } from "@clerk/nextjs";
import Link from 'next/link';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-500 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md animate-enter z-10 flex flex-col items-center">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mx-auto flex items-center justify-center text-white text-3xl font-black mb-6 shadow-xl">
                        C
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Welcome Back</h1>
                    <p className="opacity-50 text-sm">Enter your credentials to access your campus.</p>
                </div>

                <div className="glass glass-card p-1 rounded-3xl overflow-hidden mb-8">
                    <SignIn 
                        appearance={{
                            elements: {
                                rootBox: "mx-auto",
                                card: "bg-transparent shadow-none border-none",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                                socialButtonsBlockButton: "rounded-2xl border-white/10 bg-black/5 dark:bg-white/5",
                                formButtonPrimary: "bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-2xl transition-all shadow-2xl active:scale-95",
                                formFieldInput: "rounded-2xl border-white/10 bg-black/5 dark:bg-white/5",
                                footerActionText: "text-center opacity-50",
                                footerActionLink: "text-blue-500 hover:underline font-bold"
                            }
                        }}
                    />
                </div>

                <Link href="/" className="text-xs opacity-40 hover:opacity-100 transition-opacity">
                    ← Back to homepage
                </Link>
            </div>
        </div>
    );
}
