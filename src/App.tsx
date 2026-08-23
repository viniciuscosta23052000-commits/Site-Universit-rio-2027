import React, { useState, useEffect } from 'react';
import { StorageService } from './lib/storage';
import { AcademicDatabase, Lesson } from './types';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { NotebooksList } from './components/notebooks/NotebooksList';
import { NotebookViewer } from './components/notebooks/NotebookViewer';
import { AcademicEditor } from './components/editor/AcademicEditor';
import { AcademicCalendarView } from './components/calendar/AcademicCalendarView';
import { ScheduleView } from './components/schedule/ScheduleView';
import { TasksView } from './components/tasks/TasksView';
import { FlashcardsView } from './components/flashcards/FlashcardsView';
import { MindMapsView } from './components/mindmaps/MindMapsView';
import { FilesManagerView } from './components/files/FilesManagerView';
import { SettingsView, applyGlobalTheme } from './components/settings/SettingsView';
import { MotivationView } from './components/motivation/MotivationView';
import { PwaService } from './lib/pwa';
import { PomodoroView } from './components/pomodoro/PomodoroView';
import { FloatingPomodoro } from './components/pomodoro/FloatingPomodoro';
import { BoletimView } from './components/semesters/BoletimView';
import { LoginView } from './components/auth/LoginView';
import confetti from 'canvas-confetti';

// Widgets & Modals
import { MusicPlayerWidget } from './components/music/MusicPlayerWidget';
import { TaskModal } from './components/tasks/TaskModal';
import { EventModal } from './components/calendar/EventModal';
import { NotebookModal } from './components/notebooks/NotebookModal';

import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Clock,
  CheckSquare,
  Brain,
  Network,
  FolderOpen,
  Settings,
  Menu,
  X,
  Search,
  Plus,
  Sun,
  Moon,
  Bell,
  GraduationCap,
  Sparkles,
  ChevronRight,
  FileText,
  RefreshCw,
  AlertTriangle,
  Timer,
  LogOut,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'notebooks'
  | 'editor'
  | 'calendar'
  | 'schedule'
  | 'boletim'
  | 'tasks'
  | 'flashcards'
  | 'mindmaps'
  | 'files'
  | 'settings'
  | 'motivation'
  | 'pomodoro';

export default function App() {
  const [db, setDb] = useState<AcademicDatabase>(() => StorageService.getDatabase());
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('app_authenticated') === 'true');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => db.profile.theme === 'dark');

  // Quick Action Modals
  const [quickTaskModalOpen, setQuickTaskModalOpen] = useState(false);
  const [quickEventModalOpen, setQuickEventModalOpen] = useState(false);
  const [quickNotebookModalOpen, setQuickNotebookModalOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [pwaState, setPwaState] = useState(() => PwaService.getSyncState());
  const [initialSettingsTab, setInitialSettingsTab] = useState<'profile' | 'semesters' | 'appearance' | 'backup' | 'pwa'>('profile');
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  // Global Pomodoro State variables
  const [pomoFocusTime, setPomoFocusTime] = useState(25);
  const [pomoShortBreak, setPomoShortBreak] = useState(5);
  const [pomoLongBreak, setPomoLongBreak] = useState(15);
  const [pomoMode, setPomoMode] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const [pomoSecondsRemaining, setPomoSecondsRemaining] = useState(25 * 60);
  const [pomoIsRunning, setPomoIsRunning] = useState(false);
  const [pomoSoundEnabled, setPomoSoundEnabled] = useState(true);
  const [pomoStats, setPomoStats] = useState<any[]>(() => {
    const saved = localStorage.getItem('pomodoro_completed_cycles');
    return saved ? JSON.parse(saved) : [];
  });

  // Core Timer Interval Mechanism in App.tsx
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (pomoIsRunning) {
      timer = setInterval(() => {
        setPomoSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleGlobalPomoCycleCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timer) clearInterval(timer);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pomoIsRunning, pomoMode, pomoFocusTime, pomoShortBreak, pomoLongBreak]);

  // Keep stats persisted in localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro_completed_cycles', JSON.stringify(pomoStats));
  }, [pomoStats]);

  // Sync duration changes when timer is idle
  useEffect(() => {
    if (!pomoIsRunning) {
      let newSecs = 25 * 60;
      if (pomoMode === 'focus') newSecs = pomoFocusTime * 60;
      else if (pomoMode === 'short_break') newSecs = pomoShortBreak * 60;
      else if (pomoMode === 'long_break') newSecs = pomoLongBreak * 60;
      setPomoSecondsRemaining(newSecs);
    }
  }, [pomoFocusTime, pomoShortBreak, pomoLongBreak, pomoMode, pomoIsRunning]);

  const playPomoAlertSound = () => {
    if (!pomoSoundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc1.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(329.63, audioCtx.currentTime); // E4
      osc2.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.4); // E5

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start();
      osc2.start();

      osc1.stop(audioCtx.currentTime + 1.5);
      osc2.stop(audioCtx.currentTime + 1.5);
    } catch (e) {
      console.warn('AudioContext blocked or unsupported:', e);
    }
  };

  const handleGlobalPomoCycleCompletion = () => {
    setPomoIsRunning(false);
    playPomoAlertSound();

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.7 },
      colors: pomoMode === 'focus' ? ['#EF4444', '#F59E0B', '#EEF2F6'] : ['#10B981', '#34D399', '#EEF2F6']
    });

    const newRecord = {
      id: 'cycle-' + Date.now(),
      mode: pomoMode,
      durationMinutes: pomoMode === 'focus' ? pomoFocusTime : (pomoMode === 'short_break' ? pomoShortBreak : pomoLongBreak),
      completedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setPomoStats((prev) => [newRecord, ...prev].slice(0, 50));

    if (pomoMode === 'focus') {
      const confirmNext = window.confirm('Ciclo de FOCO encerrado com sucesso! 🎉 Maravilhoso trabalho. Deseja iniciar seu descanso curto agora?');
      if (confirmNext) {
        handleGlobalPomoSwitchMode('short_break');
      } else {
        handleGlobalPomoSwitchMode('short_break');
      }
    } else {
      const confirmNext = window.confirm('Tempo de DESCANSO concluído! Pronto para reiniciar seu foco e aumentar o rendimento?');
      if (confirmNext) {
        handleGlobalPomoSwitchMode('focus');
      } else {
        handleGlobalPomoSwitchMode('focus');
      }
    }
  };

  const handleGlobalPomoSwitchMode = (newMode: 'focus' | 'short_break' | 'long_break') => {
    setPomoIsRunning(false);
    setPomoMode(newMode);
    
    let newSeconds = 25 * 60;
    if (newMode === 'focus') newSeconds = pomoFocusTime * 60;
    else if (newMode === 'short_break') newSeconds = pomoShortBreak * 60;
    else if (newMode === 'long_break') newSeconds = pomoLongBreak * 60;

    setPomoSecondsRemaining(newSeconds);
  };

  const handleGlobalPomoReset = () => {
    setPomoIsRunning(false);
    let newSeconds = 25 * 60;
    if (pomoMode === 'focus') newSeconds = pomoFocusTime * 60;
    else if (pomoMode === 'short_break') newSeconds = pomoShortBreak * 60;
    else if (pomoMode === 'long_break') newSeconds = pomoLongBreak * 60;
    setPomoSecondsRemaining(newSeconds);
  };

  // Subscribe to PWA service updates
  useEffect(() => {
    const unsubscribe = PwaService.subscribe((state) => {
      setPwaState(state);
    });
    return unsubscribe;
  }, []);

  // Subscribe to persistent storage updates
  useEffect(() => {
    const unsubscribe = StorageService.subscribe((newDb) => {
      setDb(newDb);
    });
    return unsubscribe;
  }, []);

  // Secure Cloud Sync and Session Verification on load
  useEffect(() => {
    const verifySessionAndSync = async () => {
      const token = localStorage.getItem('app_session_token');
      if (!token) {
        setIsAuthenticated(false);
        setIsVerifyingSession(false);
        return;
      }

      try {
        setCloudSyncStatus('syncing');
        // 1. Verify session token against server
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Sessão expirada');
        }

        const data = await response.json();
        localStorage.setItem('app_user_name', data.user.name);
        localStorage.setItem('app_user_email', data.user.email);
        setIsAuthenticated(true);

        // 2. Fetch/pull user's isolated database file
        const syncResponse = await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            clientLastSavedAt: db.lastSavedAt || new Date().toISOString()
          })
        });

        if (syncResponse.ok) {
          const syncResult = await syncResponse.json();
          if (syncResult.database) {
            StorageService.saveDatabase(syncResult.database);
            setDb(syncResult.database);
            setCloudSyncStatus('synced');
          } else {
            // New cloud account: Seed their user-isolated remote database with current local state
            const currentDb = StorageService.getDatabase();
            currentDb.profile.name = data.user.name;
            StorageService.saveDatabase(currentDb);
            setDb(currentDb);

            await fetch('/api/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                database: currentDb,
                clientLastSavedAt: currentDb.lastSavedAt || new Date().toISOString(),
                force: true
              })
            });
            setCloudSyncStatus('synced');
          }
        } else {
          setCloudSyncStatus('error');
        }
      } catch (err) {
        console.error('Falha na validação da sessão:', err);
        localStorage.removeItem('app_authenticated');
        localStorage.removeItem('app_session_token');
        setIsAuthenticated(false);
      } finally {
        setIsVerifyingSession(false);
      }
    };

    if (isAuthenticated) {
      verifySessionAndSync();
    } else {
      setIsVerifyingSession(false);
    }
  }, [isAuthenticated]);

  if (isVerifyingSession) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0B0B0C] text-[#E2E2E2] px-6">
        <div className="w-full max-w-lg space-y-8 text-center animate-pulse">
          <div className="inline-flex p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
            <GraduationCap className="w-12 h-12 text-blue-500 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-white">Carregando seu Espaço de Estudos</h2>
            <p className="text-xs text-[#919196]">Sincronizando seus cadernos com o servidor seguro...</p>
          </div>

          {/* Academic skeleton loader */}
          <div className="bg-[#121214] border border-[#242427] rounded-2xl p-6 text-left space-y-4 shadow-xl">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1C1C1F]" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-[#1C1C1F] rounded-sm w-1/3" />
                <div className="h-2 bg-[#1C1C1F] rounded-sm w-1/2" />
              </div>
            </div>
            <div className="border-t border-[#1C1C1F] pt-4 space-y-2">
              <div className="h-2.5 bg-[#1C1C1F] rounded-sm w-full" />
              <div className="h-2.5 bg-[#1C1C1F] rounded-sm w-5/6" />
              <div className="h-2.5 bg-[#1C1C1F] rounded-sm w-4/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={(name, email, token) => {
          setIsAuthenticated(true);
        }}
      />
    );
  }

  // Dynamic material theme and custom variable injection synchronization
  useEffect(() => {
    applyGlobalTheme(db.profile);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (db.profile.themeMode === 'auto') {
        applyGlobalTheme(db.profile);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, [db.profile]);

  // Keyboard shortcut: Ctrl+K or Cmd+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeSemester = db.semesters.find((s) => s.id === db.profile.activeSemesterId) || db.semesters[0];

  const handleOpenLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
    setActiveTab('editor');
  };

  const handleOpenNotebook = (notebookId: string) => {
    setActiveNotebookId(notebookId);
    setActiveTab('notebooks');
  };

  const handleCreateNewLessonQuickly = () => {
    const targetNotebook = db.notebooks.find((n) => n.semesterId === activeSemester.id) || db.notebooks[0];
    const targetChapter = db.chapters.find((c) => c.notebookId === targetNotebook?.id) || db.chapters[0];

    const lessonCount = db.lessons.length + 1;
    const newLessonId = `lesson-${Date.now()}`;
    const newLesson: Lesson = {
      id: newLessonId,
      chapterId: targetChapter?.id || 'chap-default',
      notebookId: targetNotebook?.id || 'nb-default',
      semesterId: activeSemester.id,
      title: `Aula ${lessonCount < 10 ? '0' + lessonCount : lessonCount} — Nova Anotação`,
      lessonNumber: `Aula ${lessonCount < 10 ? '0' + lessonCount : lessonCount}`,
      professor: '',
      date: new Date().toISOString().split('T')[0],
      contentHtml: `
<h2>1. Objetivos da Aula</h2>
<p>Inicie aqui suas anotações acadêmicas.</p>
      `,
      pageFormat: 'a4',
      pageOrientation: 'portrait',
      templateType: 'traditional',
      canvasElements: [],
      drawings: [],
      attachments: [],
      tags: ['geral'],
      versions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.update((draft) => {
      draft.lessons.push(newLesson);
    });

    handleOpenLesson(newLessonId);
  };

  // Nav Items definition
  const NAV_ITEMS: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Início', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'notebooks',
      label: 'Cadernos Digitais',
      icon: <BookOpen className="w-4 h-4" />,
      badge: db.notebooks.filter((n) => n.semesterId === activeSemester?.id).length,
    },
    {
      id: 'calendar',
      label: 'Calendário & Provas',
      icon: <Calendar className="w-4 h-4" />,
      badge: db.events.filter((e) => !e.isCompleted).length,
    },
    { id: 'schedule', label: 'Grade Horária', icon: <Clock className="w-4 h-4" /> },
    { id: 'boletim', label: 'Boletim de Notas', icon: <GraduationCap className="w-4 h-4 text-emerald-400" /> },
    {
      id: 'tasks',
      label: 'Tarefas & Trabalhos',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: db.tasks.filter((t) => t.status !== 'done').length,
    },
    {
      id: 'flashcards',
      label: 'Flashcards Leitner',
      icon: <Brain className="w-4 h-4" />,
    },
    { id: 'mindmaps', label: 'Mapas Mentais', icon: <Network className="w-4 h-4" /> },
    { id: 'files', label: 'Arquivos & PDFs', icon: <FolderOpen className="w-4 h-4" /> },
    {
      id: 'motivation',
      label: 'Motivação',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    },
    { id: 'pomodoro', label: 'Foco Pomodoro', icon: <Timer className="w-4 h-4 text-red-400" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-4 h-4" /> },
  ];

  // If in Editor view full screen
  if (activeTab === 'editor' && activeLessonId) {
    return (
      <div className="min-h-screen bg-background text-[#E2E2E2]">
        <AcademicEditor
          lessonId={activeLessonId}
          onBack={() => {
            setActiveTab('notebooks');
            setActiveLessonId(null);
          }}
        />
        <MusicPlayerWidget />
        <FloatingPomodoro
          mode={pomoMode}
          secondsRemaining={pomoSecondsRemaining}
          isRunning={pomoIsRunning}
          setIsRunning={setPomoIsRunning}
          handleSwitchMode={handleGlobalPomoSwitchMode}
          handleReset={handleGlobalPomoReset}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-[#E2E2E2] flex flex-col font-sans selection:bg-blue-500/30">
      {/* Top Main Navigation Header */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-[#919196] hover:bg-[#1C1C1F] hover:text-white transition"
              aria-label="Abrir menu"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              onClick={() => {
                setActiveTab('dashboard');
                setActiveNotebookId(null);
              }}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-semibold tracking-tight text-white leading-none">
                  UniNotes Pro
                </h1>
                <p className="text-[10px] text-[#919196] tracking-wider uppercase mt-1 font-medium">
                  {db.profile.course}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Search trigger (Ctrl+K) */}
          <button
            onClick={() => setGlobalSearchOpen(true)}
            className="flex-1 max-w-xs md:max-w-md hidden sm:flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#1C1C1F] border border-[#242427] text-xs text-[#919196] hover:border-blue-500/50 hover:text-[#E2E2E2] transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#636366]" />
              Pesquisar anotações, arquivos, tarefas...
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#2A2A2D] text-[10px] font-mono text-[#E2E2E2] border border-[#3A3A3E]">
              ⌘K
            </kbd>
          </button>

          {/* Right Actions: Semester, New Button, Theme toggle, Profile avatar */}
          <div className="flex items-center gap-3">
            {/* Active Semester Switcher Pill */}
            <select
              value={db.profile.activeSemesterId}
              onChange={(e) => {
                StorageService.update((draft) => {
                  draft.profile.activeSemesterId = e.target.value;
                  draft.semesters.forEach((s) => {
                    s.isActive = s.id === e.target.value;
                  });
                });
              }}
              className="hidden md:block px-3 py-1.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-xs font-medium text-[#E2E2E2] hover:border-blue-500/50 cursor-pointer shadow-xs focus:outline-none"
            >
              {db.semesters.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#1C1C1F] text-white">
                  {s.name}
                </option>
              ))}
            </select>

            {/* Quick "+ Criar" Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Criar</span>
              </button>

              <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#121214] border border-[#242427] rounded-2xl shadow-2xl py-2 hidden group-hover:block animate-in fade-in zoom-in-95 duration-150 z-50">
                <button
                  onClick={handleCreateNewLessonQuickly}
                  className="w-full px-3.5 py-2 text-left text-xs text-[#E2E2E2] hover:bg-[#1C1C1F] hover:text-white flex items-center gap-2.5 transition"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  Nova Aula / Nota
                </button>
                <button
                  onClick={() => setQuickTaskModalOpen(true)}
                  className="w-full px-3.5 py-2 text-left text-xs text-[#E2E2E2] hover:bg-[#1C1C1F] hover:text-white flex items-center gap-2.5 transition"
                >
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  Nova Tarefa
                </button>
                <button
                  onClick={() => setQuickEventModalOpen(true)}
                  className="w-full px-3.5 py-2 text-left text-xs text-[#E2E2E2] hover:bg-[#1C1C1F] hover:text-white flex items-center gap-2.5 transition"
                >
                  <Calendar className="w-4 h-4 text-purple-400" />
                  Nova Prova / Evento
                </button>
                <button
                  onClick={() => setQuickNotebookModalOpen(true)}
                  className="w-full px-3.5 py-2 text-left text-xs text-[#E2E2E2] hover:bg-[#1C1C1F] hover:text-white flex items-center gap-2.5 border-t border-[#242427] mt-1 pt-2 transition"
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  Novo Caderno
                </button>
              </div>
            </div>

            {/* Cloud Sync Status Badge */}
            <div className="hidden sm:flex items-center">
              {pwaState.status === 'synced' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-wider select-none" title="Todos os seus dados acadêmicos estão salvos de forma segura na nuvem!">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span>Nuvem Salva</span>
                </div>
              )}
              {pwaState.status === 'syncing' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-[10px] font-bold uppercase tracking-wider select-none animate-pulse" title="Sincronizando notas e metas com o servidor...">
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                  <span>Sincronizando</span>
                </div>
              )}
              {pwaState.status === 'offline' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-[10px] font-bold uppercase tracking-wider select-none" title="Você está offline. As alterações serão salvas localmente e enviadas assim que reestabelecida a conexão.">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  <span>Modo Offline</span>
                </div>
              )}
              {pwaState.status === 'error' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-wider select-none" title="Erro ao salvar dados na nuvem. Verifique sua conexão.">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  <span>Erro de Sync</span>
                </div>
              )}
              {pwaState.status === 'conflict' && (
                <button 
                  onClick={() => PwaService.syncWithServer(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition" 
                  title="Conflito de dados detectado. Clique aqui para forçar salvar sua versão local na nuvem."
                >
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" />
                  <span>Conflito: Salvar Local</span>
                </button>
              )}
            </div>

            {/* Profile Avatar click -> Settings */}
            <button
              onClick={() => {
                setInitialSettingsTab('profile');
                setActiveTab('settings');
              }}
              className="flex items-center gap-2 group cursor-pointer"
              title="Configurações e Perfil"
            >
              <img
                src={db.profile.avatar}
                alt={db.profile.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-[#242427] group-hover:border-blue-500 transition"
              />
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-white leading-tight group-hover:text-blue-400 transition">
                  {localStorage.getItem('app_user_name') || db.profile.name}
                </span>
                <span className="text-[9px] text-[#919196] leading-none">
                  {localStorage.getItem('app_user_email') || 'Estudante'}
                </span>
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={async () => {
                if (window.confirm('Deseja realmente sair do Caderno Acadêmico? Seus dados estão salvos em segurança.')) {
                  const token = localStorage.getItem('app_session_token');
                  if (token) {
                    try {
                      await fetch('/api/auth/logout', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      });
                    } catch (e) {
                      console.warn('Erro ao invalidar sessão no servidor:', e);
                    }
                  }
                  localStorage.removeItem('app_authenticated');
                  localStorage.removeItem('app_session_token');
                  localStorage.removeItem('app_user_name');
                  localStorage.removeItem('app_user_email');
                  window.location.reload();
                }
              }}
              className="p-2 bg-[#1C1C1F] hover:bg-red-500/10 border border-[#242427] hover:border-red-500/30 text-[#919196] hover:text-red-400 rounded-xl transition cursor-pointer"
              title="Sair do aplicativo"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex gap-6">
        {/* Left Sidebar Navigation (Desktop) */}
        <aside className="w-60 shrink-0 hidden lg:block space-y-5">
          <nav className="space-y-1 bg-[#121214] p-3 rounded-2xl border border-[#242427] shadow-xs">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === 'notebooks') setActiveNotebookId(null);
                    if (item.id === 'settings') setInitialSettingsTab('profile');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-[#2A2A2D] text-white font-semibold shadow-xs'
                      : 'text-[#919196] hover:bg-[#1C1C1F] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={isActive ? 'text-blue-400' : 'text-[#919196]'}>{item.icon}</div>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isActive
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-[#1C1C1F] text-[#919196]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Active Semester Card in Sidebar */}
          <div className="p-4 rounded-2xl bg-[#121214] border border-[#242427] shadow-xs space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-[10px] text-[#919196]">
              <span className="font-semibold uppercase tracking-wider">Semestre Ativo</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Em Curso
              </span>
            </div>
            <p className="font-semibold text-white">
              {activeSemester?.name}
            </p>
            <div className="w-full bg-[#1C1C1F] h-1.5 rounded-full overflow-hidden border border-[#242427]">
              <div className="bg-blue-500 h-full w-2/3 rounded-full" />
            </div>
          </div>
        </aside>

        {/* Mobile Drawer Navigation */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            />
            <div className="relative w-64 bg-[#121214] h-full p-4 border-r border-[#242427] shadow-2xl flex flex-col justify-between z-50 animate-in slide-in-from-left duration-200 text-white">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#242427]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-xs">U</div>
                    <span className="font-semibold text-sm">UniNotes Pro</span>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-[#919196] hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          if (item.id === 'notebooks') setActiveNotebookId(null);
                          if (item.id === 'settings') setInitialSettingsTab('profile');
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                          isActive
                            ? 'bg-[#2A2A2D] text-white font-semibold'
                            : 'text-[#919196] hover:bg-[#1C1C1F] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={isActive ? 'text-blue-400' : 'text-[#919196]'}>{item.icon}</div>
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#1C1C1F] font-bold text-[#919196]">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-3 border-t border-[#242427] text-xs text-[#919196]">
                <p className="font-semibold text-white">{db.profile.name}</p>
                <p className="text-[11px]">{db.profile.university}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Dynamic Router Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenNotebook={handleOpenNotebook}
              onOpenLesson={handleOpenLesson}
              onOpenTasks={() => setActiveTab('tasks')}
              onOpenCalendar={() => setActiveTab('calendar')}
              onOpenFlashcards={() => setActiveTab('flashcards')}
              onOpenMindMaps={() => setActiveTab('mindmaps')}
              onOpenSchedule={() => setActiveTab('schedule')}
              onOpenTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {activeTab === 'notebooks' && (
            <>
              {activeNotebookId ? (
                <NotebookViewer
                  notebookId={activeNotebookId}
                  onBack={() => setActiveNotebookId(null)}
                  onOpenLesson={handleOpenLesson}
                />
              ) : (
                <NotebooksList
                  onSelectNotebook={(nbId) => setActiveNotebookId(nbId)}
                  onOpenLesson={handleOpenLesson}
                />
              )}
            </>
          )}

          {activeTab === 'calendar' && (
            <AcademicCalendarView onOpenEventDetail={() => {}} />
          )}

          {activeTab === 'schedule' && (
            <ScheduleView onOpenDisciplineNotebook={(nbId) => handleOpenNotebook(nbId)} />
          )}

          {activeTab === 'boletim' && (
            <BoletimView />
          )}

          {activeTab === 'tasks' && <TasksView />}

          {activeTab === 'flashcards' && <FlashcardsView />}

          {activeTab === 'mindmaps' && (
            <MindMapsView
              onOpenLesson={handleOpenLesson}
              onOpenDeck={(deckId) => {
                setActiveTab('flashcards');
              }}
            />
          )}

          {activeTab === 'files' && (
            <FilesManagerView onOpenLessonWithOCR={handleCreateNewLessonQuickly} />
          )}

          {activeTab === 'motivation' && (
            <MotivationView onWallpaperChange={() => setDb(StorageService.getDatabase())} />
          )}

          {activeTab === 'pomodoro' && (
            <PomodoroView
              focusTime={pomoFocusTime}
              setFocusTime={setPomoFocusTime}
              shortBreakTime={pomoShortBreak}
              setShortBreakTime={setPomoShortBreak}
              longBreakTime={pomoLongBreak}
              setLongBreakTime={setPomoLongBreak}
              mode={pomoMode}
              setMode={setPomoMode}
              secondsRemaining={pomoSecondsRemaining}
              setSecondsRemaining={setPomoSecondsRemaining}
              isRunning={pomoIsRunning}
              setIsRunning={setPomoIsRunning}
              soundEnabled={pomoSoundEnabled}
              setSoundEnabled={setPomoSoundEnabled}
              stats={pomoStats}
              setStats={setPomoStats}
              handleSwitchMode={handleGlobalPomoSwitchMode}
              handleReset={handleGlobalPomoReset}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              onThemeChange={() => setDb(StorageService.getDatabase())}
              onSemesterChange={() => setDb(StorageService.getDatabase())}
              initialTab={initialSettingsTab}
            />
          )}
        </main>
      </div>

      {/* Floating Music & Focus Sound Synthesizer Widget */}
      <MusicPlayerWidget />

      {activeTab !== 'pomodoro' && (
        <FloatingPomodoro
          mode={pomoMode}
          secondsRemaining={pomoSecondsRemaining}
          isRunning={pomoIsRunning}
          setIsRunning={setPomoIsRunning}
          handleSwitchMode={handleGlobalPomoSwitchMode}
          handleReset={handleGlobalPomoReset}
        />
      )}

      {/* Global Search Modal (Ctrl+K) */}
      {globalSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[70vh]">
            <div className="p-4 border-b border-[#242427] flex items-center gap-3">
              <Search className="w-5 h-5 text-[#636366]" />
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder="Pesquisar em todas as aulas, matérias, tarefas e provas..."
                className="w-full bg-transparent text-sm text-[#E2E2E2] focus:outline-none placeholder-[#636366]"
                autoFocus
              />
              <button
                onClick={() => setGlobalSearchOpen(false)}
                className="px-2 py-0.5 rounded bg-[#1C1C1F] text-xs text-[#919196] hover:text-white border border-[#242427]"
              >
                ESC
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 divide-y divide-[#242427]/60 space-y-2">
              {globalSearchQuery.trim() ? (
                <>
                  {/* Results: Lessons */}
                  {db.lessons
                    .filter(
                      (l) =>
                        l.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                        l.contentHtml.toLowerCase().includes(globalSearchQuery.toLowerCase())
                    )
                    .slice(0, 5)
                    .map((l) => (
                      <div
                        key={l.id}
                        onClick={() => {
                          setGlobalSearchOpen(false);
                          handleOpenLesson(l.id);
                        }}
                        className="py-2.5 px-3 flex items-center justify-between hover:bg-[#1C1C1F] rounded-xl cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <div>
                            <p className="text-xs font-semibold text-[#E2E2E2]">
                              {l.title}
                            </p>
                            <p className="text-[10px] text-[#919196]">{l.lessonNumber} • {l.date}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-blue-400">Abrir Nota →</span>
                      </div>
                    ))}

                  {/* Results: Tasks */}
                  {db.tasks
                    .filter((t) => t.title.toLowerCase().includes(globalSearchQuery.toLowerCase()))
                    .slice(0, 4)
                    .map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setGlobalSearchOpen(false);
                          setActiveTab('tasks');
                        }}
                        className="py-2.5 px-3 flex items-center justify-between hover:bg-[#1C1C1F] rounded-xl cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                          <div>
                            <p className="text-xs font-semibold text-[#E2E2E2]">
                              {t.title}
                            </p>
                            <p className="text-[10px] text-[#919196]">Tarefa • {t.priority}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-400">Ver Tarefa →</span>
                      </div>
                    ))}

                  {/* Results: Events */}
                  {db.events
                    .filter((ev) => ev.title.toLowerCase().includes(globalSearchQuery.toLowerCase()))
                    .slice(0, 4)
                    .map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => {
                          setGlobalSearchOpen(false);
                          setActiveTab('calendar');
                        }}
                        className="py-2.5 px-3 flex items-center justify-between hover:bg-[#1C1C1F] rounded-xl cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          <div>
                            <p className="text-xs font-semibold text-[#E2E2E2]">
                              {ev.title}
                            </p>
                            <p className="text-[10px] text-[#919196]">{ev.type.toUpperCase()} • {ev.date}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-purple-400">Ver no Calendário →</span>
                      </div>
                    ))}
                </>
              ) : (
                <div className="py-8 text-center text-xs text-[#919196]">
                  Digite para buscar em todos os cadernos, provas e tarefas...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Task Modal */}
      {quickTaskModalOpen && (
        <TaskModal
          isOpen={quickTaskModalOpen}
          onClose={() => setQuickTaskModalOpen(false)}
          activeSemesterId={activeSemester.id}
        />
      )}

      {/* Quick Event Modal */}
      {quickEventModalOpen && (
        <EventModal
          isOpen={quickEventModalOpen}
          onClose={() => setQuickEventModalOpen(false)}
          activeSemesterId={activeSemester.id}
        />
      )}

      {/* Quick Notebook Modal */}
      {quickNotebookModalOpen && (
        <NotebookModal
          isOpen={quickNotebookModalOpen}
          onClose={() => setQuickNotebookModalOpen(false)}
          activeSemesterId={activeSemester.id}
          onSaved={(nb) => {
            handleOpenNotebook(nb.id);
          }}
        />
      )}

      {/* PWA Update Notification Banner */}
      {pwaState.updateAvailable && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-50 p-4 bg-[#121214] border border-blue-500/40 rounded-2xl shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Nova Versão Disponível</h4>
              <p className="text-[11px] text-[#919196] mt-0.5 leading-relaxed">
                Uma nova versão do UniNotes Pro foi baixada e está pronta para uso! Atualize para obter as novidades e melhorias.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => PwaService.updateApp()}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Atualizar Agora
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
