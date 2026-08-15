"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import Map, { Source, Layer, useMap, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import PokeballModal from './PokeballModal';
import { Compass, Eye, EyeOff, Layers, Coffee, Home, Navigation, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function MapClient({ posts }: { posts: any[] }) {
    const { user: clerkUser } = useUser();
    const { theme } = useTheme();
    const mapRef = useRef<MapRef>(null);
    const [center, setCenter] = useState<[number, number]>([30.767, 76.649]);
    const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
    const [isFindable, setIsFindable] = useState(false);
    const [modalState, setModalState] = useState<{isOpen: boolean, targetUser: string, targetId: string}>({ isOpen: false, targetUser: '', targetId: '' });
    const lastLocation = useRef<[number, number] | null>(null);

    // Map UI State
    const [campusData, setCampusData] = useState<any>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [layersVisible, setLayersVisible] = useState({
        buildings: true,
        cafes: true,
        hostels: true
    });
    const [hudOpen, setHudOpen] = useState(false);

    const SOCIAL_URL = process.env.NODE_ENV === 'production'
        ? 'https://camp-con-social.onrender.com'
        : 'http://localhost:3003';

    // 1. Get location & Update backend
    useEffect(() => {
        if (navigator.geolocation && clerkUser && isFindable) {
            const updateLocation = () => {
                navigator.geolocation.getCurrentPosition(async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setCenter([longitude, latitude]); // react-map-gl uses [lng, lat] for most things, but viewState is lat/lng
                    lastLocation.current = [longitude, latitude];

                    // Sync to backend
                    try {
                        await fetch(`${SOCIAL_URL}/location`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: clerkUser.id,
                                username: clerkUser.username || clerkUser.firstName || 'Student',
                                university: clerkUser.publicMetadata.university,
                                lng: longitude,
                                lat: latitude
                            })
                        });
                    } catch (e) { console.error("Location sync failed"); }
                });
            };

            updateLocation();
            const interval = setInterval(updateLocation, 30000); // 30s
            return () => clearInterval(interval);
        } else if (navigator.geolocation) {
            // Just get location once for centering if offline
            navigator.geolocation.getCurrentPosition((pos) => {
                setCenter([pos.coords.longitude, pos.coords.latitude]);
                lastLocation.current = [pos.coords.longitude, pos.coords.latitude];
            });
        }
    }, [clerkUser, isFindable]);

    // 2. Fetch Nearby Users & Live Streaming via SSE
    useEffect(() => {
        if (!isFindable || !lastLocation.current || !clerkUser?.publicMetadata?.university) return;
        
        const tenantId = clerkUser.publicMetadata.university;

        // Fetch initial positions
        const fetchNearby = async () => {
            try {
                const [lng, lat] = lastLocation.current!;
                const res = await fetch(`${SOCIAL_URL}/nearby-users?lat=${lat}&lng=${lng}&university=${tenantId}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Filter out self
                    setNearbyUsers(data.filter(u => u.userId !== clerkUser?.id));
                }
            } catch (e) { }
        };

        fetchNearby();
        
        // Connect to Live Radar Stream
        const eventSource = new EventSource(`/api/realtime?topics=campus:${tenantId}:radar`);
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'location_update' && data.userId !== clerkUser.id) {
                    setNearbyUsers(prev => {
                        const existing = prev.find(u => u.userId === data.userId);
                        if (existing) {
                            return prev.map(u => u.userId === data.userId ? { ...u, location: { coordinates: [data.lng, data.lat] } } : u);
                        }
                        return [...prev, { userId: data.userId, username: data.username, location: { coordinates: [data.lng, data.lat] }, popularityScore: data.popularityScore }];
                    });
                } else if (data.type === 'user_offline') {
                    setNearbyUsers(prev => prev.filter(u => u.userId !== data.userId));
                }
            } catch (e) {}
        };

        return () => {
            eventSource.close();
        };
    }, [isFindable, clerkUser]);

    // 3. Extract Campus 3D Data from Overpass API
    useEffect(() => {
        if (!lastLocation.current) return;
        const fetchCampusData = async () => {
            setIsExtracting(true);
            try {
                const [lng, lat] = lastLocation.current!;
                const res = await fetch('/api/map/extract', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ latitude: lat, longitude: lng, radius: 1200 })
                });
                const data = await res.json();
                if (data.success) {
                    setCampusData(data.geojson);
                }
            } catch (e) {
                console.error("Failed to extract campus data", e);
            } finally {
                setIsExtracting(false);
            }
        };

        // Only fetch once we have a location
        if (!campusData && !isExtracting) {
            fetchCampusData();
        }
    }, [lastLocation.current]);

    // Format Nearby Users as GeoJSON for MapLibre
    const nearbyGeoJSON = useMemo(() => {
        return {
            type: 'FeatureCollection',
            features: nearbyUsers.map(user => {
                // Determine rank color
                let color = '#0071E3'; // Default Apple Blue
                const rank = user.popularityScore || 100; // Mock rank calculation or pass rank directly
                if (rank > 500) color = '#F59E0B'; // Top 10 Glowing Gold
                else if (rank > 200) color = '#8B5CF6'; // Batch 1 Purple
                else if (rank > 100) color = '#10B981'; // Batch 2 Emerald

                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [user.location.coordinates[0], user.location.coordinates[1]]
                    },
                    properties: {
                        userId: user.userId || user._id,
                        username: user.username,
                        color
                    }
                };
            })
        };
    }, [nearbyUsers]);

    const handlePokeBall = (username: string, id: string) => {
        setModalState({ isOpen: true, targetUser: username, targetId: id });
    };

    const handleMapClick = (event: any) => {
        const features = event.features;
        if (features && features.length > 0) {
            const clickedFeature = features[0];
            if (clickedFeature.layer.id === 'students-layer') {
                handlePokeBall(clickedFeature.properties.username, clickedFeature.properties.userId);
            }
        }
    };

    const reCenter = () => {
        if (lastLocation.current && mapRef.current) {
            mapRef.current.flyTo({
                center: lastLocation.current,
                zoom: 17,
                pitch: 50,
                bearing: -20,
                duration: 1500
            });
        }
    };

    const isHandshakeHour = process.env.NEXT_PUBLIC_HANDSHAKE_HOUR === 'true';

    return (
        <div className="h-full w-full relative bg-gray-900 overflow-hidden">
            {/* Handshake Hour Banner */}
            {isHandshakeHour && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-pink-500 to-orange-400 text-white px-6 py-2 rounded-full font-bold shadow-2xl animate-pulse text-sm whitespace-nowrap">
                    🤝 Handshake Hour! Zero Connection Costs!
                </div>
            )}

            {/* HUD Elements */}
            <div className="absolute top-16 left-4 z-50 flex flex-col gap-3">
                {/* Findable Toggle */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white p-2 px-3 rounded-full shadow-lg">
                    <span className="text-xs font-semibold">{isFindable ? '🟢 Online' : '⚪ Ghost'}</span>
                    <button 
                        onClick={async () => {
                            const newValue = !isFindable;
                            await fetch('/api/user/update-metadata', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ metadata: { isFindable: newValue } })
                            });
                            window.location.reload();
                        }}
                        className={`w-10 h-5 rounded-full relative transition-colors ${isFindable ? 'bg-green-500' : 'bg-white/30'}`}
                    >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isFindable ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                    </button>
                </div>

                {/* Layer Toggles HUD */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setLayersVisible(s => ({ ...s, buildings: !s.buildings }))}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-md backdrop-blur-md border ${
                            layersVisible.buildings 
                            ? 'bg-blue-500/80 text-white border-blue-400/50' 
                            : 'bg-white/10 text-white/70 border-white/20'
                        }`}
                    >
                        <Layers className="w-4 h-4" /> 3D Buildings
                    </button>
                    <button
                        onClick={() => setLayersVisible(s => ({ ...s, cafes: !s.cafes }))}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-md backdrop-blur-md border ${
                            layersVisible.cafes 
                            ? 'bg-amber-500/80 text-white border-amber-400/50' 
                            : 'bg-white/10 text-white/70 border-white/20'
                        }`}
                    >
                        <Coffee className="w-4 h-4" /> Cafes & Food
                    </button>
                    <button
                        onClick={() => setLayersVisible(s => ({ ...s, hostels: !s.hostels }))}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-md backdrop-blur-md border ${
                            layersVisible.hostels 
                            ? 'bg-teal-500/80 text-white border-teal-400/50' 
                            : 'bg-white/10 text-white/70 border-white/20'
                        }`}
                    >
                        <Home className="w-4 h-4" /> Hostels
                    </button>
                </div>
                
                {/* Extractor Status */}
                {isExtracting && (
                    <div className="flex items-center gap-2 bg-blue-500/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Extracting 3D Data...
                    </div>
                )}
            </div>

            {/* Re-center Button */}
            <button 
                onClick={reCenter}
                className="absolute bottom-24 right-4 z-50 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-full text-white shadow-xl active:scale-95 transition-transform"
            >
                <Navigation className="w-5 h-5" />
            </button>

            {/* MapLibre WebGL Canvas */}
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: center[0],
                    latitude: center[1],
                    zoom: 16.8,
                    pitch: 50,
                    bearing: -20
                }}
                mapStyle={theme === 'dark' ? 'https://tiles.openfreemap.org/styles/dark' : 'https://tiles.openfreemap.org/styles/liberty'}
                interactiveLayerIds={['students-layer']}
                onClick={handleMapClick}
                style={{ 
                    width: '100%', 
                    height: '100%',
                    filter: theme === 'reading' ? 'sepia(0.5) contrast(1.1) brightness(0.95)' : 'none',
                    transition: 'filter 0.3s ease-in-out'
                }}
                maxPitch={85}
            >
                {campusData && (
                    <Source id="campus-data" type="geojson" data={campusData}>
                        {/* General Buildings Extrusion */}
                        <Layer 
                            id="3d-buildings"
                            type="fill-extrusion"
                            filter={['in', 'layerCategory', 'building', 'other']}
                            layout={{ visibility: layersVisible.buildings ? 'visible' : 'none' }}
                            paint={{
                                'fill-extrusion-color': ['get', 'calcColor'],
                                'fill-extrusion-height': ['get', 'calcHeight'],
                                'fill-extrusion-base': 0,
                                'fill-extrusion-opacity': 0.85
                            }}
                        />
                        {/* Hostels Extrusion */}
                        <Layer 
                            id="3d-hostels"
                            type="fill-extrusion"
                            filter={['==', 'layerCategory', 'hostel']}
                            layout={{ visibility: layersVisible.hostels ? 'visible' : 'none' }}
                            paint={{
                                'fill-extrusion-color': ['get', 'calcColor'],
                                'fill-extrusion-height': ['get', 'calcHeight'],
                                'fill-extrusion-base': 0,
                                'fill-extrusion-opacity': 0.85
                            }}
                        />
                        {/* Cafes Extrusion */}
                        <Layer 
                            id="3d-cafes"
                            type="fill-extrusion"
                            filter={['==', 'layerCategory', 'cafe']}
                            layout={{ visibility: layersVisible.cafes ? 'visible' : 'none' }}
                            paint={{
                                'fill-extrusion-color': ['get', 'calcColor'],
                                'fill-extrusion-height': ['get', 'calcHeight'],
                                'fill-extrusion-base': 0,
                                'fill-extrusion-opacity': 0.85
                            }}
                        />
                        {/* Pedestrian Paths */}
                        <Layer
                            id="pedestrian-paths"
                            type="line"
                            filter={['==', 'layerCategory', 'path']}
                            paint={{
                                'line-color': ['get', 'calcColor'],
                                'line-width': 3,
                                'line-dasharray': [2, 2],
                                'line-opacity': 0.6
                            }}
                        />
                    </Source>
                )}

                {/* Nearby Students (Pokéball Targets) Layer */}
                {isFindable && (
                    <Source id="nearby-students" type="geojson" data={nearbyGeoJSON as any}>
                        <Layer 
                            id="students-layer"
                            type="circle"
                            paint={{
                                'circle-radius': [
                                    'interpolate',
                                    ['linear'],
                                    ['zoom'],
                                    15, 6,
                                    18, 12
                                ],
                                'circle-color': ['get', 'color'],
                                'circle-stroke-width': 2,
                                'circle-stroke-color': '#ffffff',
                                'circle-pitch-alignment': 'map'
                            }}
                        />
                    </Source>
                )}
            </Map>

            <PokeballModal 
              isOpen={modalState.isOpen}
              onClose={() => setModalState(s => ({ ...s, isOpen: false }))}
              targetUser={modalState.targetUser}
              targetId={modalState.targetId}
            />
        </div>
    );
}
