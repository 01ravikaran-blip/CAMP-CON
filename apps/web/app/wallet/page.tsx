"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function WalletPage() {
    const router = useRouter();
    const { user: clerkUser, isLoaded } = useUser();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [transfer, setTransfer] = useState({ to: '', amount: '' });
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        if (isLoaded && clerkUser) {
            const username = clerkUser.username || clerkUser.firstName || 'Student';
            const userObj = { username };
            setCurrentUser(userObj);
            fetchWalletData(username);
        } else if (isLoaded && !clerkUser) {
            setLoading(false);
        }
    }, [isLoaded, clerkUser]);

    const fetchWalletData = async (username: string) => {
        if (!username) {
            setLoading(false);
            return;
        }

        try {
            const WALLET_URL = process.env.NODE_ENV === 'production'
                ? 'https://camp-con-wallet.onrender.com'
                : 'http://localhost:3007';

            // Get Balance
            const balRes = await fetch(`${WALLET_URL}/wallet/${username}`);
            const balData = await balRes.json();
            setBalance(balData.balance);

            // Get History
            const txRes = await fetch(`${WALLET_URL}/transactions/${username}`);
            const txData = await txRes.json();
            setTransactions(txData);
        } catch (e) {
            console.error("Wallet fetch failed", e);
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async () => {
        const username = clerkUser?.username || clerkUser?.firstName || 'Student';
        if (!username || !transfer.to || !transfer.amount) return alert('Fill details');

        try {
            const WALLET_URL = process.env.NODE_ENV === 'production'
                ? 'https://camp-con-wallet.onrender.com'
                : 'http://localhost:3007';

            const res = await fetch(`${WALLET_URL}/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromUser: username,
                    toUser: transfer.to,
                    amount: parseFloat(transfer.amount),
                    type: 'transfer'
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Sent! 💸');
                setTransfer({ to: '', amount: '' });
                fetchWalletData(username);
            } else {
                alert('Transfer Failed');
            }
        } catch (e) {
            alert('Error');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 pb-24">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="text-xl">←</button>
                <h1 className="text-2xl font-bold">Campus Wallet 💳</h1>
            </div>

            {/* Card */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-2xl shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10">
                    <p className="opacity-80 text-sm font-bold mb-1">Total Balance</p>
                    <h2 className="text-4xl font-bold">© {balance.toLocaleString()}</h2>
                    <p className="mt-4 opacity-60 text-xs">Campus Credits (Non-Monetary)</p>
                </div>
                <div className="absolute -right-4 -bottom-10 opacity-20 text-9xl">💰</div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="glass p-4 rounded-xl">
                    <h3 className="font-bold mb-2 text-green-400">Send Credits 💸</h3>
                    <input
                        className="w-full bg-white/10 p-2 rounded mb-2 text-sm outline-none"
                        placeholder="Username"
                        value={transfer.to}
                        onChange={e => setTransfer({ ...transfer, to: e.target.value })}
                    />
                    <input
                        type="number"
                        className="w-full bg-white/10 p-2 rounded mb-2 text-sm outline-none"
                        placeholder="Amount"
                        value={transfer.amount}
                        onChange={e => setTransfer({ ...transfer, amount: e.target.value })}
                    />
                    <button
                        onClick={handleTransfer}
                        className="w-full bg-green-600 py-2 rounded font-bold text-sm"
                    >
                        Send
                    </button>
                </div>
                <div className="glass p-4 rounded-xl flex flex-col justify-center items-center text-center opacity-50">
                    <h3 className="font-bold mb-1">Add Funds</h3>
                    <p className="text-xs">Go to Admin Block to purchase credits via Cash/UPI.</p>
                </div>
            </div >

            {/* History */}
            <h3 className="font-bold mb-4">Transaction History</h3>
            <div className="space-y-3">
                {transactions.map((tx: any) => (
                    <div key={tx._id} className="glass p-3 rounded-xl flex justify-between items-center">
                        <div>
                            <p className="font-bold text-sm">
                                {tx.from_user === currentUser?.username ? `To: ${tx.to_user}` : `From: ${tx.from_user}`}
                            </p>
                            <p className="text-xs opacity-50">{new Date(tx.timestamp).toLocaleDateString()}</p>
                        </div>
                        <p className={`font-bold ${tx.to_user === currentUser?.username ? 'text-green-500' : 'text-red-500'}`}>
                            {tx.to_user === currentUser?.username ? '+' : '-'} {tx.amount}
                        </p>
                    </div>
                ))}
                {transactions.length === 0 && <p className="opacity-50 text-center text-sm">No transactions yet.</p>}
            </div>
        </div >
    );
}
