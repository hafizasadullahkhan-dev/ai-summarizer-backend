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

        // 🚀 Retry Logic with Exponential Backoff
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: `${instructions}\n\nText:\n${text}`,
            });

            // اگر کامیاب ہو گیا تو جواب بھیج کر فنکشن ختم کر دیں
            return res.json({ summary: response.text });

        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed:`, error.message);

            // اگر 503 (High Demand) یا 429 (Rate Limit) کا ایرر ہے تو دوبارہ کوشش کریں
            if (error.status === 503 || error.status === 429) {
                if (attempt < 3) {
                    console.log(`Model is busy. Waiting 3 seconds before retry...`);
                    // 3 سیکنڈ کا انتظار کریں (Exponential Backoff)
                    await new Promise(resolve => setTimeout(resolve, 3000)); 
                    continue; // اگلی کوشش پر جائیں
                }
            }
            // اگر کوئی اور ایرر ہے تو لوپ توڑ دیں
            break; 
        }
    }

    // اگر تینوں کوششیں ناکام ہو جائیں تو صارف کو ایرر بھیجیں
    console.error("AI Error Logged Internally after retries:", lastError);
    res.status(500).json({ 
        error: 'The AI model is currently experiencing high demand. Please try again in a few moments.' 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});