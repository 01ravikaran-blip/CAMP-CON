"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [displayChildren, setDisplayChildren] = useState(children);
    const [transitionStage, setTransitionStage] = useState("page-transition-enter");

    useEffect(() => {
        if (pathname !== undefined) {
            setTransitionStage(""); // Reset
            setTimeout(() => {
                setDisplayChildren(children);
                setTransitionStage("page-transition-enter");
            }, 50);
        }
    }, [pathname, children]);

    return (
        <div className={`w-full min-h-screen ${transitionStage}`}>
            {displayChildren}
        </div>
    );
}
