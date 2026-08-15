const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3003;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Configure Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Serve uploaded files publicly
app.use('/uploads', express.static('uploads'));

// --- Database ---
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`📣 SocialGraph DB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Error: ${error.message}`);
    }
};
connectDB();

// --- Schema ---
const PostSchema = new mongoose.Schema({
    username: String,
    content: String,
    type: { type: String, default: 'post' }, // 'post', 'reel', 'voice', 'album'
    university: { type: String, index: true }, // Added for data isolation
    is_archived: { type: Boolean, default: false },

    // Legacy support (Deprecated)
    media_url: String,
    image_url: String,

    // New Multi-Media Support
    media: [{
        url: String,
        type: { type: String } // 'image', 'video', 'audio'
    }],

    upvotes: [{ type: String }],
    downvotes: [{ type: String }],
    reposts: { type: Number, default: 0 },
    repostedBy: [{ type: String }],
    views: { type: Number, default: 0 }, // Track total views
    is_anonymous: { type: Boolean, default: false },
    tags: String,
    location: {
        lat: Number,
        lng: Number,
        name: String
    },
    comments: [{
        username: String,
        text: String,
        timestamp: { type: Date, default: Date.now }
    }],
    // Advanced Community Notes System
    community_notes_data: {
        requests: [{ type: String }], // Users who requested a note
        is_triggered: { type: Boolean, default: false },
        thread: [{
            username: String,
            text: String,
            is_system: { type: Boolean, default: false }, // AI/System messages
            timestamp: { type: Date, default: Date.now }
        }]
    },
    created_at: { type: Date, default: Date.now }
});

const NotificationSchema = new mongoose.Schema({
    username: String, // Receiver
    actor: String,    // Performer (e.g., person who liked)
    type: String,     // 'like', 'comment', 'repost', 'follow', 'system'
    message: String,
    target_id: String, // Post ID or User ID
    university: { type: String, index: true }, // Added for data isolation
    is_read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', PostSchema);
const UserLocationSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    username: String,
    university: String,
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    lastActive: { type: Date, default: Date.now, expires: 900 } // TTL: 15 minutes (900s)
});
UserLocationSchema.index({ location: '2dsphere' });
const UserLocation = mongoose.model('UserLocation', UserLocationSchema);

const ConnectionRequestSchema = new mongoose.Schema({
    from: String,
    to: String,
    university: String,
    status: { type: String, default: 'pending' },
    timestamp: { type: Date, default: Date.now }
});
const ConnectionRequest = mongoose.model('ConnectionRequest', ConnectionRequestSchema);

const Notification = mongoose.model('Notification', NotificationSchema);

// --- SEARCH & NOTIFICATIONS ---

app.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ posts: [], users: [] });

    try {
        const regex = new RegExp(q, 'i');
        const { university } = req.query;
        let pFilter = {
            $or: [{ content: regex }, { tags: regex }, { username: regex }]
        };
        if (university) pFilter.university = university;

        // Search Posts
        const posts = await Post.find(pFilter).sort({ created_at: -1 }).limit(20);

        // Mock Users Search (Since users are in Auth Service, we can only search active posters here easily or need a cross-service call)
        // For now, satisfy the UI by returning unique usernames found in posts + standard demo names
        const distinctUsers = await Post.distinct('username', { username: regex });
        const users = distinctUsers.map(u => ({ username: u, avatar: null })); // Frontend handles avatar

        res.json({ posts, users });
    } catch (e) {
        res.status(500).json({ error: 'Search failed' });
    }
});

app.get('/notifications', async (req, res) => {
    const { username, university } = req.query;
    if (!username) return res.status(400).json({ error: 'Username required' });

    try {
        let filter = { username };
        if (university) filter.university = university;
        const notifs = await Notification.find(filter).sort({ timestamp: -1 }).limit(50);
        res.json(notifs);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

app.post('/notifications/mark-read', async (req, res) => {
    const { ids } = req.body;
    try {
        await Notification.updateMany({ _id: { $in: ids } }, { $set: { is_read: true } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to update' });
    }
});

// --- Routes ---

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    // Return full URL for local access
    const fileUrl = `http://localhost:3003/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, type: req.file.mimetype });
});

/**
 * GET /posts
 */
app.get('/posts', async (req, res) => {
    try {
        const { username, likedBy, repostedBy, repliedBy, mediaOnly, university } = req.query;
        let filter = {};

        if (username) filter.username = username;
        if (likedBy) filter.upvotes = likedBy; // Map legacy 'likedBy' param to 'upvotes' schema
        if (repostedBy) filter.repostedBy = repostedBy;
        if (repliedBy) filter['comments.username'] = repliedBy;
        if (mediaOnly === 'true') filter.media_url = { $exists: true, $ne: '' };
        if (university) filter.university = university;

        // Default: Active posts only
        filter.is_archived = false;

        const posts = await Post.find(filter).sort({ created_at: -1 }).limit(50);
        res.json(posts);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

/**
 * POST /posts/batch
 * Fetch multiple posts by ID array
 */
app.post('/posts/batch', async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'IDs array required' });

    try {
        const posts = await Post.find({ _id: { $in: ids } }).sort({ created_at: -1 });
        res.json(posts);
    } catch (e) {
        res.status(500).json({ error: 'Batch fetch failed' });
    }
});

/**
 * POST /posts
 */
app.post('/posts', async (req, res) => {
    const { username, content, media, media_url, type, location, tags, is_anonymous, university } = req.body;

    // Validation: Content OR Media required
    const hasMedia = (media && media.length > 0) || media_url;
    if (!content && !hasMedia) return res.status(400).json({ error: 'Content or Media required' });

    try {
        // Normalize Media
        let finalMedia = media || [];

        // Convert single legacy upload to new format if no array provided
        if (finalMedia.length === 0 && media_url) {
            finalMedia.push({
                url: media_url,
                type: type === 'voice' ? 'audio' : type === 'reel' ? 'video' : 'image'
            });
        }

        // Determine Post Type
        let postType = 'post';
        if (finalMedia.length > 1) postType = 'album';
        else if (finalMedia.length === 1) {
            const mType = finalMedia[0].type;
            postType = mType === 'video' ? 'reel' : mType === 'audio' ? 'voice' : 'post';
        }

        const newPost = await Post.create({
            username: username || 'Anonymous',
            content,
            type: postType,
            media: finalMedia,
            // Legacy fallbacks for backward compat
            media_url: finalMedia.length > 0 ? finalMedia[0].url : null,
            image_url: finalMedia.length > 0 && finalMedia[0].type === 'image' ? finalMedia[0].url : null,
            location,
            tags,
            university,
            is_anonymous: is_anonymous || false
        });

        res.json(newPost);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

app.post('/posts/:id/comment', async (req, res) => {
    try {
        const { username, text } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).send('Post not found');

        post.comments.push({ username, text });
        await post.save();

        if (post.username !== username) {
            await Notification.create({
                username: post.username,
                actor: username,
                type: 'comment',
                message: `commented: "${text.substring(0, 20)}..."`,
                target_id: post._id,
                university: post.university,
                timestamp: new Date()
            });
        }

        res.json(post);
    } catch (e) {
        res.status(500).send('Error commenting');
    }
});

// ARCHIVE & DELETE ROUTES
app.delete('/posts/:id', async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.put('/posts/:id/archive', async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, { is_archived: true });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.put('/posts/:id/unarchive', async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, { is_archived: false });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.get('/posts/archived', async (req, res) => {
    const { username } = req.query;
    try {
        const posts = await Post.find({ username, is_archived: true }).sort({ created_at: -1 });
        res.json(posts);
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});

// --- New Social Features ---

// Vote (Up/Down)
// Vote (Up/Down)
app.post('/posts/:id/vote', async (req, res) => {
    const { username, type } = req.body; // type: 'up', 'down', 'remove'
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Not found' });

        // Remove existing votes
        post.upvotes = post.upvotes.filter(u => u !== username);
        post.downvotes = post.downvotes.filter(u => u !== username);

        if (type === 'up') {
            post.upvotes.push(username);
            if (post.username !== username) {
                await Notification.create({
                    username: post.username,
                    actor: username,
                    type: 'like',
                    message: `upvoted your post`,
                    target_id: post._id,
                    university: post.university,
                    timestamp: new Date()
                });
            }
        }
        if (type === 'down') post.downvotes.push(username);

        await post.save();
        res.json(post);
    } catch (e) {
        res.status(500).json({ error: 'Vote failed' });
    }
});

// Repost
app.post('/posts/:id/repost', async (req, res) => {
    const { username } = req.body;
    try {
        const post = await Post.findById(req.params.id);

        if (post.repostedBy.includes(username)) {
            // Undo Repost
            post.repostedBy = post.repostedBy.filter(u => u !== username);
            post.reposts = Math.max(0, post.reposts - 1);
        } else {
            // Add Repost
            post.repostedBy.push(username);
            post.reposts += 1;
        }

        await post.save();
        res.json(post);
    } catch (e) {
        res.status(500).json({ error: 'Repost failed' });
    }
});

// Record View
app.post('/posts/:id/view', async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'View fail' });
    }
});

// Request Community Note
app.post('/posts/:id/request-note', async (req, res) => {
    const { username } = req.body;
    try {
        const post = await Post.findById(req.params.id);

        // Init structure if missing (migration)
        if (!post.community_notes_data) post.community_notes_data = { requests: [], is_triggered: false, thread: [] };

        if (!post.community_notes_data.requests.includes(username)) {
            post.community_notes_data.requests.push(username);
        }

        const requestCount = post.community_notes_data.requests.length;
        const viewCount = post.views || 1; // Avoid divide by zero
        const hoursSinceCreated = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);

        // Threshold Check: 10% of views (min 3 requests) AND Post > 24h old
        const isThresholdMet = (requestCount / viewCount >= 0.10) &&
            requestCount >= 1 &&
            hoursSinceCreated >= 24;

        if (isThresholdMet && !post.community_notes_data.is_triggered) {
            post.community_notes_data.is_triggered = true;
            // "AI" Starts the thread
            post.community_notes_data.thread.push({
                username: 'CommunityBot',
                text: `⚠️ Community Limit Reached (Post > 24h). Users are flagging this post. Please provide context/evidence below to clarify potential misinformation.`,
                is_system: true
            });
        }

        await post.save();
        res.json(post);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Note request failed' });
    }
});

// Add Context to Community Note Thread
app.post('/posts/:id/note-reply', async (req, res) => {
    const { username, text } = req.body;
    try {
        const post = await Post.findById(req.params.id);
        if (!post.community_notes_data?.is_triggered) {
            return res.status(400).json({ error: 'Community notes not active for this post' });
        }

        post.community_notes_data.thread.push({
            username,
            text,
            is_system: false
        });

        await post.save();
        res.json(post);
    } catch (e) {
        res.status(500).json({ error: 'Failed to add note' });
    }
});

// --- PokeBall / Proximity Routes ---

// Update User Location
app.post('/location', async (req, res) => {
    const { userId, username, university, lng, lat } = req.body;
    if (!userId || !lng || !lat) return res.status(400).json({ error: 'Missing data' });

    try {
        await UserLocation.findOneAndUpdate(
            { userId },
            { 
                username, 
                university, 
                location: { type: 'Point', coordinates: [lng, lat] },
                lastActive: new Date() 
            },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Find Nearby Users (50m to 500m)
app.get('/nearby-users', async (req, res) => {
    const { lng, lat, university, maxDistance = 500 } = req.query;
    if (!lng || !lat) return res.status(400).json({ error: 'Location required' });

    try {
        const nearby = await UserLocation.find({
            university, // Only show users from the same university portal
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                    $maxDistance: parseInt(maxDistance) // in meters
                }
            }
        }).limit(20);

        res.json(nearby);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Send PokeBall Connection Request
app.post('/connections/request', async (req, res) => {
    const { from, to, university } = req.body;
    if (!from || !to) return res.status(400).json({ error: 'Missing users' });

    try {
        // 1. Create Request record
        const request = await ConnectionRequest.create({ from, to, university });

        // 2. Notify the target user
        await Notification.create({
            username: to,
            type: 'system',
            message: `🔴 ${from} threw a PokeBall at you! Want to connect?`,
            target_id: request._id,
            university,
            timestamp: new Date()
        });

        res.json({ success: true, message: 'PokeBall Sent! 🔴' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(port, () => {
    console.log(`📣 Social Graph Service (MongoDB) running on port ${port}`);
});
