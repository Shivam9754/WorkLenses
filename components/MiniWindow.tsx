
import React, { useState, useRef, useEffect } from 'react';
import { FileItem, AppSource } from '../types';

interface MiniWindowProps {
  source: AppSource;
  files: FileItem[];
  onClose: () => void;
  loading: boolean;
}

const MiniWindow: React.FC<MiniWindowProps> = ({ source, files, onClose, loading }) => {
  const [position, setPosition] = useState({ x: 320, y: 100 });
  const [size, setSize] = useState({ width: 380, height: 480 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const initialSize = useRef({ width: 0, height: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartPos.current = { x: e.clientX, y: e.clientY };
    initialSize.current = { width: size.width, height: size.height };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStartPos.current.x;
        const deltaY = e.clientY - resizeStartPos.current.y;
        setSize({
          width: Math.max(300, initialSize.current.width + deltaX),
          height: Math.max(300, initialSize.current.height + deltaY)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  const onDragStart = (e: React.DragEvent, file: FileItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(file));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Determine snippet length based on window width
  const getSnippet = (text: string) => {
    if (size.width < 450) return text.substring(0, 60) + "...";
    if (size.width < 600) return text.substring(0, 150) + "...";
    return text;
  };

  return (
    <div 
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`
      }}
      className="fixed glass rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] border border-white/10 z-[100] overflow-hidden flex flex-col transition-shadow hover:shadow-[0_30px_80px_-10px_rgba(163,230,53,0.1)]"
    >
      {/* Header */}
      <div 
        onMouseDown={handleMouseDown}
        className="h-12 bg-zinc-900 px-4 flex items-center justify-between cursor-move select-none border-b border-white/5"
      >
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse"></div>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{source} Node</span>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-black/40">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-6 h-6 border-2 border-lime-500/20 border-t-lime-500 rounded-full animate-spin"></div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Synchronizing...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600">
            <p className="text-[10px] uppercase font-bold tracking-widest">No Intelligence Detected</p>
          </div>
        ) : (
          files.map(file => (
            <div 
              key={file.id}
              draggable
              onDragStart={(e) => onDragStart(e, file)}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-lime-500/50 hover:bg-lime-500/[0.03] transition-all cursor-grab active:cursor-grabbing group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="flex-shrink-0 p-2 bg-zinc-900 rounded-lg text-zinc-500 group-hover:text-lime-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-zinc-200 truncate font-semibold group-hover:text-white transition-colors">{file.name}</span>
                </div>
                <span className="text-[9px] text-zinc-600 font-bold whitespace-nowrap ml-2">{file.size}</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium transition-all duration-300">
                {getSnippet(file.contentSnippet)}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Footer / Resize Handle */}
      <div className="p-2 bg-zinc-900 border-t border-white/5 text-center relative">
        <p className="text-[9px] text-zinc-600 uppercase font-bold tracking-[0.2em] select-none">Drag to Analysis Port</p>
        <div 
          onMouseDown={handleResizeStart}
          className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-0.5 group"
        >
          <svg className="w-2.5 h-2.5 text-zinc-700 group-hover:text-lime-500 transition-colors" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM14 22H12V20H14V22ZM18 18H16V16H18V18ZM22 14H20V12H22V14Z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default MiniWindow;
