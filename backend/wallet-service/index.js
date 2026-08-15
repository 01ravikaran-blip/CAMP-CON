const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3007;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI).then(() => console.log('💰 Wallet DB Connected'));

// --- Ledger Schema ---
const TransactionSchema = new mongoose.Schema({
    from_user: String, // 'SYSTEM' for minting
    to_user: String,
    amount: Number,
    type: { type: String, enum: ['transfer', 'mint', 'marketplace_buy'] },
    reference_id: String, // e.g., Item ID
    timestamp: { type: Date, default: Date.now }
});

const WalletSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    balance: { type: Number, default: 0 }
});

const Transaction = mongoose.model('Transaction', TransactionSchema);
const Wallet = mongoose.model('Wallet', WalletSchema);

// --- Routes ---

// Get Balance
app.get('/wallet/:username', async (req, res) => {
    let wallet = await Wallet.findOne({ username: req.params.username });
    if (!wallet) wallet = await Wallet.create({ username: req.params.username, balance: 1000 }); // Free 1000 credits signup bonus
    res.json(wallet);
});

// Transfer Funds
app.post('/transfer', async (req, res) => {
    const { from, to, amount, type, reference_id } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const sender = await Wallet.findOne({ username: from }).session(session);
        const receiver = await Wallet.findOne({ username: to }).session(session);

        if (!sender || sender.balance < amount) {
            throw new Error('Insufficient funds');
        }

        sender.balance -= amount;
        if (!receiver) {
            await Wallet.create([{ username: to, balance: amount }], { session });
        } else {
            receiver.balance += amount;
            await receiver.save({ session });
        }
        await sender.save({ session });

        await Transaction.create([{ from_user: from, to_user: to, amount, type, reference_id }], { session });

        await session.commitTransaction();
        res.json({ success: true, new_balance: sender.balance });
    } catch (e) {
        await session.abortTransaction();
        res.status(400).json({ error: e.message });
    } finally {
        session.endSession();
    }
});

// History
app.get('/transactions/:username', async (req, res) => {
    const txs = await Transaction.find({
        $or: [{ from_user: req.params.username }, { to_user: req.params.username }]
    }).sort({ timestamp: -1 });
    res.json(txs);
});

app.listen(port, () => {
    console.log(`💰 Wallet Service running on port ${port}`);
});
