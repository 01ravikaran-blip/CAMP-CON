'use client';

import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';

export default function AdminEventQR() {
  const [token, setToken] = useState('000000');
  const [progress, setProgress] = useState(100);
  const [eventData, setEventData] = useState({ title: 'Midnight Hackathon', id: 'mock-uuid-1234' });

  // Update loop for 15s rotating QR
  useEffect(() => {
    const TOTAL_TIME = 15;
    let timeRemaining = TOTAL_TIME;

    const generateNewToken = () => {
      // In a real app, use the event's qrSecret to generate TOTP here or fetch from an API
      const randomToken = Math.floor(100000 + Math.random() * 900000).toString();
      setToken(randomToken);
      timeRemaining = TOTAL_TIME;
      setProgress(100);
    };

    generateNewToken();

    const intervalId = setInterval(() => {
      timeRemaining -= 0.1;
      if (timeRemaining <= 0) {
        generateNewToken();
      } else {
        setProgress((timeRemaining / TOTAL_TIME) * 100);
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  // Calculate SVG circle properties
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
      <div className="absolute top-8 left-8">
        <h1 className="text-3xl font-bold text-gray-100">{eventData.title}</h1>
        <p className="text-gray-400">Admin Live QR Check-in</p>
      </div>

      <div className="relative flex flex-col items-center justify-center p-12 bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl">
        {/* Radial Countdown Progress Ring */}
        <svg 
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" 
          viewBox="0 0 320 320"
        >
          {/* Background Ring */}
          <circle 
            cx="160" 
            cy="160" 
            r={radius} 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="8" 
            fill="none" 
          />
          {/* Progress Ring */}
          <circle 
            cx="160" 
            cy="160" 
            r={radius} 
            stroke={progress > 20 ? "#3b82f6" : "#ef4444"} // Blue normally, red when < 20%
            strokeWidth="8" 
            fill="none" 
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 100ms linear, stroke 300ms ease'
            }}
          />
        </svg>

        <div className="bg-white p-4 rounded-xl shadow-lg relative z-10">
          <QRCodeCanvas 
            value={JSON.stringify({ eventId: eventData.id, token })}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        <motion.div 
          key={token} // Re-animate on token change
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-center z-10"
        >
          <p className="text-gray-400 text-sm tracking-widest uppercase mb-1">Current Token</p>
          <p className="text-4xl font-mono font-bold tracking-[0.2em] text-blue-400">{token}</p>
        </motion.div>
      </div>
      
      <p className="mt-8 text-gray-500 max-w-md text-center text-sm">
        Display this screen at your event. Students can use their Campus App to scan the rotating QR code for immediate check-in and energy rewards.
      </p>
    </div>
  );
}
