const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// File Upload Config (Local Storage for MVP)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Helper: Delete file after processing (Data Minimization)
const cleanupFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
    });
};

/**
 * POST /verify
 * Accepts: 'id_document' (image file)
 * Returns: Extracted OCR data + Verification Status
 */
app.post('/verify', upload.single('id_document'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No ID document provided' });
    }

    const imagePath = req.file.path;
    console.log(`Processing verification for: ${imagePath}`);

    // Validate File Type (Tesseract only supports images)
    if (!req.file.mimetype.startsWith('image/')) {
        cleanupFile(imagePath);
        return res.status(400).json({ error: 'Unsupported file type. Please upload an image (PNG/JPG).' });
    }

    try {
        // 1. Perform OCR
        const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');

        console.log('--- OCR Extracted Text ---');
        console.log(text);
        console.log('--------------------------');

        // 2. Fuzzy Validation Logic (Robust against OCR typos)
        const Fuse = require('fuse.js');
        const keywords = [
            'student', 'scholar', 'enrol', 'identity card', 'id card', // Generic
            'university', 'college', 'institute', 'school', 'campus',  // Generic
            'chandigarh university', 'chandigarh', 'cu',               // SPECIFIC: CU Keywords
            '2025', '2026', '2027', '2028', '2029'                     // Valid Years (Current + Future Batches)
        ];

        // Setup Fuse to find these keywords in the messy OCR text
        const fuse = new Fuse(keywords, {
            includeScore: true,
            threshold: 0.4,
        });

        // Search for matches in the extracted text (split by words to help fuse)
        const words = text.split(/\s+/);
        let foundKeywords = [];

        words.forEach(word => {
            const results = fuse.search(word);
            if (results.length > 0) {
                foundKeywords.push(results[0].item);
            }
        });

        // Deduplicate findings
        foundKeywords = [...new Set(foundKeywords)];
        console.log("Fuzzy Matched Keywords:", foundKeywords);

        // Verification Scoring
        let confidence = 0;

        // Tier 1: Strong Indicators
        if (foundKeywords.some(k => ['identity card', 'id card', 'enrol'].includes(k))) confidence += 30;
        if (foundKeywords.some(k => ['chandigarh university', 'chandigarh', 'cu'].includes(k))) confidence += 50;

        // Tier 2: Context Indicators
        if (foundKeywords.some(k => ['student', 'scholar'].includes(k))) confidence += 20;
        if (foundKeywords.some(k => ['university', 'college', 'institute', 'school'].includes(k))) confidence += 10;

        // Tier 3: Validity (Years)
        if (foundKeywords.some(k => ['2026', '2027', '2028', '2029'].includes(k))) confidence += 20;

        // SPECIFIC REGEX FOR CU ID (e.g. 25BCS80022)
        const cuIdPattern = /\d{2}\s*[A-Z]{3}\s*\d{5}/i;
        if (cuIdPattern.test(text)) {
            console.log("Found CU ID Pattern!");
            confidence += 60;
            foundKeywords.push("Expected ID Format (xxXXXxxxxx)");
        }

        // EXPIRY DATE EXTRACTION
        // Looks for "Valid Till : JUN-2028" or similar
        const expiryPattern = /VALID\s*TILL\s*[:\-\.]?\s*([A-Z]{3}[-\s]\d{4})/i;
        const expiryMatch = text.match(expiryPattern);
        let extractedExpiry = null;

        if (expiryMatch) {
            extractedExpiry = expiryMatch[1]; // e.g., "JUN-2028"
            console.log("Found Expiry Date:", extractedExpiry);

            // Check if expired logic could go here (using date-fns), but for MVP we assume presence = good
            confidence += 20;
        }

        // 3. Determine University Name
        let universityName = "Unknown University";
        if (foundKeywords.some(k => ['chandigarh university', 'chandigarh', 'cu'].includes(k))) {
            universityName = "Chandigarh University";
        } else if (foundKeywords.some(k => k.toLowerCase().includes('chitkara'))) {
            universityName = "Chitkara University";
        } else if (foundKeywords.some(k => k.toLowerCase().includes('thapar'))) {
            universityName = "Thapar University";
        }

        let verificationStatus = 'REJECTED';

        // SECURITY HARDENING:
        if (confidence >= 80) {
            verificationStatus = 'APPROVED';
        } else if (confidence >= 40) {
            verificationStatus = 'MANUAL_REVIEW';
        }

        // 4. Response
        const result = {
            status: verificationStatus,
            confidence_score: confidence,
            extracted_data: {
                university: universityName,
                raw_text_snippet: text.substring(0, 100).replace(/\n/g, ' ') + '...',
                expiry_date: extractedExpiry, // Return this for Auth Service to use
                flags: {
                    keywords_found: foundKeywords
                }
            }
        };

        // 4. Cleanup (Privacy First: Delete raw image immediately)
        cleanupFile(imagePath);

        res.json(result);

    } catch (error) {
        console.error('OCR Error:', error);
        cleanupFile(imagePath);
        res.status(500).json({ error: 'Verification processing failed' });
    }
});

app.listen(port, () => {
    console.log(`🛡️ Verification Service (The Fortress) running on port ${port}`);
});
