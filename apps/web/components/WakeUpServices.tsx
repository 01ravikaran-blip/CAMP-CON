"use client";

import { useEffect } from "react";

const SERVICES = [
    "https://camp-con-auth.onrender.com",
    "https://camp-con-social.onrender.com",
    "https://camp-con-marketplace.onrender.com",
    "https://camp-con-events.onrender.com",
    "https://camp-con-chat.onrender.com",
    "https://camp-con-wallet.onrender.com",
    "https://camp-con-verification.onrender.com"
];

export default function WakeUpServices() {
    useEffect(() => {
        // Only run in production and NEVER on localhost
        if (process.env.NODE_ENV !== 'production' || (typeof window !== 'undefined' && window.location.hostname === 'localhost')) return;

        console.log("🚀 Pinging services to wake them up...");

        SERVICES.forEach(url => {
            fetch(`${url}/health`)
                .catch(() => {
                    // We expect some CORS/Auth errors on root, that's fine.
                    // The request itself wakes up the instance.
                    console.log(`Pinging ${url}...`);
                });
        });
    }, []);

    return null; // Invisible component
}
