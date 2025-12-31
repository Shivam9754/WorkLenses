require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Controllers
const { upload, handleUpload } = require('./controllers/uploadController');
const { handleSearch } = require('./controllers/searchController');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists for local storage
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// CORS Configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadDir));

/**
 * @route POST /api/upload
 * @desc Handles multipart/form-data for Docs, Audio, and Video files.
 */
app.post('/api/upload', upload.single('file'), handleUpload);

/**
 * @route POST /api/search
 * @desc Performs contextual deep search on a specific file using Gemini.
 */
app.post('/api/search', handleSearch);

/**
 * @route POST /api/analyze
 * @desc Backend proxy for Gemini API to keep API keys secure
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { GoogleGenAI } = require("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const { fileName, contentSnippet, type, base64Data, mimeType, prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const isMedia = type?.includes('audio') || type?.includes('video') || type?.includes('mp4') || type?.includes('mp3');
    const modelName = isMedia 
      ? 'gemini-2.0-flash-exp' 
      : 'gemini-2.0-flash-exp';

    const parts = [];
    
    if (base64Data && mimeType) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }
    
    parts.push({ text: prompt });

    const config = {};
    if (!isMedia) {
      config.thinkingConfig = { thinkingBudget: 2048 };
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: config
    });

    res.json({ markdown: response.text || "Analysis failed to generate output." });

  } catch (error) {
    console.error('Analysis Error:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'active', 
    service: 'WorkLens-Intelligence-Engine',
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    details: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[WorkLens] Backend Protocol Active on Port ${PORT}`);
  console.log(`[WorkLens] Local Storage: ${uploadDir}`);
  console.log(`[WorkLens] Environment: ${process.env.NODE_ENV || 'development'}`);
});
