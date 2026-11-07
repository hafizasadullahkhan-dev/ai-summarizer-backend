const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);

// 1. Security: Restrict CORS (Only allow your frontend)
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));

app.use(express.json());

// 2. Security: Rate Limiting (Max 10 requests per minute per IP)
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 requests per window
    message: { error: 'Too many requests from this IP, please try again after a minute.' }
});
app.use('/api/', apiLimiter);

// 3. Initialize Google GenAI
// Check if API key exists before starting
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ FATAL ERROR: GEMINI_API_KEY is missing in .env file");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 4. Health Check Endpoint (For deployment monitoring)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

// 5. Summarize Endpoint
app.post('/api/summarize', async (req, res) => {
    const { text, length } = req.body;

    // Input Validation
    if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Please provide text to summarize.' });
    }
    if (text.length > 10000) {
        return res.status(400).json({ error: 'Text is too long. Maximum limit is 10,000 characters.' });
    }

    // Length validation and Prompt generation
    let instructions = "Summarize in 4 concise bullet points.";
    if (length === "short") {
        instructions = "Summarize in 2 short, direct bullet points.";
    } else if (length === "long") {
        instructions = "Provide a comprehensive bullet-point summary.";
    }

    try {
        // Fixed Model Name: gemini-2.0-flash (Latest and Fastest)
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash', 
            contents: `${instructions}\n\nText:\n${text}`,
        });

        res.json({ summary: response.text });
    } catch (error) {
        console.error("AI Error Logged Internally:", error);
        // Send generic error to user to prevent leaking system info
        res.status(500).json({ error: 'Failed to generate summary. Please try again later.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});