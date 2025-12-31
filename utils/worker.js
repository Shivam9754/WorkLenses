
const { GoogleGenAI, Type } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function analyzeFile(filePath, fileName, mimeType) {
    try {
        let filePart = null;
        let extractedText = '';
        let isMedia = false;

        // 1. Handle File Types
        if (mimeType === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            extractedText = data.text;
            filePart = { text: extractedText };
        } 
        else if (mimeType.startsWith('text/') || mimeType === 'application/json') {
            extractedText = fs.readFileSync(filePath, 'utf-8');
            filePart = { text: extractedText };
        } 
        else if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) {
            isMedia = true;
            const fileData = fs.readFileSync(filePath);
            const base64Data = fileData.toString('base64');
            filePart = {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            };
        }

        // 2. Prepare Prompt
        const prompt = `
            Analyze the following file content.
            Filename: ${fileName}
            
            **TASK:**
            1. Identify the document/file type (Contract, Meeting, Creative, etc.).
            2. Provide a structured summary.
            3. List key risks and recommendations.
            ${isMedia ? '4. Since this is media, provide a summary of the spoken content.' : ''}
        `;

        // 3. Call Gemini
        const response = await ai.models.generateContent({
            model: isMedia ? 'gemini-2.5-flash-native-audio-preview-09-2025' : 'gemini-3-flash-preview',
            contents: [{
                parts: [
                    filePart,
                    { text: prompt }
                ]
            }],
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

        // 4. Save Sidecar for Search Controller (Simulating Transcript)
        // Since we don't have a word-for-word transcript from Gemini JSON mode easily without huge token cost,
        // we save the summary as the "text" for search purposes.
        if (isMedia) {
             const sidecarPath = `${filePath}.transcript.json`;
             const sidecarData = {
                 text: result.summary, // Fallback to summary for search
                 segments: [] // No timestamps available in this mode
             };
             fs.writeFileSync(sidecarPath, JSON.stringify(sidecarData));
        }

        return result;

    } catch (error) {
        console.error("Worker Execution Error:", error);
        return {
            status: "error",
            title: "Processing Failed",
            summary: "Could not analyze file due to internal error.",
            risks: [String(error.message)],
            recommendations: ["Retry with a different file format"]
        };
    }
}

module.exports = { analyzeFile };
