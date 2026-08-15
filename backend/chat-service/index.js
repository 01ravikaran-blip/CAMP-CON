const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

// --- Database ---
// (Reusing same mongo cluster for now)
mongoose.connect(process.env.MONGO_URI).then(() => console.log('💬 Chat DB Connected'));

const MessageSchema = new mongoose.Schema({
    sender: String,
    content: String,
    university: { type: String, index: true }, // For data isolation
    timestamp: { type: Date, default: Date.now },
    room: String // could be "marketplace_item_id" or "dm_user1_user2"
});
const Message = mongoose.model('Message', MessageSchema);

app.get('/messages/:room', async (req, res) => {
    try {
        const msgs = await Message.find({ room: req.params.room }).sort({ timestamp: 1 });
        res.json(msgs);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// NEW: Get active chats for a user
app.get('/chats/:username', async (req, res) => {
    const { username } = req.params;
    const { university } = req.query;
    try {
        // Find distinct rooms where the user is part of the room ID strings "dm_user1_user2"
        // We assume room ID contains the username.

        // 1. Get all unique rooms matching the username AND university
        let filter = { room: { $regex: username } };
        if (university) filter.university = university;
        
        const rooms = await Message.find(filter).distinct('room');

        const chatList = [];
        for (const room of rooms) {
            if (!room.startsWith('dm_')) continue; // Safety check

            // Extract the "other" user
            // Format: dm_userA_userB (alphabetical)
            const parts = room.replace('dm_', '').split('_');
            const otherUser = parts.find(p => p !== username);

            if (!otherUser) continue; // User talking to themselves? or mismatch

            // Get the last message in this room
            const lastMsg = await Message.findOne({ room }).sort({ timestamp: -1 });

            chatList.push({
                id: room, // Use room name as ID
                name: otherUser,
                lastMsg: lastMsg ? lastMsg.content : '',
                time: lastMsg ? lastMsg.timestamp : null,
                sender: lastMsg ? lastMsg.sender : '',
                unread: false // TODO: Add read receipts later
            });
        }

        // Sort by most recent
        chatList.sort((a, b) => new Date(b.time) - new Date(a.time));

        res.json(chatList);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/messages', async (req, res) => {
    const msg = await Message.create(req.body);
    res.json(msg);
});

app.listen(port, () => {
    console.log(`💬 Chat Service running on port ${port}`);
});
