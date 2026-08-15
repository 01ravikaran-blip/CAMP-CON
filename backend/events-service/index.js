const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// --- Database ---
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`📣 Events DB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Error: ${error.message}`);
    }
};
connectDB();

// --- Schema ---
const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    date: Date,
    location: {
        name: String,
        lat: Number,
        lng: Number
    },
    organizer: {
        username: String,
        id: String
    },
    category: String, // Sports, Tech, Music
    attendees: [{ type: String }], // User IDs
    university: { type: String, index: true }, // For data isolation
    created_at: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', EventSchema);

// --- Routes ---

app.get('/events', async (req, res) => {
    try {
        const { university } = req.query;
        let filter = {};
        if (university) filter.university = university;
        const events = await Event.find(filter).sort({ date: 1 });
        res.json(events);
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.post('/events', async (req, res) => {
    try {
        const newEvent = await Event.create(req.body);
        res.json(newEvent);
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.post('/events/:id/rsvp', async (req, res) => {
    const { userId } = req.body;
    try {
        const event = await Event.findById(req.params.id);
        if (!event.attendees.includes(userId)) {
            event.attendees.push(userId);
            await event.save();
        }
        res.json(event);
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.listen(port, () => {
    console.log(`📅 Events Service running on port ${port}`);
});
