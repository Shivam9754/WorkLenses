
import React, { useState, useCallback } from 'react';
import { FileItem, AnalysisResult } from './types';
import Navbar from './components/Navbar';
import AnalyzerZone from './components/AnalyzerZone';
import { analyzeFileContent } from './services/geminiService';

const App: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);

  const handleFileDrop = useCallback(async (file: FileItem) => {
    if (!file) {
      setAnalysisResult(null);
      setCurrentFile(null);
      return;
    }

    setCurrentFile(file);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const result = await analyzeFileContent(
        file.name, 
        file.contentSnippet, 
        file.type,
        file.base64Data,
        file.mimeType
      );
      setAnalysisResult(result);
    } catch (err) {
      console.error("Analysis failed", err);
      setAnalysisResult({ markdown: "# Analysis Failed\nUnable to connect to intelligence engine. Please try again or use a smaller file." });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#030712] overflow-hidden selection:bg-lime-500/30">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 relative bg-[#030712] transition-all duration-300">
          <AnalyzerZone 
            onFileDrop={handleFileDrop} 
            isAnalyzing={isAnalyzing} 
            result={analysisResult}
            currentFile={currentFile}
          />
        </main>
      </div>

      {/* Subtle Lime Ambience */}
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vh] bg-lime-500/5 blur-[120px] rounded-full -z-10"></div>
    </div>
  );
};

export default App;
