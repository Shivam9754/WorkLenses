require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Controllers
const { upload, handleUpload } = require('./controllers/uploadController');
const { handleSearch } = require('./controllers/searchController');

// Init app FIRST
const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// CORS config
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
 * ROUTES
 */
app.post('/api/upload', upload.single('file'), handleUpload);
app.post('/api/search', handleSearch);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'active',
    service: 'WorkLens-Intelligence-Engine',
    timestamp: new Date().toISOString()
  });
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    details:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'An error occurred'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[WorkLens] Backend running on port ${PORT}`);
  console.log(`[WorkLens] Local Storage: ${uploadDir}`);
  console.log(`[WorkLens] Environment: ${process.env.NODE_ENV || 'development'}`);
});
