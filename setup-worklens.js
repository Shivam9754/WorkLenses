
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * WORKLENS BACKEND SCAFFOLDING SCRIPT
 * Acts as a Build Tool to instantly provision the Deal Intelligence API.
 */

const BACKEND_DIR = 'backend';
const folders = [
  BACKEND_DIR,
  path.join(BACKEND_DIR, 'uploads'),
  path.join(BACKEND_DIR, 'controllers'),
  path.join(BACKEND_DIR, 'utils'),
  path.join(BACKEND_DIR, 'routes'),
  path.join(BACKEND_DIR, 'models'),
];

console.log('🏗️  Scaffolding WorkLens Backend Infrastructure...');

// 1. Directory Setup
folders.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// 2. Dependency Management
const packageJson = {
  name: "worklens-backend",
  version: "1.0.0",
  description: "WorkLens Deal Intelligence Engine",
  main: "server.js",
  scripts: {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  dependencies: {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.3.1",
    "@google/genai": "^1.34.0",
    "pdf-parse": "^1.1.1",
    "mongoose": "^8.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "nodemailer": "^6.9.7"
  }
};

fs.writeFileSync(path.join(BACKEND_DIR, 'package.json'), JSON.stringify(packageJson, null, 2));
console.log('✅ Initialized package.json with Auth & Database dependencies');

// 3. Environment Configuration
const envContent = `PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/worklens
JWT_SECRET=worklens_secure_key_999
API_KEY=YOUR_GEMINI_API_KEY_HERE
# SMTP_HOST=smtp.example.com
# SMTP_USER=user
# SMTP_PASS=pass
`;
fs.writeFileSync(path.join(BACKEND_DIR, '.env'), envContent);
console.log('✅ Created .env with placeholder credentials');

// ==========================================
// FILE GENERATION
// ==========================================

// --- Models ---
const userModel = `
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('User', userSchema);
`;
fs.writeFileSync(path.join(BACKEND_DIR, 'models', 'User.js'), userModel);

// --- Utils: Email ---
const emailUtil = `
const nodemailer = require('nodemailer');
const sendVerificationEmail = async (email, code) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('\\n=== WORKLENS SECURITY ===');
    console.log(\`[DEV MODE] To: \${email}\`);
    console.log(\`[DEV MODE] Code: \${code}\`);
    console.log('=========================\\n');
    return;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: '"WorkLens Security" <no-reply@worklens.ai>',
      to: email,
      subject: 'WorkLens Verification Code',
      text: \`Code: \${code}\`,
    });
  } catch (error) {
    console.error('[EMAIL ERROR]', error);
  }
};
module.exports = { sendVerificationEmail };
`;
fs.writeFileSync(path.join(BACKEND_DIR, 'utils', 'email.js'), emailUtil);

// --- Utils: Worker (Intelligence) ---
const workerJs = `
const { GoogleGenAI, Type } = require('@google/genai');
const fs = require('fs');
const pdf = require('pdf-parse');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function analyzeFile(filePath, fileName, mimeType) {
    try {
        let filePart = null;
        let extractedText = '';
        let isMedia = false;

        if (mimeType === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            extractedText = data.text;
            filePart = { text: extractedText };
        } else if (mimeType.startsWith('text/') || mimeType === 'application/json') {
            extractedText = fs.readFileSync(filePath, 'utf-8');
            filePart = { text: extractedText };
        } else if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) {
            isMedia = true;
            const fileData = fs.readFileSync(filePath);
            const base64Data = fileData.toString('base64');
            filePart = { inlineData: { mimeType: mimeType, data: base64Data } };
        }

        const prompt = \`Analyze \${fileName}. Identify type, summary, risks, recommendations.\`;
        
        const response = await ai.models.generateContent({
            model: isMedia ? 'gemini-2.5-flash-native-audio-preview-09-2025' : 'gemini-3-flash-preview',
            contents: [{ parts: [filePart || { text: "No content" }, { text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        status: { type: Type.STRING },
                        title: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        risks: { type: Type.ARRAY, items: { type: Type.STRING } },
                        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["status", "title", "summary", "risks", "recommendations"]
                }
            }
        });

        const result = JSON.parse(response.text || "{}");
        
        if (isMedia) {
             const sidecarPath = \`\${filePath}.transcript.json\`;
             fs.writeFileSync(sidecarPath, JSON.stringify({ text: result.summary, segments: [] }));
        }
        return result;
    } catch (error) {
        console.error("Worker Error:", error);
        return { status: "error", title: "Failed", summary: "Error processing file", risks: [], recommendations: [] };
    }
}
module.exports = { analyzeFile };
`;
fs.writeFileSync(path.join(BACKEND_DIR, 'utils', 'worker.js'), workerJs);

// --- Controllers: Auth ---
const authController = `
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../utils/email');
const JWT_SECRET = process.env.JWT_SECRET;

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (await User.findOne({ $or: [{ email }, { username }] })) return res.status(400).json({ error: 'User exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    await new User({ username, email, password: hashedPassword, verificationCode: code }).save();
    await sendVerificationEmail(email, code);
    res.status(201).json({ message: 'Code sent', email });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.verify = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.verificationCode !== code) return res.status(400).json({ error: 'Invalid code' });
    
    user.isVerified = true; user.verificationCode = undefined;
    await user.save();
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ error: 'Invalid credentials' });
    if (!user.isVerified) return res.status(403).json({ error: 'Not verified' });
    
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
`;
fs.writeFileSync(path.join(BACKEND_DIR, 'controllers', 'authController.js'), authController);

// --- Controllers: Upload ---
const uploadController = `
const { analyzeFile } = require('../utils/worker');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, \`\${Date.now()}-\${file.originalname}\`)
});
const upload = multer({ storage });

const handleUpload = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file" });
    try {
        const result = await analyzeFile(req.file.path, req.file.originalname, req.file.mimetype);
        res.json({ success: true, file: { storedName: req.file.filename, name: req.file.originalname }, analysis: result });
    } catch (e) { res.status(500).json({ error: e.message }); }
};
module.exports = { upload, handleUpload };
`;
fs.writeFileSync(path.join(BACKEND_DIR, 'controllers', 'uploadController.js'), uploadController);

// --- Controllers: Search ---
const searchController = `
const fs = require('fs');
const path = require('path');
const { GoogleGenAI, Type } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const handleSearch = async (req, res) => {
  try {
    const { filename, keyword } = req.body;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    // Simple text extraction (fallback to sidecar if media)
    let text = "Content unavailable";
    if (fs.existsSync(filePath)) text = fs.readFileSync(filePath, 'utf-8');
    const sidecar = \`\${filePath}.transcript.json\`;
    if (fs.existsSync(sidecar)) text = JSON.parse(fs.readFileSync(sidecar)).text;

    const prompt = \`Define "\${keyword}" and find it in: \${text.substring(0, 10000)}\`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    general_definition: {type: Type.STRING},
                    document_matches: {type: Type.ARRAY, items: {type: Type.OBJECT, properties: {quote: {type:Type.STRING}, context: {type:Type.STRING}}}},
                    summary_verdict: {type: Type.STRING}
                },
                required: ["general_definition", "document_matches", "summary_verdict"]
            }
        }
    });
    res.json(JSON.parse(response.text));
  } catch (e) { res.status(500).json({ error: e.message }); }
};
module.exports = { handleSearch };
`;
fs.writeFileSync(path.join(BACKEND_DIR, 'controllers', 'searchController.js'), searchController);

// --- Routes ---
const authRoutes = `
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
router.post('/signup', authController.signup);
router.post('/verify', authController.verify);
router.post('/login', authController.login);
module.exports = router;
`;
fs.writeFileSync(path.join(BACKEND_DIR, 'routes', 'authRoutes.js'), authRoutes);

// --- Server.js ---
const serverJs = `
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const { upload, handleUpload } = require('./controllers/uploadController');
const { handleSearch } = require('./controllers/searchController');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.post('/api/upload', upload.single('file'), handleUpload);
app.post('/api/search', handleSearch);
app.get('/api/health', (req, res) => res.json({ status: 'active' }));

app.listen(PORT, () => {
    console.log(\`✅ WorkLens Backend running on port \${PORT}\`);
});
`;
fs.writeFileSync(path.join(BACKEND_DIR, 'server.js'), serverJs);

console.log('✅ Generated Server & Routes');

// 5. Execution
try {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { cwd: BACKEND_DIR, stdio: 'inherit' });
  console.log('✅ Dependencies installed.');
} catch (err) {
  console.log('⚠️  Please run "npm install" inside the backend folder manually.');
}

console.log('✨ Backend Ready. Run "cd backend && npm start" to launch.');
