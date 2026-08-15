"use client";

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TopProgressBar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    if (!loading) return null;

    return (
        <div className="fixed top-0 left-0 right-0 h-[3px] z-[9999]">
            <div className="h-full loading-bar-active w-full shadow-[0_0_10px_rgba(29,155,240,0.5)]" />
        </div>
    );
}
