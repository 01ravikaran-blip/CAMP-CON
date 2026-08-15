"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const saved = localStorage.getItem('camp_con_theme');
        if (saved) setTheme(saved);
        else setTheme('light'); // Explicit default
    }, []);

    useEffect(() => {
        localStorage.setItem('camp_con_theme', theme);
        // Apply theme to HTML tag for global CSS variables
        document.documentElement.setAttribute('data-theme', theme);

        // Remove old class-based approach if present to avoid conflicts
        document.documentElement.className = theme;
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
