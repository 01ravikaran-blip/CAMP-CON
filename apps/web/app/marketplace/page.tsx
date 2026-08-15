'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Book, Laptop, Bike, Home, Wrench, Search, Plus, QrCode, ArrowRight, X } from 'lucide-react';
import { useToast } from '../../components/Toast';
import VerifiedGate from '../../components/VerifiedGate';

const CATEGORIES = [
  { id: 'All', icon: ShoppingBag },
  { id: 'Books', icon: Book },
  { id: 'Electronics', icon: Laptop },
  { id: 'Vehicles', icon: Bike },
  { id: 'Hostels', icon: Home },
  { id: 'Freelance', icon: Wrench },
];

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [isPayDrawerOpen, setIsPayDrawerOpen] = useState(false);
  const { showToast } = useToast();

  // Mock data for UI presentation
  const mockListings = [
    { id: '1', title: 'Engineering Mathematics Vol 2', category: 'Books', priceINR: 450, pricePoints: 900, seller: 'John D.', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400' },
    { id: '2', title: 'Used Scientific Calculator', category: 'Electronics', priceINR: 600, pricePoints: 1200, seller: 'Alice M.', image: 'https://images.unsplash.com/photo-1574607383476-f517f260d30b?auto=format&fit=crop&q=80&w=400' },
    { id: '3', title: 'Hostel Mattress (Like New)', category: 'Hostels', priceINR: 1200, pricePoints: 2400, seller: 'Bob S.', image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=400' },
  ];

  const filteredListings = mockListings.filter(l => 
    (activeCategory === 'All' || l.category === activeCategory) &&
    l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePayUPI = async () => {
    if (!selectedListing) return;
    try {
      const res = await fetch('/api/marketplace/upi-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: selectedListing.id, amount: selectedListing.priceINR })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Opening UPI App...', 'success');
        window.location.href = data.upiIntentString; // Triggers mobile UPI intent
      }
    } catch (e) {
      showToast('Payment failed to initialize', 'error');
    }
  };

  const handleEscrowPoints = async () => {
    // Escrow logic simulation
    showToast('Points locked in Escrow safely!', 'success');
    setIsPayDrawerOpen(false);
    setSelectedListing(null);
  };

  return (
    <div className="min-h-screen pt-24 pb-24 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8">
        <h1 className="text-3xl font-black tracking-tight">Campus Marketplace</h1>
        
        {/* Search & Categories */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search textbooks, electronics..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 dark:bg-black/20 border border-black/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="hidden md:flex items-center gap-2 px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">
            <Plus size={20} /> Sell Item
          </button>
        </div>

        {/* Categories Tab */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl whitespace-nowrap transition-all ${
                  isActive 
                  ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-lg' 
                  : 'bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-300 hover:bg-white/80'
                }`}
              >
                <Icon size={18} />
                {cat.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredListings.map(listing => (
          <motion.div 
            key={listing.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer"
            onClick={() => setSelectedListing(listing)}
          >
            <div className="h-48 w-full relative">
              <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full">
                {listing.category}
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg leading-tight mb-1">{listing.title}</h3>
              <p className="text-sm text-gray-500 mb-4">by {listing.seller}</p>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-black text-xl">₹{listing.priceINR}</div>
                  <div className="text-xs text-blue-500 font-bold">or {listing.pricePoints} ⚡</div>
                </div>
                <button className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* FAB for Mobile */}
      <button className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl z-40 hover:scale-105 active:scale-95 transition-transform">
        <Plus size={24} />
      </button>

      {/* Details / Pay Drawer Modal */}
      <AnimatePresence>
        {selectedListing && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedListing(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setSelectedListing(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/10 rounded-full flex items-center justify-center z-10"
              >
                <X size={20} />
              </button>
              <img src={selectedListing.image} className="w-full h-64 object-cover" />
              <div className="p-6">
                <h2 className="text-2xl font-black mb-1">{selectedListing.title}</h2>
                <p className="text-gray-500 mb-6">Seller: {selectedListing.seller}</p>

                <div className="space-y-3">
                  <button onClick={handlePayUPI} className="w-full p-4 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold flex justify-between items-center transition-colors">
                    <span className="flex items-center gap-2"><QrCode size={20}/> Pay with UPI</span>
                    <span>₹{selectedListing.priceINR}</span>
                  </button>
                  
                  <VerifiedGate actionLabel="Releasing Escrow">
                    <button onClick={handleEscrowPoints} className="w-full p-4 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold flex justify-between items-center transition-colors">
                      <span className="flex items-center gap-2">⚡ Pay via In-App Escrow</span>
                      <span>{selectedListing.pricePoints} pts</span>
                    </button>
                  </VerifiedGate>
                </div>
                
                <p className="text-xs text-gray-400 text-center mt-4">
                  Escrow payments are held safely until you receive the item.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
