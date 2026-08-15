"use client";

import React from 'react';

export default function LoadingIndicator({ size = "md", color = "currentColor" }: { size?: "sm" | "md" | "lg", color?: string }) {
    const dimensions = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12"
    };

    const segments = Array.from({ length: 12 });

    return (
        <div className={`relative ${dimensions[size]}`}>
            {segments.map((_, i) => (
                <div
                    key={i}
                    className="ios-loading-dot absolute left-1/2 top-0 w-[10%] h-[30%] rounded-full origin-[center_165%]"
                    style={{
                        transform: `translateX(-50%) rotate(${i * 30}deg)`,
                        animationDelay: `${-1 + (i * 0.083)}s`,
                        backgroundColor: color
                    }}
                />
            ))}
        </div>
    );
}
