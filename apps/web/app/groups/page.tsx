"use client";

export default function GroupsPage() {
    const groups = [
        { id: 1, name: "Computer Science 2026", members: 420, icon: "💻" },
        { id: 2, name: "Photography Club", members: 85, icon: "📸" },
        { id: 3, name: "Hostel Block A", members: 150, icon: "🏢" },
        { id: 4, name: "Campus Musicians", members: 62, icon: "🎸" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-4 pb-24">
            <h1 className="text-2xl font-bold mb-6">Communities 👥</h1>

            {/* Discovery Feed */}
            <div className="grid grid-cols-2 gap-4">
                {groups.map(g => (
                    <div key={g.id} className="glass p-4 rounded-2xl flex flex-col items-center text-center border border-white/10 hover:scale-105 transition-transform">
                        <div className="w-12 h-12 text-3xl mb-2">{g.icon}</div>
                        <h3 className="font-bold text-sm mb-1">{g.name}</h3>
                        <p className="text-xs opacity-50 mb-3">{g.members} Members</p>
                        <button className="text-xs bg-blue-600 px-4 py-1.5 rounded-full font-bold">Join</button>
                    </div>
                ))}
            </div>

            {/* Create Group */}
            <div className="fixed bottom-24 right-6">
                <button className="bg-pink-600 text-white rounded-full p-4 shadow-xl font-bold">
                    + New Group
                </button>
            </div>
        </div>
    );
}
