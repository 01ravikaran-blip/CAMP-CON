'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Camera, MapPin, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EventsPage() {
    const { user: clerkUser, isLoaded } = useUser();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Check-in State
    const [showScanner, setShowScanner] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string; energy?: number } | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    // Mock an event if the backend is empty for testing
    const mockEvent = {
        id: 'mock-uuid-1234',
        title: 'Midnight Hackathon',
        description: 'Join us for a 12-hour coding sprint!',
        locationName: 'Library 2nd Floor',
        date: new Date().toISOString(),
        energyReward: 50,
        attendees: []
    };

    useEffect(() => {
        if (isLoaded) fetchEvents();
    }, [isLoaded, clerkUser]);

    const fetchEvents = async () => {
        try {
            // Simplified for this scope, normally fetches from the new DB
            setEvents([mockEvent]);
        } catch (e) { } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = () => {
        if (!selectedEventId) return;
        setScanning(true);
        setScanResult(null);

        // 1. Get Geolocation
        if (!navigator.geolocation) {
            setScanResult({ success: false, message: 'Geolocation is not supported by your browser' });
            setScanning(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    // 2. Call API with mocked token (In reality, scanned from QR)
                    const res = await fetch('/api/events/check-in', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            eventId: selectedEventId,
                            token: '123456', // Mock token
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        })
                    });
                    
                    const data = await res.json();
                    
                    if (!res.ok) throw new Error(data.error);

                    setScanResult({ 
                        success: true, 
                        message: data.message,
                        energy: data.energyAwarded
                    });
                } catch (e: any) {
                    setScanResult({ success: false, message: e.message || 'Check-in failed' });
                } finally {
                    setScanning(false);
                }
            },
            (error) => {
                setScanResult({ success: false, message: 'Could not get location. Make sure permissions are granted.' });
                setScanning(false);
            }
        );
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 pb-24 relative">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Campus Events 📅</h1>
                <button 
                    className="text-xs bg-purple-600/20 text-purple-400 px-3 py-1.5 rounded-full font-bold border border-purple-500/30"
                    onClick={() => alert("Admin View: This would open a real-time rotating QR code canvas updating every 15s")}
                >
                    Admin Mode
                </button>
            </div>

            {loading ? (
                <div className="text-center p-10 text-gray-500">Loading Events...</div>
            ) : (
                <div className="space-y-4">
                    {events.map(event => (
                        <div key={event.id} className="bg-gray-900 rounded-2xl p-4 border border-gray-800 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 px-3 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-bold rounded-bl-xl flex items-center gap-1 border-b border-l border-yellow-500/20">
                                <Zap size={12} className="fill-yellow-500" />
                                +{event.energyReward} Energy
                            </div>

                            <h3 className="text-xl font-bold mt-2 text-gray-100">{event.title}</h3>
                            <p className="text-sm text-gray-400 mb-4">{event.description}</p>

                            <div className="flex justify-between items-center text-xs text-gray-500 mb-5 bg-gray-950 p-2 rounded-lg">
                                <span className="flex items-center gap-1"><MapPin size={14}/> {event.locationName}</span>
                                <span>👥 {event.attendees?.length || 0} Going</span>
                            </div>

                            <button
                                onClick={() => {
                                    setSelectedEventId(event.id);
                                    setShowScanner(true);
                                }}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-900/20"
                            >
                                <Camera size={18} />
                                Scan QR to Check-in
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Scanner Modal overlay */}
            <AnimatePresence>
                {showScanner && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-xl flex flex-col p-6"
                    >
                        <button 
                            onClick={() => { setShowScanner(false); setScanResult(null); }} 
                            className="absolute top-6 right-6 text-gray-400 hover:text-white"
                        >
                            ✕ Close
                        </button>

                        <div className="flex-1 flex flex-col items-center justify-center">
                            <h2 className="text-xl font-bold mb-8">Scan Event QR Code</h2>
                            
                            <div className="w-64 h-64 border-2 border-dashed border-gray-600 rounded-3xl relative flex items-center justify-center overflow-hidden bg-gray-900">
                                {/* Mock Camera Viewframe */}
                                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent"></div>
                                <Camera size={48} className="text-gray-700" />
                                
                                {scanning && (
                                    <motion.div 
                                        initial={{ top: 0 }}
                                        animate={{ top: "100%" }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                        className="absolute w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                                    />
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mt-6 text-center max-w-xs">
                                Point your camera at the rotating QR code displayed by the event host.
                            </p>

                            {!scanResult && (
                                <button 
                                    onClick={handleCheckIn}
                                    disabled={scanning}
                                    className="mt-8 bg-white text-black px-8 py-3 rounded-full font-bold shadow-xl active:scale-95 disabled:opacity-50"
                                >
                                    {scanning ? "Verifying..." : "Simulate Scan"}
                                </button>
                            )}

                            {scanResult && (
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`mt-8 p-4 rounded-xl border max-w-xs text-center ${scanResult.success ? 'bg-green-900/30 border-green-500/50' : 'bg-red-900/30 border-red-500/50'}`}
                                >
                                    <h3 className={`font-bold ${scanResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                        {scanResult.success ? 'Check-in Successful!' : 'Check-in Failed'}
                                    </h3>
                                    <p className="text-sm text-gray-300 mt-1">{scanResult.message}</p>
                                    
                                    {scanResult.success && scanResult.energy && (
                                        <motion.div 
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                            className="mt-3 flex items-center justify-center gap-1 text-yellow-400 font-bold text-lg"
                                        >
                                            <Zap size={20} className="fill-yellow-400" />
                                            +{scanResult.energy} Energy!
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
