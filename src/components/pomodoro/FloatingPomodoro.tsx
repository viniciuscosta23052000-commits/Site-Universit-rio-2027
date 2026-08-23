import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Timer, ChevronDown, ChevronUp, Coffee, Brain, GripHorizontal } from 'lucide-react';

interface FloatingPomodoroProps {
  mode: 'focus' | 'short_break' | 'long_break';
  secondsRemaining: number;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  handleSwitchMode: (newMode: 'focus' | 'short_break' | 'long_break') => void;
  handleReset: () => void;
}

export const FloatingPomodoro: React.FC<FloatingPomodoroProps> = ({
  mode,
  secondsRemaining,
  isRunning,
  setIsRunning,
  handleSwitchMode,
  handleReset,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  // Dragging states
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const formatTime = (totalSecs: number): string => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeColor = () => {
    if (mode === 'focus') return 'bg-red-500 border-red-500/30 text-white';
    return 'bg-emerald-500 border-emerald-500/30 text-white';
  };

  const getModeLabel = () => {
    if (mode === 'focus') return 'Foco';
    if (mode === 'short_break') return 'Intervalo';
    return 'Pausa Longa';
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) {
      return;
    }
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const x = Math.max(10, Math.min(window.innerWidth - 150, e.clientX - dragOffset.x));
    const y = Math.max(10, Math.min(window.innerHeight - 80, e.clientY - dragOffset.y));
    setPosition({ x, y });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const style: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        bottom: 'auto',
        right: 'auto',
        touchAction: 'none',
      }
    : {
        touchAction: 'none',
      };

  return (
    <div 
      id="floating-pomodoro-container"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={style}
      className={`fixed bottom-24 right-6 z-45 transition-shadow select-none ${
        isDragging ? 'shadow-2xl opacity-90 cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {isCollapsed ? (
        /* COLLAPSED PILL */
        <div
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-xl border ${
            isRunning ? getModeColor() : 'bg-[#121214] border-[#242427] text-white'
          }`}
        >
          <GripHorizontal className="w-3.5 h-3.5 text-[#52525B]" />
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-2 cursor-pointer"
          >
            {mode === 'focus' ? <Brain className="w-4 h-4 animate-pulse" /> : <Coffee className="w-4 h-4" />}
            <span className="font-mono font-bold text-xs">
              {formatTime(secondsRemaining)}
            </span>
            <ChevronUp className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      ) : (
        /* EXPANDED PANEL CARD */
        <div className="w-64 bg-[#121214] border border-[#242427] p-4 rounded-2xl shadow-2xl space-y-3">
          {/* Header */}
          <div className="flex justify-between items-center pb-1.5 border-b border-[#242427]/60">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#919196]">
              <GripHorizontal className="w-3.5 h-3.5 text-blue-400" />
              <span>Pomodoro</span>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-lg hover:bg-[#1C1C1F] text-[#919196] hover:text-white transition cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Time Dial Representation */}
          <div className="text-center py-0.5">
            <span
              className={`inline-block text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full mb-1.5 ${
                mode === 'focus' ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
              }`}
            >
              {getModeLabel()}
            </span>
            <div className="text-3xl font-mono font-extrabold text-white">
              {formatTime(secondsRemaining)}
            </div>
          </div>

          {/* Quick switch toggles inside floating frame */}
          <div className="grid grid-cols-2 gap-1 bg-[#1C1C1F] p-1 rounded-xl">
            <button
              onClick={() => handleSwitchMode('focus')}
              className={`py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                mode === 'focus' ? 'bg-red-500 text-white shadow' : 'text-[#919196] hover:text-white'
              }`}
            >
              Estudar
            </button>
            <button
              onClick={() => handleSwitchMode('short_break')}
              className={`py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                mode !== 'focus' ? 'bg-emerald-500 text-white shadow' : 'text-[#919196] hover:text-white'
              }`}
            >
              Descansar
            </button>
          </div>

          {/* Controls button strip */}
          <div className="flex gap-2 justify-center pt-1">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex-1 justify-center ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Iniciar
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="p-2 bg-[#1C1C1F] hover:bg-[#242427] border border-[#242427] rounded-xl text-[#919196] hover:text-white transition cursor-pointer"
              title="Resetar tempo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="text-[8px] text-[#52525B] text-center">
            Arraste pelas bordas para mover
          </div>
        </div>
      )}
    </div>
  );
};
