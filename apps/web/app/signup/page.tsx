"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '../../components/Toast';
import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [detectedUni, setDetectedUni] = useState('');

    useEffect(() => {
        const verified = localStorage.getItem('verification_status');
        const uni = localStorage.getItem('detected_uni');
        
        if (verified !== 'VERIFIED') {
            showToast('Security Check: Verify your ID card first.', 'warning');
            router.push('/verify');
        } else {
            setIsVerified(true);
            setDetectedUni(uni || 'University');
        }
        setLoading(false);
    }, [router, showToast]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!isVerified) return null;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-500 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md animate-enter z-10 flex flex-col items-center">
                <h1 className="text-4xl font-black text-center mb-2 tracking-tight">Join {detectedUni}</h1>
                <p className="text-center opacity-50 text-sm mb-8">Verification Complete. Use your official student email.</p>

                <div className="glass glass-card p-1 rounded-3xl overflow-hidden mb-8">
                    <SignUp 
                        appearance={{
                            elements: {
                                rootBox: "mx-auto",
                                card: "bg-transparent shadow-none border-none",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                                socialButtonsBlockButton: "rounded-2xl border-white/10 bg-black/5 dark:bg-white/5",
                                formButtonPrimary: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl transition-all shadow-2xl active:scale-95",
                                formFieldInput: "rounded-2xl border-white/10 bg-black/5 dark:bg-white/5",
                                footerActionText: "text-center opacity-50",
                                footerActionLink: "text-blue-500 hover:underline font-bold"
                            }
                        }}
                    />
                </div>

                <div className="text-center">
                    <Link href="/login" className="text-xs opacity-40 hover:opacity-100 transition-opacity">
                        Already have an account? Login here
                    </Link>
                </div>
            </div>
        </div>
    );
}
