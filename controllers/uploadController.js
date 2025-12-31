
const multer = require('multer');
const path = require('path');

// Configure disk storage for initial local ingestion
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate a unique identifier to prevent naming collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

/**
 * File Filter to enforce strictly allowed formats
 * Docs: PDF, TXT, DOCX
 * Audio: MP3, WAV
 * Video: MP4, MOV
 */
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.txt', '.docx', '.mp3', '.wav', '.mp4', '.mov'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Security Protocol: File type ${ext} is not authorized for analysis.`), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB Cap for Multi-Modal Assets
  }
});

/**
 * Controller to handle successful uploads and trigger mock intelligence feedback
 */
const handleUpload = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Data Stream Empty: No file received.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let fileCategory = 'document';
    
    if (['.mp3', '.wav'].includes(ext)) fileCategory = 'audio';
    if (['.mp4', '.mov'].includes(ext)) fileCategory = 'video';

    // Simulated Intelligence Processing Response
    // This allows the frontend dashboard to trigger state updates immediately
    res.status(200).json({
      success: true,
      status: 'uploaded',
      analysisStatus: 'pending',
      file: {
        id: req.file.filename,
        originalName: req.file.originalname,
        storedName: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        category: fileCategory,
        uri: `/uploads/${req.file.filename}`
      },
      intelligence: {
        message: 'Intelligence ingestion successful. Analysis engine queued.',
        estimatedWait: '3-5 seconds'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Failure during file ingestion.' });
  }
};

module.exports = {
  upload,
  handleUpload
};
