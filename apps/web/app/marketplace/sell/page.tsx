"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function SellPage() {
    const router = useRouter();
    const { user: clerkUser, isLoaded } = useUser();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '',
        price: '',
        category: 'General',
        description: '',
        image: ''
    });

    const categories = ['Books', 'Electronics', 'Furniture', 'Clothing', 'Services', 'Other'];

    const handleSell = async () => {
        const { title, price, description, category, image } = form; // Destructure form fields
        if (!title || !price) return alert('Title and Price are required');
        if (!isLoaded || !clerkUser) return alert('You must be signed in');
        setLoading(true);

        // const user = JSON.parse(localStorage.getItem('user') || '{}'); // This line is no longer needed as seller is mocked

        try {
            const MARKET_URL = process.env.NODE_ENV === 'production'
                ? 'https://camp-con-marketplace.onrender.com'
                : 'http://localhost:3004';

            const res = await fetch(`${MARKET_URL}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    price: parseFloat(price),
                    description,
                    category,
                    seller: { 
                        username: clerkUser.username || clerkUser.firstName || 'Student', 
                        id: clerkUser.id 
                    },
                    university: clerkUser.publicMetadata.university,
                    images: image ? [image] : [],
                    location: { lat: 30.767, lng: 76.775 } // Mock Location
                })
            });

            if (res.ok) {
                alert('Item Listed Successfully! 💰');
                router.push('/marketplace');
            } else {
                alert('Failed to list item');
            }
        } catch (e) {
            alert('Error listing item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="text-xl">←</button>
                <h1 className="text-2xl font-bold">Sell Item 🏷️</h1>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
                <div>
                    <label className="block text-sm font-bold mb-1">Title</label>
                    <input
                        className="w-full p-3 rounded-xl border bg-white/50 dark:bg-white/10 outline-none"
                        placeholder="e.g. Calculus Textbook"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                    />
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-bold mb-1">Price (₹)</label>
                        <input
                            type="number"
                            className="w-full p-3 rounded-xl border bg-white/50 dark:bg-white/10 outline-none"
                            placeholder="500"
                            value={form.price}
                            onChange={e => setForm({ ...form, price: e.target.value })}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-bold mb-1">Category</label>
                        <select
                            className="w-full p-3 rounded-xl border bg-white/50 dark:bg-white/10 outline-none"
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })}
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1">Description</label>
                    <textarea
                        className="w-full p-3 rounded-xl border bg-white/50 dark:bg-white/10 outline-none h-32 resize-none"
                        placeholder="Condition, details, etc."
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1">Image URL</label>
                    <input
                        className="w-full p-3 rounded-xl border bg-white/50 dark:bg-white/10 outline-none"
                        placeholder="https://..."
                        value={form.image}
                        onChange={e => setForm({ ...form, image: e.target.value })}
                    />
                </div>

                <button
                    onClick={handleSell}
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg mt-4 disabled:opacity-50"
                >
                    {loading ? 'Listing...' : 'Post Listing 🚀'}
                </button>
            </div>
        </div>
    );
}
