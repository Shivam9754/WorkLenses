<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# WorkLens - AI-Powered Document Intelligence

An advanced document analysis platform powered by Google's Gemini AI. WorkLens provides deep, contextual analysis of documents, contracts, presentations, and media files with professional-grade insights.

## 🚀 Features

- **Universal File Analysis**: Support for PDFs, DOCX, TXT, MP3, WAV, MP4, and MOV files
- **AI-Powered Insights**: Deep document analysis using Google Gemini AI
- **Contextual Search**: Find and analyze specific keywords within documents
- **Multi-Format Support**: Text documents, audio transcripts, and video analysis
- **Real-Time Processing**: Drag-and-drop interface with immediate feedback
- **Secure API Management**: Backend proxy for API key security

## 📋 Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd WorkLens
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and add your API key:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=5000
NODE_ENV=development
VITE_API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

⚠️ **Important**: Never commit your `.env.local` file to version control!

## 🏃 Running Locally

### Option 1: Run Frontend and Backend Together (Recommended)

```bash
npm run dev:full
```

This starts both:
- Frontend (Vite): `http://localhost:3000`
- Backend (Express): `http://localhost:5000`

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## 📦 Building for Production

### 1. Build the Frontend

```bash
npm run build
```

This creates optimized production files in the `dist/` directory.

### 2. Preview Production Build

```bash
npm run preview
```

### 3. Production Deployment

For production, you'll need to:

1. **Build the frontend**: `npm run build`
2. **Serve static files**: Configure your server to serve the `dist/` directory
3. **Run the backend**: `NODE_ENV=production node server.js`
4. **Set environment variables**: Ensure all production environment variables are set

## 🌐 Deployment Options

### Deploy to Vercel (Frontend) + Backend on Railway/Render

**Frontend (Vercel):**
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable: `VITE_API_URL=https://your-backend-url.com`

**Backend (Railway/Render):**
1. Connect your GitHub repository
2. Set start command: `node server.js`
3. Add environment variables:
   - `GEMINI_API_KEY`
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-frontend-url.vercel.app`

### Deploy to Single Server (VPS/EC2)

```bash
# Build frontend
npm run build

# Serve static files through Express
# Add this to server.js:
app.use(express.static('dist'));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

# Start with PM2 for process management
npm install -g pm2
pm2 start server.js --name worklens
pm2 save
```

## 🔒 Security Considerations

### Production Checklist

- [ ] **API Keys**: Never expose API keys in frontend code
- [ ] **CORS**: Configure `FRONTEND_URL` to your actual frontend domain
- [ ] **HTTPS**: Use HTTPS in production
- [ ] **Rate Limiting**: Consider adding rate limiting to API endpoints
- [ ] **File Upload Limits**: Current limit is 50MB (configurable in `uploadController.js`)
- [ ] **Input Validation**: Implement additional validation for user inputs
- [ ] **Error Handling**: Ensure errors don't expose sensitive information

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `GEMINI_API_KEY` | ✅ Yes | Your Google Gemini API key | - |
| `PORT` | No | Backend server port | 5000 |
| `NODE_ENV` | No | Environment (development/production) | development |
| `VITE_API_URL` | No | Backend API URL for frontend | http://localhost:5000 |
| `FRONTEND_URL` | No | Frontend URL for CORS | http://localhost:3000 |

## 🏗️ Architecture

```
WorkLens/
├── components/          # React components
│   ├── AnalyzerZone.tsx # Main file analysis interface
│   ├── ErrorBoundary.tsx # Error handling wrapper
│   └── ...
├── services/           # API services
│   └── geminiService.ts # Backend API communication
├── controllers/        # Backend controllers
│   ├── uploadController.js
│   └── searchController.js
├── server.js          # Express backend server
├── App.tsx            # Main React application
└── index.tsx          # Application entry point
```

## 🔧 Configuration

### Supported File Types

- **Documents**: PDF, TXT, DOCX
- **Audio**: MP3, WAV
- **Video**: MP4, MOV

To add more file types, edit `controllers/uploadController.js`:

```javascript
const allowedExtensions = ['.pdf', '.txt', '.docx', '.mp3', '.wav', '.mp4', '.mov', '.your-format'];
```

### AI Model Configuration

Current models are configured in `server.js`. To use different Gemini models:

```javascript
const modelName = 'gemini-2.0-flash-exp'; // Change to your preferred model
```

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Backend won't start
- Ensure all dependencies are installed: `npm install`
- Check if port 5000 is available: `lsof -i :5000`
- Verify `.env.local` exists and contains `GEMINI_API_KEY`

### Frontend can't connect to backend
- Check that backend is running on correct port
- Verify `VITE_API_URL` in `.env.local` matches backend URL
- Check browser console for CORS errors

### API Key errors
- Verify your Gemini API key is valid
- Check you're using `GEMINI_API_KEY` (not `API_KEY`)
- Ensure `.env.local` is in the root directory

## 📊 API Endpoints

### Backend API

- `POST /api/analyze` - Analyze file content
- `POST /api/upload` - Upload file for processing
- `POST /api/search` - Search within uploaded file
- `GET /api/health` - Health check endpoint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🔗 Links

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Original AI Studio App](https://ai.studio/apps/drive/16-5nJ9aa6VLe5xS0XS_UH_mbIewKrQFe)

## 💬 Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section above

---

**Built with ❤️ using React, TypeScript, and Google Gemini AI**
