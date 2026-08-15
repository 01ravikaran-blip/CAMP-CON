const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

// --- Database ---
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`📣 Marketplace DB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Error: ${error.message}`);
    }
};
connectDB();

// --- Schema ---
const ItemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,
    category: { type: String, default: 'General' }, // Books, Electronics, Furniture
    images: [String], // URL to images
    seller: {
        username: String,
        id: String
    },
    location: {
        lat: Number,
        lng: Number
    },
    status: { type: String, default: 'available' }, // available, sold, pending
    university: { type: String, index: true }, // For data isolation
    created_at: { type: Date, default: Date.now }
});

const Item = mongoose.model('Item', ItemSchema);

// --- Routes ---

/**
 * GET /items
 * Fetch available items. Optional filter by category.
 */
app.get('/items', async (req, res) => {
    try {
        const { category, search, university } = req.query;
        let query = { status: 'available' };

        if (category && category !== 'All') {
            query.category = category;
        }

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        if (university) {
            query.university = university;
        }

        const items = await Item.find(query).sort({ created_at: -1 }).limit(50);
        res.json(items);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

/**
 * GET /items/:id
 * Get details of a single item
 */
app.get('/items/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item);
    } catch (e) {
        res.status(500).json({ error: 'Error fetching item' });
    }
});

/**
 * POST /items
 * List a new item for sale
 */
app.post('/items', async (req, res) => {
    try {
        const { title, price, description, category, images, seller, location, university } = req.body;

        if (!title || !price || !seller) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newItem = await Item.create({
            title,
            price,
            description,
            category,
            images,
            seller,
            location,
            university
        });

        res.json(newItem);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to list item' });
    }
});

/**
 * PUT /items/:id/sold
 * Mark item as sold
 */
app.put('/items/:id/sold', async (req, res) => {
    try {
        const item = await Item.findByIdAndUpdate(req.params.id, { status: 'sold' }, { new: true });
        res.json(item);
    } catch (e) {
        res.status(500).json({ error: 'Update failed' });
    }
});

app.listen(port, () => {
    console.log(`🏪 Marketplace Service (MongoDB) running on port ${port}`);
});
