const ffmpeg = require('fluent-ffmpeg');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extracts audio from a video file using FFmpeg.
 * @param {string} videoPath - Full path to the video file.
 * @returns {Promise<string>} - Path to the generated temporary audio file.
 */
const extractAudio = (videoPath) => {
  return new Promise((resolve, reject) => {
    const outputAudioPath = videoPath.replace(path.extname(videoPath), '.mp3');
    
    ffmpeg(videoPath)
      .toFormat('mp3')
      .on('end', () => resolve(outputAudioPath))
      .on('error', (err) => reject(err))
      .save(outputAudioPath);
  });
};

/**
 * Transcribes audio using OpenAI Whisper.
 * @param {string} audioPath - Path to the audio file.
 * @returns {Promise<Object>} - Returns object with { text, segments }.
 */
const transcribeMedia = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  let audioPath = filePath;
  let needsCleanup = false;

  // 1. If Video, extract Audio first
  if (['.mp4', '.mov', '.avi', '.mkv'].includes(ext)) {
    console.log(`🎥 Extracting audio from video: ${filePath}`);
    try {
      audioPath = await extractAudio(filePath);
      needsCleanup = true;
    } catch (error) {
      console.error("FFmpeg Extraction Failed:", error);
      throw new Error("Failed to extract audio track from video.");
    }
  }

  // 2. Transcribe with Whisper
  console.log(`🎙️ Transcribing audio: ${audioPath}`);
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
      response_format: "verbose_json", // Critical for timestamps
      timestamp_granularities: ["segment"]
    });

    // 3. Cleanup temp mp3 if it was generated from video
    if (needsCleanup && fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }

    return {
      text: transcription.text,
      segments: transcription.segments // Contains { start, end, text }
    };

  } catch (error) {
    console.error("OpenAI Whisper Error:", error);
    throw new Error("Transcription service failed.");
  }
};

module.exports = { transcribeMedia };
