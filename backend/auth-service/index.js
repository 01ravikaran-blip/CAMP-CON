require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = 'super-secret-campus-key-dev-only';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Mongoose Setup ---
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Error: ${error.message}`);
    }
};
connectDB();

// --- Schemas ---
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }, // Plain text for MVP
    role: { type: String, default: 'student' },
    verification_status: { type: String, default: 'pending' },

    // Phase 11: Profile & Social
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    phone: { type: String, default: '' },
    social_links: {
        instagram: String,
        twitter: String,
        linkedin: String
    },
    settings: {
        ghost_mode: { type: Boolean, default: false },
        dark_mode: { type: Boolean, default: false },
        notifications_enabled: { type: Boolean, default: true }
    },
    bookmarks: [{ type: String }], // Array of Post IDs

    // Gamification
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{ type: String }], // 'Early Adopter', 'Event Pro', etc.

    created_at: { type: Date, default: Date.now }
});

const OtpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    code: { type: String, required: true },
    expires_at: { type: Date, required: true }
});

const User = mongoose.model('User', UserSchema);
const Otp = mongoose.model('Otp', OtpSchema);

// --- Email Config ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- Routes ---

/** 
 * POST /auth/send-email-otp
 */
app.post('/auth/send-email-otp', async (req, res) => {
    const { email } = req.body;

    const allowedDomains = ['cuchd.in', 'chitkara.edu.in', 'thapar.edu', 'edu'];
    const isAcademicEmail = allowedDomains.some(domain => email.endsWith(`@${domain}`)) || email.includes('.edu');
    const isAdminEmail = email === '01ravi.karan@gmail.com';

    if (!email || (!isAcademicEmail && !isAdminEmail)) {
        return res.status(400).json({ error: 'Only official university emails are allowed.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store OTP in Mongo (Upsert)
    await Otp.findOneAndUpdate(
        { email },
        { code: otp, expires_at: expiresAt },
        { upsert: true, new: true }
    );

    // Send Email
    const mailOptions = {
        from: '"Smart Campus" <01ravi.karan@gmail.com>', // Simplest format to avoid spam checks
        to: email,
        subject: 'Your Campus Login OTP 🔐',
        text: `Your Smart Campus verification code is: ${otp}\n\nValid for 10 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}`);
        console.log(`🔑 DEV OTP: ${otp}`); // For debugging
        res.json({ message: 'OTP Sent successfully' });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

/**
 * POST /auth/register
 */
app.post('/auth/register', async (req, res) => {
    const { email, otp, username, password } = req.body;

    // 1. Verify OTP
    // DEMO BACKDOOR: '888888' always works
    if (otp !== '888888') {
        const otpRecord = await Otp.findOne({ email });

        if (!otpRecord || otpRecord.code !== otp) {
            return res.status(400).json({ error: 'Invalid or Expired OTP' });
        }

        if (new Date() > otpRecord.expires_at) {
            return res.status(400).json({ error: 'OTP Expired' });
        }

        // Clear OTP only if it was a real one
        await Otp.deleteOne({ email });
    }

    // 2. Create User
    try {
        const lowerUsername = username.toLowerCase();
        const lowerEmail = email.toLowerCase();

        const newUser = await User.create({
            username: lowerUsername,
            email: lowerEmail,
            password,
            verification_status: 'verified'
        });

        // 3. Issue Token
        const token = jwt.sign(
            { user_id: newUser._id, email: lowerEmail, username: lowerUsername, role: 'verified_student' },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Clear OTP
        await Otp.deleteOne({ email });

        res.json({ message: 'Welcome to Campus!', token, user: { id: newUser._id, username, email } });

    } catch (err) {
        if (err.code === 11000) { // Duplicate key error
            return res.status(400).json({ error: 'Username or Email already taken' });
        }
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

/**
 * POST /auth/login
 */
app.post('/auth/login', async (req, res) => {
    const { identifier, password } = req.body;
    const lowerIdentifier = identifier.toLowerCase();

    // Find by email OR username
    const user = await User.findOne({
        $or: [{ email: lowerIdentifier }, { username: lowerIdentifier }],
        password: password
    });

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
        { user_id: user._id, email: user.email, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '30d' }
    );

    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
});

// Internal: Update Claims
app.post('/auth/update-claims', async (req, res) => {
    const { user_id, verification_status, expiry_date } = req.body;

    if (user_id) {
        await User.findByIdAndUpdate(user_id, { verification_status });
    }

    const newToken = jwt.sign(
        { user_id, role: 'verified_student', verification_status, account_expires_on: expiry_date },
        JWT_SECRET,
        { expiresIn: '30d' }
    );
    res.json({ token: newToken });
});

/**
 * GET /user/:username
 * Fetch public profile details
 */
app.get('/user/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username.toLowerCase() }).select('-password -email');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (e) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

/**
 * PUT /user/update
 * Update profile (Bio, Avatar, Socials)
 */
app.put('/user/update', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const { bio, avatar, social_links } = req.body;

        res.json(updatedUser);
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

/**
 * POST /user/bookmark
 * Toggle a post ID in user's bookmarks
 */
app.post('/user/bookmark', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const { postId } = req.body;
        if (!postId) return res.status(400).json({ error: 'Post ID required' });

        const user = await User.findById(decoded.user_id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isBookmarked = user.bookmarks.includes(postId);
        if (isBookmarked) {
            user.bookmarks = user.bookmarks.filter(id => id !== postId);
        } else {
            user.bookmarks.push(postId);
        }

        await user.save();
        res.json({ bookmarks: user.bookmarks, isBookmarked: !isBookmarked });
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
});


app.listen(port, () => {
    console.log(`🔐 Auth Service (MongoDB) running on port ${port}`);
});
