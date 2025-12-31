
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { GoogleGenAI, Type } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const handleSearch = async (req, res) => {
  try {
    const { filename, keyword } = req.body;

    if (!filename || !keyword) {
      return res.status(400).json({ error: "Filename and keyword are required." });
    }

    const filePath = path.join(__dirname, '../uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found in local storage." });
    }

    let extractedText = "";
    let mediaSegments = null;
    const ext = path.extname(filename).toLowerCase();
    const isMedia = ['.mp3', '.wav', '.mp4', '.mov'].includes(ext);

    // 1. Load Content based on Type
    if (isMedia) {
        // Look for the Sidecar Transcript created by worker.js
        const sidecarPath = `${filePath}.transcript.json`;
        if (fs.existsSync(sidecarPath)) {
            const transcriptData = JSON.parse(fs.readFileSync(sidecarPath, 'utf-8'));
            extractedText = transcriptData.text;
            mediaSegments = transcriptData.segments;
        } else {
            // GRACEFUL FALLBACK: If transcript isn't ready or failed, just use filename and generic prompt
            console.warn("Transcript missing, falling back to metadata search.");
            extractedText = "Audio content analysis not available. Please rely on general knowledge or file metadata.";
            mediaSegments = [];
        }
    } else if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        extractedText = data.text;
    } else {
        extractedText = fs.readFileSync(filePath, 'utf-8');
    }

    // 2. Perform Keyword Search 
    // If it's media, we manually find timestamps to ensure accuracy, 
    // then feed that info to Gemini or format it directly.
    
    let manualMatches = [];
    if (isMedia && mediaSegments && mediaSegments.length > 0) {
        // Filter segments locally for precision
        manualMatches = mediaSegments
            .filter(seg => seg.text.toLowerCase().includes(keyword.toLowerCase()))
            .map(seg => {
                const minutes = Math.floor(seg.start / 60);
                const seconds = Math.floor(seg.start % 60);
                const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                return {
                    quote: `[${timeStr}] "${seg.text.trim()}"`,
                    context: "Time-coded match from audio transcript."
                };
            })
            .slice(0, 5); // Limit to top 5 matches
    }

    // 3. AI Hybrid Analysis
    const prompt = `
User is searching for keyword: "${keyword}"
${isMedia ? `Note: This is a TRANSCRIPT (or summary) of an audio/video file.` : ''}

Document Content: "${extractedText.substring(0, 50000)}"

TASK:
1. Define "${keyword}" generally (internal knowledge).
2. Analyze how "${keyword}" is specifically used in the Document Content.

OUTPUT JSON (Strict):
{
  "general_definition": "A 2-sentence explanation of what this concept means.",
  "document_matches": [
    {
      "quote": "The exact sentence...",
      "context": "Brief explanation of context..."
    }
  ],
  "summary_verdict": "A 1-sentence conclusion about the keyword's relevance in this file."
}
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
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
                required: ["general_definition", "document_matches", "summary_verdict"]
            }
        }
    });

    let result = JSON.parse(response.text);

    // Override AI matches with precise Time-Coded matches for Media files if available
    if (isMedia && manualMatches.length > 0) {
        result.document_matches = manualMatches;
    }

    res.json(result);

  } catch (error) {
    console.error("Contextual Search Error:", error);
    res.status(500).json({ error: "Intelligence engine failed to execute search." });
  }
};

module.exports = { handleSearch };
