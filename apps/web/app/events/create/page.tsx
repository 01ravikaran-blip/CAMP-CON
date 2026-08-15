"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { isDeveloper } from "../../../lib/auth";

export default function CreateEventPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    locationName: "",
    latitude: "",
    longitude: "",
    radiusMeters: "25",
    energyReward: "50",
    startTime: "",
    endTime: "",
  });

  if (!isLoaded) return <div className="p-8 text-center text-white">Loading...</div>;

  const isDev = isDeveloper(undefined, user);

  if (!isDev) {
    return (
      <div className="p-8 text-center text-white bg-[var(--bg-primary)] min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You must be a Developer or Admin to access this page.</p>
        <button onClick={() => router.push('/events')} className="mt-4 px-6 py-2 bg-blue-600 rounded-xl">Back to Events</button>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      setSuccess("Event created successfully! QR Secret: " + data.event.qrSecret);
      setFormData({
        title: "",
        description: "",
        locationName: "",
        latitude: "",
        longitude: "",
        radiusMeters: "25",
        energyReward: "50",
        startTime: "",
        endTime: "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 md:p-12 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        <h1 className="text-4xl font-black mb-2 tracking-tight">Create Event</h1>
        <p className="opacity-60 mb-8">Admin / Developer Tools</p>

        {error && <div className="mb-6 p-4 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30">{error}</div>}
        {success && <div className="mb-6 p-4 rounded-xl bg-green-500/20 text-green-300 border border-green-500/30">{success}</div>}

        <form onSubmit={handleSubmit} className="glass glass-card p-6 md:p-8 rounded-3xl flex flex-col gap-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold opacity-70">Event Title</label>
              <input required type="text" name="title" value={formData.title} onChange={handleChange} className="bg-black/20 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-blue-500" placeholder="e.g. Hackathon Kickoff" />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold opacity-70">Location Name</label>
              <input required type="text" name="locationName" value={formData.locationName} onChange={handleChange} className="bg-black/20 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-blue-500" placeholder="e.g. Auditorium A" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold opacity-70">Description</label>
            <textarea required name="description" value={formData.description} onChange={handleChange} rows={3} className="bg-black/20 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-blue-500" placeholder="Event details..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold opacity-70">Latitude</label>
              <input required type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} className="bg-black/20 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-blue-500" placeholder="e.g. 30.7691" />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold opacity-70">Longitude</label>
              <input required type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} className="bg-black/20 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-blue-500" placeholder="e.g. 76.5746" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold opacity-70">Radius (Meters)</label>
              <input required type="number" name="radiusMeters" value={formData.radiusMeters} onChange={handleChange} className="bg-black/20 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-blue-500" />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold opacity-70">Energy Reward</label>
              <input required type="number" name="energyReward" value={formData.energyReward} onChange={handleChange} className="bg-black/20 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold opacity-70">Start Time</label>
              <input required type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} className="bg-black/20 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-blue-500" />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold opacity-70">End Time</label>
              <input required type="datetime-local" name="endTime" value={formData.endTime} onChange={handleChange} className="bg-black/20 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50">
            {loading ? "Creating..." : "Create Event & Generate QR Secret"}
          </button>
        </form>
      </div>
    </div>
  );
}
