import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  Timer,
  Settings,
  Flame,
  Award,
  Sparkles,
  Volume2,
  VolumeX,
  Bell,
  CheckCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

type PomodoroMode = 'focus' | 'short_break' | 'long_break';

export interface CompletedCycle {
  id: string;
  mode: PomodoroMode;
  durationMinutes: number;
  completedAt: string;
}

export interface PomodoroViewProps {
  focusTime: number;
  setFocusTime: React.Dispatch<React.SetStateAction<number>>;
  shortBreakTime: number;
  setShortBreakTime: React.Dispatch<React.SetStateAction<number>>;
  longBreakTime: number;
  setLongBreakTime: React.Dispatch<React.SetStateAction<number>>;
  mode: PomodoroMode;
  setMode: React.Dispatch<React.SetStateAction<PomodoroMode>>;
  secondsRemaining: number;
  setSecondsRemaining: React.Dispatch<React.SetStateAction<number>>;
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  soundEnabled: boolean;
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  stats: CompletedCycle[];
  setStats: React.Dispatch<React.SetStateAction<CompletedCycle[]>>;
  handleSwitchMode: (newMode: PomodoroMode) => void;
  handleReset: () => void;
}

export const PomodoroView: React.FC<PomodoroViewProps> = ({
  focusTime,
  setFocusTime,
  shortBreakTime,
  setShortBreakTime,
  longBreakTime,
  setLongBreakTime,
  mode,
  setMode,
  secondsRemaining,
  setSecondsRemaining,
  isRunning,
  setIsRunning,
  soundEnabled,
  setSoundEnabled,
  stats,
  setStats,
  handleSwitchMode,
  handleReset,
}) => {
  // Total duration helper based on active mode
  const getModeDuration = (currentMode: PomodoroMode): number => {
    switch (currentMode) {
      case 'focus':
        return focusTime * 60;
      case 'short_break':
        return shortBreakTime * 60;
      case 'long_break':
        return longBreakTime * 60;
      default:
        return 25 * 60;
    }
  };

  // Start / Pause Control Toggle
  const toggleStartPause = () => {
    setIsRunning(!isRunning);
  };

  // Clean all completed cycle stats
  const handleClearStats = () => {
    const confirmClear = window.confirm('Deseja realmente limpar seu histórico local de ciclos de pomodoro?');
    if (confirmClear) {
      setStats([]);
    }
  };

  // Fast Preset Configs
  const applyPreset = (focus: number, short: number, long: number) => {
    setIsRunning(false);
    setFocusTime(focus);
    setShortBreakTime(short);
    setLongBreakTime(long);
    // update display duration based on current mode
    if (mode === 'focus') setSecondsRemaining(focus * 60);
    else if (mode === 'short_break') setSecondsRemaining(short * 60);
    else if (mode === 'long_break') setSecondsRemaining(long * 60);
  };

  // Math variables for the dynamic Progress Circular Ring
  const totalModeDurationSeconds = getModeDuration(mode);
  const percentRemaining = (secondsRemaining / totalModeDurationSeconds) * 100;
  const strokeDashoffset = 282.6 - (282.6 * percentRemaining) / 100; // Radius 45 -> Circumference 282.6

  // UI Theme Styling variables depending on 'focus' versus break modes
  const isFocusMode = mode === 'focus';
  const themeColorClass = isFocusMode ? 'text-red-500' : (mode === 'short_break' ? 'text-emerald-400' : 'text-blue-400');
  const themeBgLightClass = isFocusMode ? 'bg-red-500/10' : (mode === 'short_break' ? 'bg-emerald-500/10' : 'bg-blue-500/10');
  const themeBorderClass = isFocusMode ? 'border-red-500/20' : (mode === 'short_break' ? 'border-emerald-500/20' : 'border-blue-500/20');

  // Format countdown string (MM:SS)
  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Timer className="w-5 h-5 text-red-400" />
            Foco Pomodoro
          </h2>
          <p className="text-xs text-[#919196] mt-0.5">Customizar, gerenciar e treinar seus próprios ciclos de produtividade</p>
        </div>

        {/* Quick controls on header */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-[#1C1C1F] border border-[#242427] hover:border-[#343437] rounded-xl text-[#919196] hover:text-white transition cursor-pointer"
            title={soundEnabled ? 'Silenciar Alerta' : 'Ativar Som de Alerta'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main dual layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Interative Timer Core (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#121214] border border-[#242427] rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-xs">
            {/* Visual background gradient pulse representing mood changes */}
            <div className={`absolute -inset-40 opacity-5 blur-[120px] transition-all duration-700 pointer-events-none rounded-full ${
              isFocusMode ? 'bg-red-500' : 'bg-emerald-500'
            }`} />

            {/* Mode selection buttons */}
            <div className="bg-[#1C1C1F]/80 border border-[#242427] p-1 rounded-xl flex gap-1 z-10 w-full max-w-sm mb-8">
              <button
                onClick={() => handleSwitchMode('focus')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'focus'
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400 font-bold'
                    : 'text-[#919196] hover:text-white'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                Foco
              </button>
              <button
                onClick={() => handleSwitchMode('short_break')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'short_break'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold'
                    : 'text-[#919196] hover:text-white'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                Descanso
              </button>
              <button
                onClick={() => handleSwitchMode('long_break')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'long_break'
                    ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold'
                    : 'text-[#919196] hover:text-white'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                Longa pausa
              </button>
            </div>

            {/* Visual Circle Progress ring enclosing the countdown */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-8 select-none z-10">
              <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring track */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="transparent"
                  stroke="#1C1C1F"
                  strokeWidth="4"
                />
                {/* Foreground active ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="transparent"
                  stroke={isFocusMode ? '#EF4444' : (mode === 'short_break' ? '#10B981' : '#3B82F6')}
                  strokeWidth="4"
                  strokeDasharray="282.6"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>

              {/* Central Time indicators */}
              <div className="text-center flex flex-col items-center">
                <span className="text-4xl md:text-5xl font-mono font-bold text-white tracking-widest leading-none">
                  {formatCountdown(secondsRemaining)}
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-widest mt-3.5 px-3 py-1 rounded-full border ${themeColorClass} ${themeBgLightClass} ${themeBorderClass}`}>
                  {isFocusMode ? 'Modo Foco' : 'Modo Descanso'}
                </span>
              </div>
            </div>

            {/* Timer action triggers */}
            <div className="flex items-center gap-3 z-10">
              <button
                onClick={toggleStartPause}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl shadow-md cursor-pointer transition transform active:scale-95 ${
                  isRunning
                    ? 'bg-[#2A2A2D] hover:bg-[#323235] text-white border border-[#3A3A3E]'
                    : isFocusMode
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Iniciar
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-3 bg-[#1C1C1F] hover:bg-[#242427] border border-[#242427] text-[#E2E2E2] text-sm font-semibold rounded-xl cursor-pointer transition transform active:scale-95"
                title="Reiniciar Cronômetro"
              >
                <RotateCcw className="w-4 h-4" />
                Resetar
              </button>
            </div>
          </div>

          {/* Quick presets row */}
          <div className="bg-[#121214] border border-[#242427] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#E2E2E2] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <Flame className="w-4 h-4 text-amber-500" />
              Presets Rápidos:
            </span>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => applyPreset(25, 5, 15)}
                className="px-3 py-1.5 bg-[#1C1C1F] hover:bg-[#242427] border border-[#242427] text-xs font-semibold rounded-xl text-[#E2E2E2] transition cursor-pointer"
              >
                Clássico (25/5m)
              </button>
              <button
                onClick={() => applyPreset(50, 10, 20)}
                className="px-3 py-1.5 bg-[#1C1C1F] hover:bg-[#242427] border border-[#242427] text-xs font-semibold rounded-xl text-[#E2E2E2] transition cursor-pointer"
              >
                Intenso (50/10m)
              </button>
              <button
                onClick={() => applyPreset(15, 3, 10)}
                className="px-3 py-1.5 bg-[#1C1C1F] hover:bg-[#242427] border border-[#242427] text-xs font-semibold rounded-xl text-[#E2E2E2] transition cursor-pointer"
              >
                Curto (15/3m)
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Customize Settings inputs & Stats logger (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Custom Settings Config */}
          <div className="bg-[#121214] border border-[#242427] rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-[#919196]" />
              Configurar Duração dos Ciclos
            </h3>

            {/* Focus Duration Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-[#919196] font-medium">Tempo de Foco</label>
                <span className="text-red-400 font-mono font-bold">{focusTime} min</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={focusTime}
                  onChange={(e) => setFocusTime(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#1C1C1F] rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={focusTime}
                  onChange={(e) => setFocusTime(Math.max(1, Number(e.target.value)))}
                  className="w-16 bg-[#1C1C1F] border border-[#242427] rounded-lg text-center text-xs text-white p-1 focus:outline-none focus:border-red-500/50"
                />
              </div>
            </div>

            {/* Short Break Duration Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-[#919196] font-medium">Descanso Curto</label>
                <span className="text-emerald-400 font-mono font-bold">{shortBreakTime} min</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={shortBreakTime}
                  onChange={(e) => setShortBreakTime(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#1C1C1F] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={shortBreakTime}
                  onChange={(e) => setShortBreakTime(Math.max(1, Number(e.target.value)))}
                  className="w-16 bg-[#1C1C1F] border border-[#242427] rounded-lg text-center text-xs text-white p-1 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Long Break Duration Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-[#919196] font-medium">Descanso Longo</label>
                <span className="text-blue-400 font-mono font-bold">{longBreakTime} min</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={longBreakTime}
                  onChange={(e) => setLongBreakTime(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#1C1C1F] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={longBreakTime}
                  onChange={(e) => setLongBreakTime(Math.max(1, Number(e.target.value)))}
                  className="w-16 bg-[#1C1C1F] border border-[#242427] rounded-lg text-center text-xs text-white p-1 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          </div>

          {/* Stats Logging panel */}
          <div className="bg-[#121214] border border-[#242427] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Ciclos Completados Hoje
              </h3>
              {stats.length > 0 && (
                <button
                  onClick={handleClearStats}
                  className="text-[10px] text-red-400 hover:underline cursor-pointer"
                >
                  Limpar histórico
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1C1C1F] p-3 rounded-xl border border-[#242427] text-center">
                <span className="block text-xl font-bold text-red-400 font-mono">
                  {stats.filter((s) => s.mode === 'focus').length}
                </span>
                <span className="text-[10px] text-[#919196] font-semibold">Sessões Foco</span>
              </div>
              <div className="bg-[#1C1C1F] p-3 rounded-xl border border-[#242427] text-center">
                <span className="block text-xl font-bold text-emerald-400 font-mono">
                  {stats.filter((s) => s.mode !== 'focus').length}
                </span>
                <span className="text-[10px] text-[#919196] font-semibold">Descansos</span>
              </div>
            </div>

            {/* List history */}
            <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
              {stats.length > 0 ? (
                stats.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2.5 bg-[#1C1C1F]/40 border border-[#242427] rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-3.5 h-3.5 ${s.mode === 'focus' ? 'text-red-400' : 'text-emerald-400'}`} />
                      <span className="text-[#E2E2E2] font-semibold">
                        {s.mode === 'focus' ? 'Sessão Foco' : 'Descanso'}
                      </span>
                      <span className="text-[10px] text-[#919196]">({s.durationMinutes}m)</span>
                    </div>
                    <span className="text-[10px] text-[#919196] font-mono">{s.completedAt}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-[#919196] text-xs">
                  Nenhum ciclo concluído nesta sessão. Comece seu foco hoje! 🌟
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
