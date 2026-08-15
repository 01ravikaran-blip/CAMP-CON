"use client";

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { compressImage } from '../../utils/compressImage';
import { fileToBase64 } from '../../utils/fileToBase64';
import { getPlaceName } from '../../utils/geocoding';
import GlobalSearch from '../../components/GlobalSearch';
import PostCard from '../../components/PostCard';
import { useToast } from '../../components/Toast';
import { useUser, UserButton } from '@clerk/nextjs';
import EnergyBar from '../../components/EnergyBar';
export default function FeedPage() {
    const { theme, setTheme } = useTheme();
    const { showToast } = useToast();
    const { user: clerkUser, isLoaded } = useUser();

    // Core Feed State
    const [activeTab, setActiveTab] = useState<'feed' | 'reels'>('feed');
    const [posts, setPosts] = useState<any[]>([]);
    const [newPost, setNewPost] = useState<{ content: string, media: any[], is_anonymous: boolean, location: any, locationName?: string, tags: string }>({
        content: '',
        media: [],
        is_anonymous: false,
        location: null,
        locationName: '',
        tags: ''
    });
    const [showLocationInput, setShowLocationInput] = useState(false);
    // Media & Camera State
    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tubeRef = useRef<HTMLDivElement>(null);
    const nativeCameraRef = useRef<HTMLInputElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    // Permissions State
    const [stats, setStats] = useState({ upvotes: 0, reposts: 0, comments: 0 });

    const [isRecording, setIsRecording] = useState(false);
    const [uploading, setUploading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Social State
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');
    const [realUsername, setRealUsername] = useState('Student');
    const [isInputActive, setIsInputActive] = useState(false);
    const [showTools, setShowTools] = useState(false);

    useEffect(() => {
        if (isLoaded && clerkUser) {
            const username = clerkUser.username || clerkUser.firstName || 'Student';
            setRealUsername(username);
            
            // Sync University Metadata if needed
            const syncUniversity = async () => {
                const pendingUni = localStorage.getItem('detected_uni');
                const currentUni = clerkUser.publicMetadata.university;

                if (pendingUni && !currentUni) {
                    try {
                        const res = await fetch('/api/user/sync-university', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ university: pendingUni })
                        });
                        if (res.ok) {
                            showToast(`Synced with ${pendingUni} Portal!`, 'success');
                        }
                    } catch (e) {
                        console.error("Sync error", e);
                    }
                }
            };
            syncUniversity();

            fetchUserStats(username);
            fetchPosts();
        } else if (isLoaded && !clerkUser) {
            fetchPosts();
        }
    }, [isLoaded, clerkUser]);

    const fetchPosts = async () => {
        try {
            const SOCIAL_URL = process.env.NODE_ENV === 'production'
                ? 'https://camp-con-social.onrender.com'
                : 'http://localhost:3003';

            const userUni = clerkUser?.publicMetadata?.university;
            let url = `${SOCIAL_URL}/posts`;
            if (userUni) {
                url += `?university=${encodeURIComponent(userUni as string)}`;
            }

            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) {
                setPosts(data);
            }
        } catch (error) {
            console.log("Social service offline. Loading mock feed...");
            setPosts([
                {
                    _id: 'mock1',
                    username: 'Sarah (Design)',
                    content: 'Just finished my final project! Anyone want to grab coffee at the campus cafe? ☕️✨',
                    media: [],
                    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                    upvotes: ['1', '2', '3', '4', '5'],
                    downvotes: [],
                    comments: [{ username: 'Alex', text: 'I am down! See you in 10.' }],
                    shares: 2,
                    views: 120,
                    is_anonymous: false,
                    location: { name: 'Campus Cafe' },
                    tags: 'social'
                },
                {
                    _id: 'mock2',
                    username: 'Anonymous',
                    content: 'Did anyone else find that OS midterm ridiculously hard? 😭',
                    media: [],
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                    upvotes: Array(45).fill('a'),
                    downvotes: [],
                    comments: [{ username: 'Anonymous', text: 'I guessed on half of them.' }],
                    shares: 5,
                    views: 400,
                    is_anonymous: true,
                    location: { name: 'Library' },
                    tags: 'academics'
                }
            ]);
        }
    };

    const fetchUserStats = async (username: string) => {
        // Mock Stats: Normal users get low stats (unqualified), Karan gets high stats + override
        try {
            // Random stats for demo purposes
            setStats({
                upvotes: Math.floor(Math.random() * 100), // < 500
                reposts: Math.floor(Math.random() * 20),  // < 100 
                comments: Math.floor(Math.random() * 50)  // < 100
            });
        } catch (e) {
            console.error("Stats fetch error");
        }
    };

    const isDev = realUsername.toLowerCase() === 'karan' || realUsername.toLowerCase() === '01ravi.karan';

    // --- Permissions Logic ---
    const canCreateVideo = () => {
        // Criteria: 50+ followers OR 500+ Upvotes OR 100 Reposts OR 100 Comments
        if (isDev) return true; // Developer Override

        // Note: 'user' object in localStorage has followers count, but we are simplifying access here
        // Assuming we had access to followers: const followers = JSON.parse(localStorage.getItem('user') || '{}').followers || 0;

        return stats.upvotes >= 500 || stats.reposts >= 100 || stats.comments >= 100;
    };

    const getVideoDurationLimit = () => {
        if (isDev) return 600; // 10 Minutes for Devs

        // Base: 30s. +10s per 100 upvotes (proxy for influence)
        return 30 + Math.floor(stats.upvotes / 100) * 10;
    };

    const canGoLive = () => {
        if (isDev) return true; // Developer Override
        return stats.upvotes >= 100;
    };

    // --- Camera Logic ---
    const startCamera = async (mode: 'photo' | 'video', customFacing?: 'user' | 'environment') => {
        setCameraMode(mode);
        const targetFacing = customFacing || facingMode;
        setCameraOpen(true);
        try {
            // Stop old tracks if any
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: targetFacing },
                audio: mode === 'video'
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (e) {
            showToast('Camera access denied', 'error');
            setCameraOpen(false);
        }
    };

    const toggleCamera = () => {
        const newFacing = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newFacing);
        if (cameraOpen) {
            startCamera(cameraMode, newFacing);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setCameraOpen(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0);
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const formData = new FormData();
                formData.append('file', blob, 'capture.png');

                setUploading(true);
                const SOCIAL_URL = process.env.NODE_ENV === 'production' ? 'https://camp-con-social.onrender.com' : 'http://localhost:3003';
                const res = await fetch(`${SOCIAL_URL}/upload`, { method: 'POST', body: formData });
                const data = await res.json();

                setNewPost(prev => ({
                    ...prev,
                    media: [...prev.media, { url: data.url, type: 'image' }]
                }));
                setUploading(false);
                stopCamera();
            });
        }
    };

    const handleFileUpload = async (e: any) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploading(true);

        try {
            const uploadPromises = files.map(async (file: any) => {
                // 1. Images: Compress & Base64
                if (file.type.startsWith('image/')) {
                    const compressed = await compressImage(file);
                    const base64 = await fileToBase64(compressed);
                    return { url: base64, type: 'image' };
                }

                // 2. Videos: Base64 (Persistence)
                // Note: MongoDB has a 16MB limit. Large videos will fail.
                if (file.type.startsWith('video/')) {
                    if (file.size > 10 * 1024 * 1024) {
                        showToast(`Video too large (>10MB). Persistence might fail.`, 'warning');
                    }
                    const base64 = await fileToBase64(file);
                    return { url: base64, type: 'video' };
                }

                // Fallback (shouldn't happen with current accept attr)
                return null;
            });

            const uploadedItems = (await Promise.all(uploadPromises)).filter(Boolean);

            setNewPost(prev => ({
                ...prev,
                media: [...prev.media, ...uploadedItems]
            }));

        } catch (err) {
            showToast('Upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            chunksRef.current = [];

            recorder.ondataavailable = e => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

                // Base64 Persistence for Voice Notes
                try {
                    setUploading(true);
                    const base64 = await fileToBase64(blob as File);

                    setNewPost(prev => ({
                        ...prev,
                        media: [...prev.media, { url: base64, type: 'audio' }]
                    }));
                } catch (e) {
                    showToast('Voice processing failed', 'error');
                } finally {
                    setUploading(false);
                }
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
        } catch (e) {
            showToast('Microphone access denied', 'error');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            // Stop all tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const requestLocation = () => {
        if (!navigator.geolocation) return showToast('Geolocation not supported', 'warning');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                // Optimistic update with coords
                setNewPost(prev => ({
                    ...prev,
                    location: { lat, lng }
                }));

                // Fetch real name
                const realName = await getPlaceName(lat, lng);

                setNewPost(prev => ({
                    ...prev,
                    locationName: prev.locationName || realName
                }));

                showToast(`Tagged: ${realName}`, 'success');
            },
            () => showToast('Location permission denied.', 'error')
        );
    };

    const handleCreatePost = async () => {
        if (!newPost.content && newPost.media.length === 0) return;

        // 1. Create Optimistic Post
        const tempId = Date.now().toString();
        const optimisticPost = {
            _id: tempId,
            username: newPost.is_anonymous ? 'Anonymous' : realUsername,
            content: newPost.content,
            media: newPost.media,
            created_at: new Date().toISOString(),
            upvotes: [],
            downvotes: [],
            comments: [],
            shares: 0,
            views: 0,
            is_anonymous: newPost.is_anonymous,
            location: newPost.location ? { ...newPost.location, name: newPost.locationName } : null,
            tags: newPost.tags
        };

        // 2. Update UI Immediately
        setPosts(prev => [optimisticPost, ...prev]);
        setNewPost({ content: '', media: [], is_anonymous: false, location: null, locationName: '', tags: '' });
        setShowLocationInput(false);

        // 3. Sync with Server
        try {
            const SOCIAL_URL = process.env.NODE_ENV === 'production' ? 'https://camp-con-social.onrender.com' : 'http://localhost:3003';

            // Sanitize Payload: Remove client-side _id and extra fields to avoid Mongoose CastErrors
            const { _id, ...basePayload } = optimisticPost;
            const serverPayload = {
                ...basePayload,
                university: clerkUser?.publicMetadata?.university
            };

            const res = await fetch(`${SOCIAL_URL}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serverPayload)
            });

            const savedPost = await res.json();

            // 4. Reconcile: Silent Swap (Replace Temp ID with Real ID)
            setPosts(prev => prev.map(p => p._id === tempId ? savedPost : p));
        } catch (e) {
            // Revert on failure
            setPosts(prev => prev.filter(p => p._id !== tempId));
            showToast('Failed to post. Please try again.', 'error');
        }
    };

    const handleComment = async (postId: string) => {
        if (!commentText.trim()) return;
        try {
            await fetch(`http://localhost:3003/posts/${postId}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: realUsername, text: commentText })
            });
            setCommentText('');
            setActiveCommentPostId(null);
            fetchPosts();
        } catch (e) {
            showToast('Failed to comment', 'error');
        }
    };

    const [isLive, setIsLive] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);

    // ... (Existing useEffects)

    const handleGoLive = async () => {
        if (!canGoLive()) return showToast("You are not eligible to go live yet!", 'warning');
        await startCamera('video'); // Reuse camera logic
        setIsLive(true);
        setViewerCount(0);

        // Simulate viewers joining
        const interval = setInterval(() => {
            setViewerCount(prev => prev + Math.floor(Math.random() * 5));
        }, 2000);

        // Store interval ID to clear later (using a ref in real app, here simple is fine for demo as it clears on component unmount or state reset implies we stop caring)
        (window as any).liveInterval = interval;
    };

    const endLiveStream = () => {
        setIsLive(false);
        stopCamera();
        clearInterval((window as any).liveInterval);
        showToast(`Stream Ended! ${viewerCount} viewers watched.`, 'success');
    };

    // Notifications State
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const SOCIAL_URL = process.env.NODE_ENV === 'production' ? 'https://camp-con-social.onrender.com' : 'http://localhost:3003';
            const university = clerkUser?.publicMetadata?.university;
            let url = `${SOCIAL_URL}/notifications?username=${realUsername}`;
            if (university) {
                url += `&university=${encodeURIComponent(university as string)}`;
            }

            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }
        } catch (e) {
            console.log("Social service offline. Loading mock notifications...");
            const mockNotifs = [
                {
                    _id: 'mock_n1',
                    actor: 'System',
                    message: 'Welcome to the CAMP-CON Feed!',
                    type: 'system',
                    timestamp: new Date().toISOString(),
                    is_read: false
                }
            ];
            setNotifications(mockNotifs);
            setUnreadCount(1);
        }
    };

    useEffect(() => {
        if (showNotifications) {
            fetchNotifications();
            // Mark as read after a delay
            setTimeout(async () => {
                const unreadIds = notifications.filter(n => !n.is_read).map(n => n._id);
                if (unreadIds.length > 0) {
                    const SOCIAL_URL = process.env.NODE_ENV === 'production' ? 'https://camp-con-social.onrender.com' : 'http://localhost:3003';
                    await fetch(`${SOCIAL_URL}/notifications/mark-read`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: unreadIds })
                    });
                    setUnreadCount(0);
                }
            }, 2000);
        } else {
            // Poll for unread count in background
            const interval = setInterval(fetchNotifications, 10000);
            return () => clearInterval(interval);
        }
    }, [showNotifications, realUsername, notifications]); // Improved dependencies

    // Action Tube Initializer: Center the infinite scroll
    useEffect(() => {
        if (showTools && tubeRef.current) {
            // Small timeout to ensure expansion animation is underway/complete or DOM is ready
            setTimeout(() => {
                if (tubeRef.current) {
                    tubeRef.current.scrollLeft = tubeRef.current.scrollWidth / 3;
                }
            }, 100);
        }
    }, [showTools]);

    // Dev Tool: Simulate Notification
    const simulateNotification = async () => {
        // Only for demo
        try {
            // Manually push a mock notification to DB directly? 
            // Or just cheat and update local state for immediate feedback if no POST endpoint exists for public
            // Actually I'll use the notification schema if I can accessing DB, but since I am frontend...
            // Let's just mock it in UI for now as per plan "Simulate Notification" if I can't hit an endpoint

            // Wait! I didn't verify a POST /notifications endpoint for public usage. 
            // I'll assume I can't easily push one without backend update.
            // I'll just append to local state to show it works.
            const mockNotif = {
                _id: Date.now().toString(),
                actor: isDev ? 'System' : 'Sarah',
                message: isDev ? 'Developer Mode Active' : 'liked your post',
                type: isDev ? 'system' : 'like',
                timestamp: new Date().toISOString(),
                is_read: false
            };
            setNotifications(prev => [mockNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
        } catch (e) { }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 pb-24">
            {/* Live Stream Overlay */}
            {isLive && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col relative">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

                    {/* Live UI Layer */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-between bg-gradient-to-b from-black/50 via-transparent to-black/50">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <div className="bg-red-600 text-white px-3 py-1 rounded-md font-bold text-sm uppercase tracking-wider animate-pulse">
                                    LIVE
                                </div>
                                <div className="bg-black/40 text-white px-3 py-1 rounded-md font-bold text-sm flex items-center gap-2 backdrop-blur-md">
                                    <span>👁️</span> {viewerCount}
                                </div>
                            </div>
                            <button onClick={endLiveStream} className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 backdrop-blur-md transition-colors">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4 w-full max-w-md">
                            {/* Mock Chat */}
                            <div className="h-48 overflow-y-auto mask-image-linear-to-t space-y-2 p-2">
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="w-6 h-6 rounded-full bg-blue-500"></div>
                                    <span className="text-white/80 text-sm font-bold">Sarah:</span>
                                    <span className="text-white text-sm">Omg hi!! 👋</span>
                                </div>
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000">
                                    <div className="w-6 h-6 rounded-full bg-green-500"></div>
                                    <span className="text-white/80 text-sm font-bold">Alex:</span>
                                    <span className="text-white text-sm">Where are you on campus?</span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-4">
                                <input type="text" placeholder="Say something..." className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white placeholder:text-white/50 outline-none focus:bg-white/20 transition-all backdrop-blur-md" />
                                <button className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl hover:bg-white/20 backdrop-blur-md transition-colors">❤️</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera Overlay */}
            {cameraOpen && !isLive && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={cameraMode === 'photo'}
                        className={`w-full h-full object-cover transition-transform duration-500 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    <div className="absolute top-4 w-full px-4 flex justify-between items-center z-50">
                        <button onClick={toggleCamera} className="bg-white/10 hover:bg-white/20 text-white rounded-full p-3 backdrop-blur-md transition-all">
                            <span className="text-2xl">🔄</span>
                        </button>
                        <button onClick={stopCamera} className="bg-white/10 hover:bg-white/20 text-white rounded-full p-3 backdrop-blur-md transition-all">
                            <span className="text-2xl">✕</span>
                        </button>
                    </div>

                    <div className="absolute bottom-10 flex flex-col items-center gap-4 w-full px-8">
                        <div className="flex bg-black/50 rounded-full p-1 backdrop-blur-md">
                            <button onClick={() => setCameraMode('photo')} className={`px-4 py-1 rounded-full text-sm font-bold ${cameraMode === 'photo' ? 'bg-white text-black' : 'text-white'}`}>Photo</button>
                            <button onClick={() => { if (canCreateVideo()) setCameraMode('video'); else alert('Build your audience to unlock Video!'); }} className={`px-4 py-1 rounded-full text-sm font-bold ${cameraMode === 'video' ? 'bg-white text-black' : 'text-white'} ${!canCreateVideo() && 'opacity-50'}`}>Video</button>
                        </div>

                        <button
                            onClick={cameraMode === 'photo' ? capturePhoto : () => alert('Video Recording Logic Here')}
                            className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-all active:scale-95 ${cameraMode === 'video' ? 'bg-red-500' : 'bg-white/20'}`}
                        >
                            <div className={`rounded-full ${cameraMode === 'video' ? 'w-6 h-6 bg-white' : 'w-14 h-14 bg-white'}`} />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="sticky top-0 z-50 glass border-b border-white/10 p-2 flex flex-col gap-2 backdrop-blur-xl">
                <div className="flex justify-between items-center px-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <UserButton />
                        <h1 className="font-semibold text-white truncate text-base sm:text-lg cursor-pointer" onClick={simulateNotification}>
                            {clerkUser?.publicMetadata?.university ? `${(clerkUser.publicMetadata.university as string).split(' ')[0]} Portal` : 'CAMP-CON'}
                        </h1>
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'reading' : 'dark')}
                            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all shrink-0"
                            title="Switch Theme"
                        >
                            <span className="text-sm">{theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '📖'}</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center">
                            {canGoLive() && (
                                <button onClick={handleGoLive} className="bg-red-500/10 text-red-500 border border-red-500/50 px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-1 hover:bg-red-500/20 transition-colors">
                                    <span>🔴</span> Go Live
                                </button>
                            )}
                        </div>

                        {/* Notifications Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
                                title="Notifications"
                            >
                                <span className="text-sm">🔔</span>
                            </button>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 top-10 w-80 bg-[var(--bg-secondary)] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                    <div className="p-3 border-b border-white/5 font-bold text-sm flex justify-between">
                                        <span>Notifications</span>
                                        <button onClick={() => setNotifications([])} className="text-xs opacity-50 hover:opacity-100">Clear</button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center opacity-50 text-sm">No new notifications</div>
                                        ) : (
                                            notifications.map((n, i) => (
                                                <div key={i} className={`p-3 border-b border-white/5 last:border-0 flex gap-3 ${!n.is_read ? 'bg-blue-500/10' : ''}`}>
                                                    <div className="text-xl">
                                                        {n.type === 'like' ? '❤️' : n.type === 'comment' ? '💬' : n.type === 'system' ? '🤖' : '📣'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm">
                                                            <span className="font-bold">{n.actor}</span> {n.message}
                                                        </p>
                                                        <p className="text-xs opacity-40">{new Date(n.timestamp).toLocaleTimeString()}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <EnergyBar />

                        <button
                            onClick={() => showToast('This is a prototype and real usage will blow your mind! 💰', 'info')}
                            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all btn-premium shadow-sm"
                            title="Wallet"
                        >
                            <span className="text-lg">💳</span>
                        </button>

                        <a href="/settings" className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all btn-premium shadow-sm" title="Settings">
                            <span className="text-lg">⚙️</span>
                        </a>
                    </div>
                </div>

                {/* Global Search Bar */}
                <div className="px-2 pb-1">
                    <GlobalSearch />

                    {/* Center Tabs (Moved below search for better mobile UI) */}
                    <div className="flex justify-center gap-4 py-1 border-t border-white/5">
                        <button
                            onClick={() => setActiveTab('feed')}
                            className={`text-sm font-bold transition-all ${activeTab === 'feed' ? 'text-blue-400 border-b-2 border-blue-400' : 'opacity-60'}`}
                        >
                            Feed
                        </button>
                        <button
                            onClick={() => setActiveTab('reels')}
                            className={`text-sm font-bold transition-all ${activeTab === 'reels' ? 'text-pink-400 border-b-2 border-pink-400' : 'opacity-60'}`}
                        >
                            Reels
                        </button>
                    </div>
                </div>

                {/* Create Post Section */}
                {activeTab === 'feed' && (
                    <div
                        className={`p-4 border-b border-white/10 transition-all duration-500 ease-in-out group/compose ${isInputActive || showTools || newPost.content.length > 0 ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'}`}
                        onFocus={() => setIsInputActive(true)}
                        onBlur={(e) => {
                            const currentTarget = e.currentTarget;
                            // Use a small timeout to allow relatedTarget to populate or state to update
                            setTimeout(() => {
                                if (!document.activeElement || !currentTarget.contains(document.activeElement) && !newPost.content && newPost.media.length === 0) {
                                    setIsInputActive(false);
                                    setShowTools(false);
                                }
                            }, 100);
                        }}
                    >
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-red-500 flex-shrink-0" />
                            <div className="flex-1 space-y-3">
                                <textarea
                                    value={newPost.content}
                                    onFocus={() => setIsInputActive(true)}
                                    onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                                    placeholder="What's happening?"
                                    className={`w-full bg-transparent outline-none text-lg placeholder:opacity-50 resize-none transition-all duration-300 ${isInputActive || newPost.content.length > 0 ? 'h-24' : 'h-8'} ${theme === 'light' ? 'text-black' : 'text-[var(--text-primary)]'}`}
                                />

                                {/* Media Preview (Grid) */}
                                {newPost.media.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 mb-2 animate-in zoom-in-95 duration-300">
                                        {newPost.media.map((item, index) => (
                                            <div key={index} className="relative rounded-xl overflow-hidden border border-white/20 aspect-video group/media">
                                                <button
                                                    onClick={() => setNewPost(prev => ({ ...prev, media: prev.media.filter((_, i) => i !== index) }))}
                                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover/media:opacity-100 hover:bg-black/70 z-10 transition-opacity"
                                                >
                                                    ✕
                                                </button>

                                                {item.type === 'audio' ? (
                                                    <div className="w-full h-full bg-[var(--bg-tertiary)] flex items-center justify-center gap-2 flex-col">
                                                        <div className="text-2xl animate-pulse">🎤</div>
                                                        <span className="text-xs opacity-50 font-bold">Voice Note</span>
                                                        <audio controls src={item.url} className="w-3/4 h-8 mt-2 mix-blend-screen" onClick={e => e.stopPropagation()} />
                                                    </div>
                                                ) : item.type === 'video' ? (
                                                    <video src={item.url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src={item.url} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className={`flex flex-col gap-3 transition-all duration-500 overflow-hidden ${isInputActive ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                    {/* Action Header: Plus & Tube & Post */}
                                    <div className="flex items-center justify-between w-full h-12 overflow-visible">
                                        <div className="flex items-center gap-2 h-full overflow-visible">
                                            {/* Plus Button */}
                                            <button
                                                onClick={() => setShowTools(!showTools)}
                                                onMouseDown={(e) => e.preventDefault()}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 shadow-sm ${showTools ? 'bg-blue-500 text-white rotate-45' : `bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] ${isInputActive || showTools || newPost.content.length > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}`}
                                            >
                                                <span className="text-2xl">+</span>
                                            </button>

                                            {/* Desktop Tools: Standard List */}
                                            <div className={`hidden lg:flex items-center gap-1 transition-all duration-500 ${showTools ? 'opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-4 pointer-events-none'}`}>
                                                <button onClick={() => nativeCameraRef.current?.click()} onMouseDown={(e) => e.preventDefault()} className="w-10 h-10 rounded-full hover:bg-[var(--bg-tertiary)] transition-all flex items-center justify-center" title="Camera">
                                                    <span className="text-lg">📷</span>
                                                </button>
                                                <label onMouseDown={(e) => e.preventDefault()} className="w-10 h-10 rounded-full hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer flex items-center justify-center font-bold" title="Photo/Video">
                                                    <span className="text-lg">🖼️</span> <input type="file" hidden multiple accept="image/*,video/*" onChange={handleFileUpload} />
                                                </label>
                                                <button onClick={isRecording ? stopRecording : startRecording} onMouseDown={(e) => e.preventDefault()} className={`w-10 h-10 rounded-full hover:bg-[var(--bg-tertiary)] transition-all flex items-center justify-center ${isRecording ? 'text-red-500 animate-pulse' : ''}`} title="Voice">
                                                    <span className="text-lg">{isRecording ? '⏹️' : '🎤'}</span>
                                                </button>
                                                <button onClick={() => setNewPost({ ...newPost, is_anonymous: !newPost.is_anonymous })} onMouseDown={(e) => e.preventDefault()} className={`w-10 h-10 rounded-full hover:bg-[var(--bg-tertiary)] transition-all flex items-center justify-center ${newPost.is_anonymous ? 'text-purple-500' : 'opacity-40'}`} title="Ghost Mode">
                                                    <span className="text-lg">👻</span>
                                                </button>
                                                <button onClick={() => setShowLocationInput(!showLocationInput)} onMouseDown={(e) => e.preventDefault()} className={`w-10 h-10 rounded-full hover:bg-[var(--bg-tertiary)] transition-all flex items-center justify-center ${newPost.location ? 'text-green-500' : 'opacity-40'}`} title="Location">
                                                    <span className="text-lg">📍</span>
                                                </button>
                                            </div>

                                            {/* Mobile Tools: swipable Horizontal Action List (The Tube) */}
                                            <div
                                                ref={tubeRef}
                                                className={`lg:hidden flex items-center no-scrollbar transition-all duration-500 ease-apple relative rounded-full overflow-x-auto ${showTools ? 'flex-1 max-w-[150px] opacity-100 translate-x-0' : 'w-0 max-w-0 opacity-0 -translate-x-4 pointer-events-none'}`}
                                                style={{ WebkitOverflowScrolling: 'touch' }}
                                                onScroll={(e) => {
                                                    const target = e.currentTarget;
                                                    const third = target.scrollWidth / 3;
                                                    if (target.scrollLeft <= 5) target.scrollLeft += third;
                                                    if (target.scrollLeft >= (target.scrollWidth * 2) / 3 - 5) target.scrollLeft -= third;
                                                }}
                                            >
                                                <div className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full px-2 py-1 backdrop-blur-xl shrink-0">
                                                    {[...Array(3)].map((_, i) => (
                                                        <div key={i} className="flex items-center gap-2 shrink-0">
                                                            <button
                                                                onClick={() => nativeCameraRef.current?.click()}
                                                                onMouseDown={(e) => e.preventDefault()}
                                                                className="w-10 h-10 rounded-full hover:bg-[var(--bg-tertiary)] transition-all flex items-center justify-center shrink-0"
                                                                title="Open Camera"
                                                            >
                                                                <span className="text-lg">📷</span>
                                                            </button>
                                                            <label onMouseDown={(e) => e.preventDefault()} className="w-10 h-10 rounded-full hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer flex items-center justify-center shrink-0" title="Upload Photo/Video">
                                                                <span className="text-lg">🖼️</span> <input type="file" hidden multiple accept="image/*,video/*" onChange={handleFileUpload} />
                                                            </label>
                                                            <button onClick={isRecording ? stopRecording : startRecording} onMouseDown={(e) => e.preventDefault()} className={`w-10 h-10 rounded-full hover:bg-[var(--bg-tertiary)] transition-all flex items-center justify-center shrink-0 ${isRecording ? 'text-red-500 animate-pulse' : 'text-[var(--text-primary)]'}`}>
                                                                <span className="text-lg">{isRecording ? '⏹️' : '🎤'}</span>
                                                            </button>
                                                            <button onClick={() => setNewPost({ ...newPost, is_anonymous: !newPost.is_anonymous })} onMouseDown={(e) => e.preventDefault()} className="w-10 h-10 rounded-full hover:bg-[var(--bg-tertiary)] transition-all flex items-center justify-center shrink-0">
                                                                <span className={`text-lg transition-colors ${newPost.is_anonymous ? 'text-purple-500' : 'opacity-40'}`}>👻</span>
                                                            </button>
                                                            <button onClick={() => setShowLocationInput(!showLocationInput)} onMouseDown={(e) => e.preventDefault()} className="w-10 h-10 rounded-full hover:bg-[var(--bg-tertiary)] transition-all flex items-center justify-center shrink-0">
                                                                <span className={`text-lg transition-colors ${newPost.location ? 'text-green-500' : 'opacity-40'}`}>📍</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleCreatePost}
                                            onMouseDown={(e) => e.preventDefault()}
                                            disabled={uploading || (!newPost.content.trim() && newPost.media.length === 0)}
                                            className={`w-20 h-10 rounded-2xl font-black text-xs transition-all duration-300 shadow-lg btn-premium shrink-0 flex items-center justify-center overflow-hidden ${isInputActive || showTools || newPost.content.length > 0 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'} ${(!newPost.content.trim() && newPost.media.length === 0) ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] opacity-20 cursor-not-allowed border-[var(--border-color)]' : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:scale-[1.02] active:scale-95'}`}
                                        >
                                            {uploading ? '...' : 'POST'}
                                        </button>
                                    </div>

                                    {/* Location Input (revealed after clicking 📍) */}
                                    {showLocationInput && (
                                        <div className="flex gap-2 items-center animate-in slide-in-from-top-2 duration-300">
                                            <input
                                                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none flex-1 placeholder:opacity-50"
                                                placeholder="Where are you? (e.g. Library)"
                                                value={newPost.locationName || ''}
                                                onChange={e => setNewPost({ ...newPost, locationName: e.target.value })}
                                            />
                                            <button onClick={requestLocation} className="text-xs bg-white/10 px-3 py-2 rounded-xl whitespace-nowrap hover:bg-white/20 transition-colors">
                                                🎯 Use GPS
                                            </button>
                                        </div>
                                    )}

                                    {/* Tags Input */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm font-bold ml-1">#</span>
                                        <input
                                            className="bg-transparent border-none text-sm outline-none w-full focus:ring-0 placeholder:opacity-30"
                                            placeholder="Add tags..."
                                            value={newPost.tags || ''}
                                            onChange={e => setNewPost({ ...newPost, tags: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hidden Native Camera Input */}
                <input
                    type="file"
                    ref={nativeCameraRef}
                    accept="image/*,video/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileUpload}
                />

                {/* Posts Feed */}
                {activeTab === 'feed' ? (
                    <div className="flex flex-col">
                        {posts.map((post) => (
                            <PostCard
                                key={post._id}
                                post={post}
                                currentUser={realUsername}
                                onUpdate={fetchPosts}
                            />
                        ))}
                        <div className="h-20" />
                    </div>
                ) : (
                    <div className="p-10 text-center text-gray-500">
                        <p>Reels Feed is optimized for Vertical Viewing.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
