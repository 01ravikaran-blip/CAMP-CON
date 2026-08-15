"use client";

import { useState } from 'react';

export default function SafetyPage() {
    const [reportSubmitted, setReportSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setReportSubmitted(true);
    };

    return (
        <div className="min-h-screen p-6 pb-24 max-w-lg mx-auto">

            <header className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold text-red-500">Safety Center 🛡️</h1>
                <p className="opacity-70">Anonymous reporting & emergency resources.</p>
            </header>

            {!reportSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="glass glass-card p-6 space-y-4">
                        <h2 className="font-bold text-lg">File a Report</h2>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Issue Type</label>
                            <select className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-800 outline-none">
                                <option>Bullying or Harassment</option>
                                <option>Spam or Bot</option>
                                <option>Illegal Content</option>
                                <option>Self-Harm Risk</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-800 h-32 outline-none resize-none"
                                placeholder="Please describe what happened..."
                                required
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="anon" className="w-4 h-4" />
                            <label htmlFor="anon" className="text-sm">Submit Anonymously</label>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg"
                        >
                            Submit Report
                        </button>
                    </div>

                    <div className="glass glass-card p-6">
                        <h2 className="font-bold text-lg mb-4">Emergency Resources</h2>
                        <div className="space-y-3">
                            <button type="button" className="w-full py-3 border border-red-500 text-red-500 rounded-lg font-medium hover:bg-red-500/10 transition-colors">
                                Call Campus Security
                            </button>
                            <button type="button" className="w-full py-3 border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                National Helpline (112)
                            </button>
                        </div>
                    </div>

                </form>
            ) : (
                <div className="glass glass-card p-8 text-center animate-enter space-y-4">
                    <div className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center text-3xl">
                        ✅
                    </div>
                    <h2 className="text-xl font-bold">Report Received</h2>
                    <p className="opacity-70">
                        Thank you for keeping our campus safe. Our moderation team will review this within 15 minutes.
                    </p>
                    <button
                        onClick={() => setReportSubmitted(false)}
                        className="text-blue-500 hover:underline"
                    >
                        File another report
                    </button>
                </div>
            )}

        </div>
    );
}
