import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileItem, AnalysisResult, SearchResult } from '../types';
import { queryFileIntelligence } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  content?: string;
  searchResult?: SearchResult;
}

interface AnalyzerZoneProps {
  onFileDrop: (file: FileItem) => void;
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  currentFile: FileItem | null;
}

const API_BASE_URL = 'http://127.0.0.1:5000';

const AnalyzerZone: React.FC<AnalyzerZoneProps> = ({ onFileDrop, isAnalyzing, result, currentFile }) => {
  const [isOver, setIsOver] = useState(false);
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Track the filename on the server to enable backend search
  const [serverFilename, setServerFilename] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [result, chatHistory, isQuerying]);

  useEffect(() => {
    setChatHistory([]);
    setServerFilename(currentFile?.serverFilename || null);
  }, [currentFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOver) setIsOver(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX <= rect.left ||
      e.clientX >= rect.right ||
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom
    ) {
      setIsOver(false);
    }
  };

  const uploadToBackend = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log("Attempting upload to:", `${API_BASE_URL}/api/upload`);

  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
  method: 'POST',
  body: formData
});

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
      
      const data = await res.json();
      if (data.success && data.file && data.file.storedName) {
        setServerFilename(data.file.storedName);
        console.log("Backend upload successful:", data.file.storedName);
      }
    } catch (error) {
      console.warn("Backend Upload Failed (Offline Mode Active):", error);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);

    // 1. Internal App Drop
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
      try {
        const file = JSON.parse(jsonData) as FileItem;
        onFileDrop(file);
        return;
      } catch (err) {
        console.error("Internal data parsing failed", err);
      }
    }

    // 2. Native File Drop (Real Files)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const nativeFile = e.dataTransfer.files[0];
      const extension = nativeFile.name.split('.').pop()?.toLowerCase() || '';
      
      let detectedType = 'doc';
      if (['mp3', 'wav', 'm4a'].includes(extension)) detectedType = 'audio';
      if (['mp4', 'mov', 'avi'].includes(extension)) detectedType = 'video';
      if (['pdf'].includes(extension)) detectedType = 'pdf';

      // Trigger Backend Upload for Deep Search Capability
      uploadToBackend(nativeFile);

      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        // CRITICAL: Limit payload size for Frontend XHR calls.
        const isSafePayload = nativeFile.size < 15 * 1024 * 1024; // 15MB Limit
        
        const fileItem: FileItem = {
          id: `local-${Date.now()}`,
          name: nativeFile.name,
          size: (nativeFile.size / 1024).toFixed(1) + ' KB',
          type: detectedType,
          source: 'gdrive', 
          contentSnippet: isSafePayload 
            ? `[NATIVE FILE] ${nativeFile.name} uploaded.`
            : `[LARGE FILE] ${nativeFile.name} (${(nativeFile.size / 1024 / 1024).toFixed(1)}MB). Live preview disabled. Backend analysis running.`,
          base64Data: isSafePayload ? base64Data : undefined,
          mimeType: nativeFile.type
        };

        onFileDrop(fileItem);
      };
      
      reader.readAsDataURL(nativeFile);
    }
  };

  const handleSendMessage = async () => {
    if (!query.trim() || !currentFile || isQuerying) return;

    const userMsg = query;
    setQuery('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsQuerying(true);

    try {
      // 1. Try Backend Contextual Search if file is on server
      if (serverFilename) {
        const res = await fetch(`${API_BASE_URL}/api/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: serverFilename, keyword: userMsg })
        });

        if (res.ok) {
          const searchData: SearchResult = await res.json();
          setChatHistory(prev => [...prev, { role: 'assistant', searchResult: searchData }]);
          setIsQuerying(false);
          return;
        }
      }

      // 2. Fallback to Client-Side Gemini (Chat)
      const context = result ? `${result.markdown}` : currentFile.contentSnippet;
      const response = await queryFileIntelligence(userMsg, context);
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);

    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Error: Intelligence link failed. Please check your connection." }]);
    } finally {
      setIsQuerying(false);
    }
  };

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('email') || t.includes('doc') || t.includes('pdf')) {
      return (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    if (t.includes('audio')) {
      return (
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    );
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-grow flex flex-col h-full overflow-hidden bg-black relative transition-all duration-300 ${
        isOver ? 'bg-white/5' : ''
      }`}
    >
      {/* Drop Overlay */}
      <div className={`absolute inset-0 border border-dashed border-white/0 pointer-events-none transition-all duration-500 z-50 ${isOver ? 'border-white/20 m-4 rounded-[2.5rem] opacity-100 scale-100' : 'opacity-0 scale-[1.02]'}`}>
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] rounded-[2.5rem]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center shadow-2xl mb-6">
             <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
             </svg>
          </div>
          <span className="text-white font-bold uppercase tracking-[0.4em] text-sm">Initialize Analysis</span>
        </div>
      </div>

      {!currentFile && !isAnalyzing ? (
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <div className="max-w-xl w-full text-center space-y-12">
            <div>
              <h2 className="text-6xl sm:text-7xl font-bold text-white tracking-tighter mb-4">WorkLens<span className="text-lime-500">.</span></h2>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-[0.3em]">Deal Intelligence Engine</p>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: "Docs", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                { label: "Audio", icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" },
                { label: "Video", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" }
              ].map((item, i) => (
                <div key={i} className="glass p-6 rounded-3xl border border-white/5 flex flex-col items-center space-y-4 hover:bg-white/5 transition-all cursor-default group">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition-all">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest group-hover:text-zinc-300 transition-colors text-center">{item.label}</span>
                </div>
              ))}
            </div>

            <p className="text-zinc-700 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">
              Secure Drop Zone Active
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col overflow-hidden">
          {/* Scrollable conversation area */}
          <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 sm:p-12 space-y-8 scrollbar-hide pb-32">
            
            {/* Horizontal File Header */}
            <div className="max-w-4xl mx-auto w-full pt-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex items-center p-6 bg-white/[0.02] rounded-3xl border border-white/5 backdrop-blur-sm hover:bg-white/[0.04] transition-colors group">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/10 relative flex-shrink-0">
                  {getFileIcon(currentFile?.type || '')}
                  {isAnalyzing && (
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-black rounded-full border border-lime-500/50 flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                
                <div className="ml-6 flex flex-col justify-center min-w-0">
                   <h3 className="text-white font-bold text-xl sm:text-2xl truncate pr-4">
                     {currentFile?.name}
                   </h3>
                   <div className="flex items-center space-x-3 mt-2">
                      <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{currentFile?.size}</span>
                      <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-medium">
                         {isAnalyzing ? "Processing..." : "Ready"}
                      </p>
                   </div>
                </div>
              </div>
            </div>

            {/* Analysis Result Display */}
            {result ? (
              <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                <div className="glass rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
                  <div className="bg-zinc-900/40 p-8 sm:p-12">
                     <article className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-lime-400 prose-strong:text-white">
                        <ReactMarkdown>{result.markdown}</ReactMarkdown>
                     </article>
                  </div>
                </div>
              </div>
            ) : isAnalyzing && (
              <div className="max-w-4xl mx-auto w-full flex flex-col items-center space-y-4 py-12 animate-pulse">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Running WorkLens Analysis</div>
                <div className="h-0.5 w-32 bg-zinc-900 rounded-full overflow-hidden">
                   <div className="h-full bg-white animate-progress origin-left w-full"></div>
                </div>
              </div>
            )}

            {/* Chat Interaction History */}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`max-w-4xl mx-auto w-full flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                <div className={`rounded-3xl shadow-xl w-full ${
                  msg.role === 'user' 
                    ? 'bg-white text-black font-semibold p-5 max-w-[85%] sm:max-w-[75%] ml-auto' 
                    : 'glass border border-white/10 text-zinc-200'
                }`}>
                  {msg.searchResult ? (
                    <div className="overflow-hidden rounded-2xl">
                      <div className="p-6 bg-zinc-900/60 border-b border-white/5">
                        <div className="flex items-center space-x-2 mb-3">
                           <div className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse"></div>
                           <span className="text-[10px] font-bold text-lime-500 uppercase tracking-widest">Definition</span>
                        </div>
                        <p className="text-lg text-white font-light italic leading-relaxed">
                          "{msg.searchResult.general_definition}"
                        </p>
                      </div>
                      <div className="p-6 space-y-4 bg-zinc-800/20">
                        {msg.searchResult.document_matches.map((match, idx) => (
                           <div key={idx} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                              <p className="text-sm text-zinc-200 font-medium mb-2 border-l-2 border-lime-500/50 pl-3">
                                {match.quote}
                              </p>
                              <p className="text-xs text-zinc-500 leading-relaxed pl-3.5">
                                {match.context}
                              </p>
                           </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-5">
                      <ReactMarkdown className="prose prose-sm prose-invert max-w-none">
                        {msg.content || ''}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isQuerying && (
              <div className="max-w-4xl mx-auto w-full flex justify-start">
                 <div className="flex space-x-2 items-center p-6 glass rounded-2xl border border-white/5">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                 </div>
              </div>
            )}
          </div>

          {/* Minimal Bottom Prompt Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 bg-gradient-to-t from-black via-black/95 to-transparent border-t border-white/5">
            <div className="max-w-4xl mx-auto">
              <div className="relative group">
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={currentFile ? `Ask WorkLens about "${currentFile.name}"...` : "Drop file to start"}
                  disabled={!currentFile || isQuerying}
                  className="w-full bg-zinc-900/80 border border-white/10 rounded-3xl px-8 py-5 pr-16 text-white text-lg placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!currentFile || isQuerying || !query.trim()}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl transition-all active:scale-90 ${
                    query.trim() && !isQuerying ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-600'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none -z-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '48px 48px' }}></div>
    </div>
  );
};

export default AnalyzerZone;
