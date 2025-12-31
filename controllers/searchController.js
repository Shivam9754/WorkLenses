const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const handleSearch = async (req, res) => {
  try {
    const { filename, keyword } = req.body;

    if (!filename || !keyword) {
      return res.status(400).json({
        error: 'Filename and keyword are required.'
      });
    }

    const filePath = path.join(__dirname, '../uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found in local storage.'
      });
    }

    let extractedText = '';
    let mediaSegments = null;

    const ext = path.extname(filename).toLowerCase();
    const isMedia = ['.mp3', '.wav', '.mp4', '.mov'].includes(ext);

    // ---- Load content ----
    if (isMedia) {
      const sidecarPath = `${filePath}.transcript.json`;

      if (fs.existsSync(sidecarPath)) {
        const transcriptData = JSON.parse(
          fs.readFileSync(sidecarPath, 'utf-8')
        );
        extractedText = transcriptData.text;
        mediaSegments = transcriptData.segments || [];
      } else {
        extractedText =
          'Audio content analysis not available. Transcript missing.';
        mediaSegments = [];
      }
    } else if (ext === '.pdf') {
      const buffer = fs.readFileSync(filePath);
      const data = await pdf(buffer);
      extractedText = data.text;
    } else {
      extractedText = fs.readFileSync(filePath, 'utf-8');
    }

    // ---- Manual timestamp matches for media ----
    let manualMatches = [];
    if (isMedia && mediaSegments.length > 0) {
      manualMatches = mediaSegments
        .filter(seg =>
          seg.text.toLowerCase().includes(keyword.toLowerCase())
        )
        .map(seg => {
          const minutes = Math.floor(seg.start / 60);
          const seconds = Math.floor(seg.start % 60);
          const timeStr = `${minutes
            .toString()
            .padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`;

          return {
            quote: `[${timeStr}] "${seg.text.trim()}"`,
            context: 'Time-coded match from audio transcript.'
          };
        })
        .slice(0, 5);
    }

    // ---- AI Prompt ----
    const prompt = `
User is searching for keyword: "${keyword}"
${isMedia ? 'Note: This is a transcript of audio/video.' : ''}

Document Content:
"${extractedText.substring(0, 50000)}"

Return STRICT JSON:
{
  "general_definition": "...",
  "document_matches": [
    { "quote": "...", "context": "..." }
  ],
  "summary_verdict": "..."
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            general_definition: { type: Type.STRING },
            document_matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  quote: { type: Type.STRING },
                  context: { type: Type.STRING }
                }
              }
            },
            summary_verdict: { type: Type.STRING }
          },
          required: [
            'general_definition',
            'document_matches',
            'summary_verdict'
          ]
        }
      }
    });

    let result = JSON.parse(response.text);

    // Override with precise timestamps if available
    if (isMedia && manualMatches.length > 0) {
      result.document_matches = manualMatches;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Contextual Search Error:', error);
    res.status(500).json({
      error: 'Intelligence engine failed to execute search.'
    });
  }
};

module.exports = { handleSearch };
