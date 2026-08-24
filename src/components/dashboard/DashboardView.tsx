import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StorageService } from '../../lib/storage';
import { AcademicTask, AcademicEvent, Notebook, Lesson, Discipline, WidgetConfig, UserProfile } from '../../types';
import { TaskModal } from '../tasks/TaskModal';
import { EventModal } from '../calendar/EventModal';
import { DisciplineModal } from '../semesters/DisciplineModal';
import { UniversalImageEditor } from '../editor/UniversalImageEditor';
import { VisionMural } from '../motivation/VisionMural';
import { FocusSynthService, SoundType } from '../../lib/audioSynth';
import {
  Sparkles,
  BookOpen,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Plus,
  ArrowRight,
  Brain,
  Layers,
  ChevronRight,
  ChevronLeft,
  BookMarked,
  User,
  Quote,
  Flame,
  Check,
  Sliders,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Settings,
  Image as ImageIcon,
  Activity,
  FlaskConical,
  Scale,
  Bell,
  CheckSquare,
  GraduationCap,
  Network,
  PenTool,
  Heart,
  FileText,
  Microscope,
  Gamepad2,
  Volume2,
  VolumeX,
  Volume1,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Sun,
  Cloud,
  CloudRain,
  Thermometer,
  MapPin,
  Trash2,
  Edit2,
  Music,
  HeartPulse,
  Info,
  X,
  RefreshCw,
  Award,
  GripVertical
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Responsive } from 'react-grid-layout';

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 4, md: 4, sm: 2, xs: 1, xxs: 1 };

const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'profile_banner', x: 0, y: 0, w: 4, h: 4, minW: 2 },
    { i: 'schedule', x: 0, y: 4, w: 2, h: 3, minW: 1 },
    { i: 'priority_tasks', x: 2, y: 4, w: 2, h: 3, minW: 1 },
    { i: 'today_tasks_widget', x: 0, y: 7, w: 2, h: 3, minW: 1 },
    { i: 'clock_widget', x: 2, y: 7, w: 2, h: 2, minW: 1 },
    { i: 'calendar_widget', x: 0, y: 10, w: 2, h: 4, minW: 2 },
    { i: 'timer_widget', x: 2, y: 9, w: 1, h: 2, minW: 1 },
    { i: 'study_focus_widget', x: 3, y: 9, w: 1, h: 2, minW: 1 },
    { i: 'academic_agenda_widget', x: 2, y: 11, w: 2, h: 3, minW: 1 },
    { i: 'music_focus_widget', x: 0, y: 14, w: 1, h: 2, minW: 1 },
    { i: 'quote_widget', x: 1, y: 14, w: 2, h: 2, minW: 1 },
    { i: 'progress_widget', x: 3, y: 14, w: 1, h: 2, minW: 1 },
    { i: 'weather_widget', x: 0, y: 16, w: 1, h: 2, minW: 1 },
    { i: 'quick_note_widget', x: 1, y: 16, w: 2, h: 3, minW: 1 },
    { i: 'daily_goal_widget', x: 3, y: 16, w: 1, h: 1, minW: 1 },
    { i: 'disciplines', x: 0, y: 19, w: 4, h: 4, minW: 2 },
    { i: 'motivation_widget', x: 0, y: 23, w: 4, h: 5, minW: 2 },
  ],
  md: [
    { i: 'profile_banner', x: 0, y: 0, w: 4, h: 4, minW: 2 },
    { i: 'schedule', x: 0, y: 4, w: 2, h: 3, minW: 1 },
    { i: 'priority_tasks', x: 2, y: 4, w: 2, h: 3, minW: 1 },
    { i: 'today_tasks_widget', x: 0, y: 7, w: 2, h: 3, minW: 1 },
    { i: 'clock_widget', x: 2, y: 7, w: 2, h: 2, minW: 1 },
    { i: 'calendar_widget', x: 0, y: 10, w: 2, h: 4, minW: 2 },
    { i: 'timer_widget', x: 2, y: 9, w: 1, h: 2, minW: 1 },
    { i: 'study_focus_widget', x: 3, y: 9, w: 1, h: 2, minW: 1 },
    { i: 'academic_agenda_widget', x: 2, y: 11, w: 2, h: 3, minW: 1 },
    { i: 'music_focus_widget', x: 0, y: 14, w: 1, h: 2, minW: 1 },
    { i: 'quote_widget', x: 1, y: 14, w: 2, h: 2, minW: 1 },
    { i: 'progress_widget', x: 3, y: 14, w: 1, h: 2, minW: 1 },
    { i: 'weather_widget', x: 0, y: 16, w: 1, h: 2, minW: 1 },
    { i: 'quick_note_widget', x: 1, y: 16, w: 2, h: 3, minW: 1 },
    { i: 'daily_goal_widget', x: 3, y: 16, w: 1, h: 1, minW: 1 },
    { i: 'disciplines', x: 0, y: 19, w: 4, h: 4, minW: 2 },
    { i: 'motivation_widget', x: 0, y: 23, w: 4, h: 5, minW: 2 },
  ],
  sm: [
    { i: 'profile_banner', x: 0, y: 0, w: 2, h: 4, minW: 1 },
    { i: 'schedule', x: 0, y: 4, w: 2, h: 3, minW: 1 },
    { i: 'priority_tasks', x: 0, y: 7, w: 2, h: 3, minW: 1 },
    { i: 'today_tasks_widget', x: 0, y: 10, w: 2, h: 3, minW: 1 },
    { i: 'clock_widget', x: 0, y: 13, w: 2, h: 2, minW: 1 },
    { i: 'calendar_widget', x: 0, y: 15, w: 2, h: 4, minW: 1 },
    { i: 'timer_widget', x: 0, y: 19, w: 1, h: 2, minW: 1 },
    { i: 'study_focus_widget', x: 1, y: 19, w: 1, h: 2, minW: 1 },
    { i: 'academic_agenda_widget', x: 0, y: 21, w: 2, h: 3, minW: 1 },
    { i: 'music_focus_widget', x: 0, y: 24, w: 1, h: 2, minW: 1 },
    { i: 'quote_widget', x: 1, y: 24, w: 1, h: 2, minW: 1 },
    { i: 'progress_widget', x: 0, y: 26, w: 1, h: 2, minW: 1 },
    { i: 'weather_widget', x: 1, y: 26, w: 1, h: 2, minW: 1 },
    { i: 'quick_note_widget', x: 0, y: 28, w: 2, h: 3, minW: 1 },
    { i: 'daily_goal_widget', x: 0, y: 31, w: 1, h: 1, minW: 1 },
    { i: 'disciplines', x: 0, y: 32, w: 2, h: 4, minW: 1 },
    { i: 'motivation_widget', x: 0, y: 36, w: 2, h: 5, minW: 1 },
  ],
  xs: [
    { i: 'profile_banner', x: 0, y: 0, w: 1, h: 4 },
    { i: 'schedule', x: 0, y: 4, w: 1, h: 3 },
    { i: 'priority_tasks', x: 0, y: 7, w: 1, h: 3 },
    { i: 'today_tasks_widget', x: 0, y: 10, w: 1, h: 3 },
    { i: 'clock_widget', x: 0, y: 13, w: 1, h: 2 },
    { i: 'calendar_widget', x: 0, y: 15, w: 1, h: 4 },
    { i: 'timer_widget', x: 0, y: 19, w: 1, h: 2 },
    { i: 'study_focus_widget', x: 0, y: 21, w: 1, h: 2 },
    { i: 'academic_agenda_widget', x: 0, y: 23, w: 1, h: 3 },
    { i: 'music_focus_widget', x: 0, y: 26, w: 1, h: 2 },
    { i: 'quote_widget', x: 0, y: 28, w: 1, h: 2 },
    { i: 'progress_widget', x: 0, y: 30, w: 1, h: 2 },
    { i: 'weather_widget', x: 0, y: 32, w: 1, h: 2 },
    { i: 'quick_note_widget', x: 0, y: 34, w: 1, h: 3 },
    { i: 'daily_goal_widget', x: 0, y: 37, w: 1, h: 1 },
    { i: 'disciplines', x: 0, y: 38, w: 1, h: 4 },
    { i: 'motivation_widget', x: 0, y: 42, w: 1, h: 5 },
  ],
  xxs: [
    { i: 'profile_banner', x: 0, y: 0, w: 1, h: 4 },
    { i: 'schedule', x: 0, y: 4, w: 1, h: 3 },
    { i: 'priority_tasks', x: 0, y: 7, w: 1, h: 3 },
    { i: 'today_tasks_widget', x: 0, y: 10, w: 1, h: 3 },
    { i: 'clock_widget', x: 0, y: 13, w: 1, h: 2 },
    { i: 'calendar_widget', x: 0, y: 15, w: 1, h: 4 },
    { i: 'timer_widget', x: 0, y: 19, w: 1, h: 2 },
    { i: 'study_focus_widget', x: 0, y: 21, w: 1, h: 2 },
    { i: 'academic_agenda_widget', x: 0, y: 23, w: 1, h: 3 },
    { i: 'music_focus_widget', x: 0, y: 26, w: 1, h: 2 },
    { i: 'quote_widget', x: 0, y: 28, w: 1, h: 2 },
    { i: 'progress_widget', x: 0, y: 30, w: 1, h: 2 },
    { i: 'weather_widget', x: 0, y: 32, w: 1, h: 2 },
    { i: 'quick_note_widget', x: 0, y: 34, w: 1, h: 3 },
    { i: 'daily_goal_widget', x: 0, y: 37, w: 1, h: 1 },
    { i: 'disciplines', x: 0, y: 38, w: 1, h: 4 },
    { i: 'motivation_widget', x: 0, y: 42, w: 1, h: 5 },
  ],
};

interface DashboardViewProps {
  onOpenNotebook: (notebookId: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onOpenTasks: () => void;
  onOpenCalendar: () => void;
  onOpenFlashcards: () => void;
  onOpenMindMaps: () => void;
  onOpenSchedule: () => void;
  onOpenTab?: (tab: string) => void;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'profile_banner', title: 'Banner de Perfil', visible: true, size: 'full', position: 0 },
  { id: 'schedule', title: 'Aulas de Hoje', visible: true, size: 'lg', position: 1 },
  { id: 'priority_tasks', title: 'Prioridades & Memos', visible: true, size: 'md', position: 2 },
  { id: 'today_tasks_widget', title: 'Tarefas de Hoje', visible: true, size: 'md', position: 3 },
  { id: 'clock_widget', title: 'Relógio Digital', visible: true, size: 'sm', position: 4 },
  { id: 'calendar_widget', title: 'Calendário', visible: true, size: 'md', position: 5 },
  { id: 'timer_widget', title: 'Cronômetro & Temporizador', visible: true, size: 'sm', position: 6 },
  { id: 'study_focus_widget', title: 'Foco nos Estudos', visible: true, size: 'sm', position: 7 },
  { id: 'academic_agenda_widget', title: 'Próximas Atividades', visible: true, size: 'md', position: 8 },
  { id: 'music_focus_widget', title: 'Música & Foco', visible: true, size: 'sm', position: 9 },
  { id: 'quote_widget', title: 'Frase Motivacional', visible: true, size: 'md', position: 10 },
  { id: 'progress_widget', title: 'Progresso Acadêmico', visible: true, size: 'sm', position: 11 },
  { id: 'weather_widget', title: 'Clima', visible: true, size: 'sm', position: 12 },
  { id: 'quick_note_widget', title: 'Nota Rápida', visible: true, size: 'md', position: 13 },
  { id: 'daily_goal_widget', title: 'Meta do Dia', visible: true, size: 'sm', position: 14 },
  { id: 'disciplines', title: 'Meus Cadernos & Disciplinas', visible: true, size: 'full', position: 15 },
  { id: 'motivation_widget', title: 'Mural de Visão & Metas', visible: true, size: 'full', position: 16 },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNotebook,
  onOpenLesson,
  onOpenTasks,
  onOpenCalendar,
  onOpenFlashcards,
  onOpenMindMaps,
  onOpenSchedule,
  onOpenTab,
}) => {
  const db = StorageService.getDatabase();
  const profile = db.profile;
  const currentSemesterId = profile.activeSemesterId;
  const currentSemester = db.semesters.find((s) => s.id === currentSemesterId) || db.semesters[0];

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [disciplineModalOpen, setDisciplineModalOpen] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  // Universal image editor states
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
  const [isWallpaperEditorOpen, setIsWallpaperEditorOpen] = useState(false);

  // Active custom widget being edited
  const [editingWidget, setEditingWidget] = useState<WidgetConfig | null>(null);

  // Quick Task list input state
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  // 1. Clock Widget ticking state
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Calendar Widget Month state & click state
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // 3. Stopwatch & Timer state
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 minutes default
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerTarget, setTimerTarget] = useState(300);
  const [timerInputMinutes, setTimerInputMinutes] = useState('5');

  useEffect(() => {
    let interval: any;
    if (stopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchTime((t) => t + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [stopwatchRunning]);

  useEffect(() => {
    let interval: any;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            confetti({ particleCount: 30, spread: 65, origin: { y: 0.6 } });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // 4. Study Focus Session state
  const [focusMode, setFocusMode] = useState<'study' | 'rest'>('study');
  const [focusTimeLeft, setFocusTimeLeft] = useState(1500); // 25 minutes default
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusSessions, setFocusSessions] = useState(() => {
    return parseInt(localStorage.getItem('widget_focus_sessions_count') || '0');
  });

  useEffect(() => {
    let interval: any;
    if (focusRunning) {
      interval = setInterval(() => {
        setFocusTimeLeft((prev) => {
          if (prev <= 1) {
            if (focusMode === 'study') {
              setFocusMode('rest');
              const updated = focusSessions + 1;
              setFocusSessions(updated);
              localStorage.setItem('widget_focus_sessions_count', updated.toString());
              confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 } });
              return 300; // 5 minutes default rest
            } else {
              setFocusMode('study');
              return 1500; // 25 minutes default study
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [focusRunning, focusMode, focusSessions]);

  // 5. Music player ambient synthetic sound volume and playing state
  const [ambientSound, setAmbientSound] = useState<SoundType>('none');
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [ambientVolume, setAmbientVolume] = useState(0.5);

  const toggleAmbientSound = (sound: SoundType) => {
    if (ambientSound === sound && ambientPlaying) {
      FocusSynthService.stop();
      setAmbientPlaying(false);
      setAmbientSound('none');
    } else {
      FocusSynthService.play(sound, ambientVolume);
      setAmbientSound(sound);
      setAmbientPlaying(true);
    }
  };

  const handleAmbientVolumeChange = (vol: number) => {
    setAmbientVolume(vol);
    FocusSynthService.setVolume(vol);
  };

  // 6. Dynamic Quote rotating selector
  const PRESET_QUOTES = [
    { text: "A paciência é amarga, mas seu fruto é doce.", author: "Jean-Jacques Rousseau" },
    { text: "O homem não é nada além daquilo que a educação faz dele.", author: "Immanuel Kant" },
    { text: "Não há atalhos para os lugares que realmente vale a pena ir.", author: "Beverly Sills" },
    { text: "Seja a mudança que você deseja ver no mundo.", author: "Mahatma Gandhi" },
    { text: "Estudar sem pensar é trabalho perdido; pensar sem estudar é perigoso.", author: "Confúcio" },
    { text: "A imaginação é mais importante que o conhecimento.", author: "Albert Einstein" },
    { text: "Viver é aprender a dançar na chuva.", author: "Sêneca" }
  ];
  const [quoteIndex, setQuoteIndex] = useState(0);

  // 7. Quick notes & daily goal persistence via LocalStorage
  const [quickNoteText, setQuickNoteText] = useState(() => {
    return localStorage.getItem('widget_quick_note_content') || '';
  });
  const handleQuickNoteChange = (text: string) => {
    setQuickNoteText(text);
    localStorage.setItem('widget_quick_note_content', text);
  };

  const [dailyGoalText, setDailyGoalText] = useState(() => {
    return localStorage.getItem('widget_daily_goal_text') || 'Estudar por 2 horas hoje';
  });
  const [dailyGoalCompleted, setDailyGoalCompleted] = useState(() => {
    return localStorage.getItem('widget_daily_goal_completed') === 'true';
  });

  const toggleDailyGoal = () => {
    const next = !dailyGoalCompleted;
    setDailyGoalCompleted(next);
    localStorage.setItem('widget_daily_goal_completed', next.toString());
    if (next) {
      confetti({ particleCount: 30, spread: 50 });
    }
  };

  const handleSaveDailyGoalText = (text: string) => {
    setDailyGoalText(text);
    localStorage.setItem('widget_daily_goal_text', text);
  };

  // 8. Custom Weather Weather state
  const [weatherCity, setWeatherCity] = useState(() => {
    return localStorage.getItem('widget_weather_city') || 'Uberlândia, MG';
  });
  const [isEditingWeather, setIsEditingWeather] = useState(false);

  // Generate deterministic weather values based on city name characters
  const weatherDetails = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < weatherCity.length; i++) {
      hash = weatherCity.charCodeAt(i) + ((hash << 5) - hash);
    }
    const tempBase = 18 + (Math.abs(hash) % 15); // Range 18 to 33
    const conditionIndex = Math.abs(hash) % 4;
    const conditions = [
      { text: 'Ensolarado', icon: <Sun className="w-8 h-8 text-amber-500" />, humidity: 45, wind: 12 },
      { text: 'Parcialmente Nublado', icon: <Cloud className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />, humidity: 60, wind: 8 },
      { text: 'Chuvoso', icon: <CloudRain className="w-8 h-8 text-blue-400" />, humidity: 85, wind: 15 },
      { text: 'Fresco', icon: <Cloud className="w-8 h-8 text-slate-300" />, humidity: 50, wind: 10 }
    ];
    return {
      temp: tempBase,
      min: tempBase - 4,
      max: tempBase + 4,
      ...conditions[conditionIndex]
    };
  }, [weatherCity]);

  // Grid Layout persistence and tracking
  const [layouts, setLayouts] = useState<any>(() => {
    const saved = localStorage.getItem('dashboard_grid_layouts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all widgets are present in the loaded layouts
        Object.keys(DEFAULT_LAYOUTS).forEach((breakpoint) => {
          const bpLayout = parsed[breakpoint] || [];
          DEFAULT_LAYOUTS[breakpoint as keyof typeof DEFAULT_LAYOUTS].forEach((defItem) => {
            if (!bpLayout.some((item: any) => item.i === defItem.i)) {
              bpLayout.push(defItem);
            }
          });
          parsed[breakpoint] = bpLayout;
        });
        return parsed;
      } catch (e) {
        console.error("Erro ao carregar layouts do grid:", e);
      }
    }
    return DEFAULT_LAYOUTS;
  });

  const handleLayoutChange = (currentLayout: any, allLayouts: any) => {
    setLayouts(allLayouts);
    localStorage.setItem('dashboard_grid_layouts', JSON.stringify(allLayouts));
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        // Use the contentRect width, debounced or instant
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const updateWidgetLayoutSize = (widgetId: string, size: 'sm' | 'md' | 'lg' | 'full') => {
    const sizeMap = { sm: 1, md: 2, lg: 3, full: 4 };
    const targetW = sizeMap[size] || 2;
    
    setLayouts((prevLayouts: any) => {
      const updated = { ...prevLayouts };
      Object.keys(updated).forEach((breakpoint) => {
        updated[breakpoint] = (updated[breakpoint] || []).map((item: any) => {
          if (item.i === widgetId) {
            const maxCols = COLS[breakpoint as keyof typeof COLS] || 4;
            return { ...item, w: Math.min(targetW, maxCols) };
          }
          return item;
        });
      });
      localStorage.setItem('dashboard_grid_layouts', JSON.stringify(updated));
      return updated;
    });
  };

  // Merge default widgets config with stored configurations
  const widgetsList = useMemo(() => {
    const saved = profile.widgetsConfig || [];
    const merged = [...saved];

    DEFAULT_WIDGETS.forEach((def) => {
      const exists = merged.some((w) => w.id === def.id);
      if (!exists) {
        merged.push({ ...def, position: merged.length });
      }
    });

    return merged.sort((a, b) => a.position - b.position);
  }, [profile.widgetsConfig]);

  const handleSaveAvatar = (editedUrl: string, params: any) => {
    StorageService.update((draft) => {
      draft.profile.avatar = editedUrl;
      draft.profile.avatarUrl = editedUrl;
      draft.profile.avatarOriginal = draft.profile.avatarOriginal || editedUrl;
      draft.profile.avatarEditParams = params;
    });
  };

  const handleSaveWallpaper = (editedUrl: string, params: any) => {
    StorageService.update((draft) => {
      draft.profile.dashboardBgType = 'image';
      draft.profile.dashboardWallpaperUrl = editedUrl;
      draft.profile.dashboardWallpaperOriginal = draft.profile.dashboardWallpaperOriginal || editedUrl;
      draft.profile.dashboardWallpaperEditParams = params;
    });
  };

  // Widget customizer and editing handlers
  const handleUpdateWidget = (id: string, updates: Partial<WidgetConfig>) => {
    if (updates.size) {
      updateWidgetLayoutSize(id, updates.size);
    }
    StorageService.update((draft) => {
      if (!draft.profile.widgetsConfig) {
        draft.profile.widgetsConfig = [...widgetsList];
      }
      const widget = draft.profile.widgetsConfig.find((w) => w.id === id);
      if (widget) {
        Object.assign(widget, updates);
      } else {
        draft.profile.widgetsConfig.push({
          id,
          title: DEFAULT_WIDGETS.find(w => w.id === id)?.title || id,
          visible: true,
          size: 'md',
          position: draft.profile.widgetsConfig.length,
          ...updates
        });
      }
    });
  };

  // Position reordering using direct position updates
  const handleMoveWidget = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= widgetsList.length) return;

    StorageService.update((draft) => {
      if (!draft.profile.widgetsConfig) {
        draft.profile.widgetsConfig = [...widgetsList];
      }
      const list = draft.profile.widgetsConfig;
      const current = list.find((w) => w.id === widgetsList[index].id);
      const neighbor = list.find((w) => w.id === widgetsList[nextIndex].id);

      if (current && neighbor) {
        const temp = current.position;
        current.position = neighbor.position;
        neighbor.position = temp;
      }
    });
  };

  // Get active academic datasets
  const activeNotebooks = db.notebooks.filter((n) => n.semesterId === currentSemesterId);
  const activeDisciplines = db.disciplines.filter((d) => d.semesterId === currentSemesterId);

  // All Tasks for the Semester
  const currentTasks = db.tasks.filter((t) => t.semesterId === currentSemesterId);
  const completedTasksCount = currentTasks.filter((t) => t.status === 'done').length;
  const pendingTasks = currentTasks.filter((t) => t.status !== 'done');

  // Tasks scheduled precisely for TODAY
  const todayStr = currentTime.toISOString().split('T')[0];
  const todayTasks = useMemo(() => {
    return currentTasks.filter((t) => t.date === todayStr);
  }, [currentTasks, todayStr]);

  // Upcoming academic agenda items (deadline events)
  const upcomingAgenda = useMemo(() => {
    const evs = db.events
      .filter((e) => e.semesterId === currentSemesterId && e.date >= todayStr)
      .map((e) => ({ ...e, isEvent: true, title: e.title, date: e.date, type: e.type }));

    const tks = currentTasks
      .filter((t) => t.date >= todayStr && t.status !== 'done')
      .map((t) => ({ ...t, isEvent: false, title: t.title, date: t.date, type: 'assignment' }));

    return [...evs, ...tks].sort((a, b) => a.date.localeCompare(b.date));
  }, [db.events, currentTasks, todayStr, currentSemesterId]);

  // Handle Quick Task Adding
  const handleQuickTaskAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    const targetDiscipline = activeDisciplines[0] || db.disciplines[0];

    const newTask: AcademicTask = {
      id: `task-${Date.now()}`,
      semesterId: currentSemesterId,
      disciplineId: targetDiscipline?.id || 'disc-1',
      title: quickTaskTitle.trim(),
      description: 'Adicionada rapidamente pelo painel.',
      date: todayStr,
      priority: 'medium',
      status: 'todo',
      order: currentTasks.length + 1,
      createdAt: new Date().toISOString(),
    };

    StorageService.update((draft) => {
      draft.tasks.unshift(newTask);
    });

    setQuickTaskTitle('');
    confetti({ particleCount: 20, spread: 35, origin: { y: 0.8 } });
  };

  const handleToggleTask = (task: AcademicTask) => {
    const isNowDone = task.status !== 'done';
    StorageService.update((draft) => {
      const t = draft.tasks.find((item) => item.id === task.id);
      if (t) {
        t.status = isNowDone ? 'done' : 'todo';
      }
    });

    if (isNowDone) {
      confetti({ particleCount: 30, spread: 45, origin: { y: 0.8 } });
    }
  };

  const getDisciplineIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Microscope':
        return <Microscope className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
      case 'Activity':
      case 'HeartPulse':
        return <Activity className="w-6 h-6 text-rose-600 dark:text-rose-400" />;
      case 'FlaskConical':
      case 'Pill':
        return <FlaskConical className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
      case 'Scale':
        return <Scale className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
      default:
        return <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const getFormattedDate = () => {
    const days = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];
    const now = currentTime;
    const dayName = days[now.getDay()];
    const dayNum = now.getDate();
    const monthName = now.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
    return `${dayName}, ${dayNum} DE ${monthName}`;
  };

  function onOpenNotebooksClick() {
    if (activeNotebooks.length > 0) {
      onOpenNotebook(activeNotebooks[0].id);
    } else {
      onOpenTab?.('notebooks');
    }
  }

  // Helper to parse formatting settings on widgets
  const getWidgetStyleClasses = (widget: WidgetConfig) => {
    const isDarkOverride = widget.themeMode === 'dark';
    const isLightOverride = widget.themeMode === 'light';

    let bgClass = 'bg-white dark:bg-[#121214]';
    if (widget.style === 'glass') {
      bgClass = 'bg-white/40 dark:bg-[#121214]/40 backdrop-blur-md shadow-xs';
    } else if (widget.style === 'pastel') {
      bgClass = 'bg-[#FAF8F5] dark:bg-[#1C1C1F]';
    } else if (widget.style === 'academic') {
      bgClass = 'bg-[#FAF6F0] dark:bg-[#151412]';
    } else if (widget.style === 'minimalist') {
      bgClass = 'bg-transparent border-none shadow-none';
    }

    if (widget.transparency === 'subtle') {
      bgClass = bgClass.replace('bg-white', 'bg-white/90').replace('bg-[#121214]', 'bg-[#121214]/90') + ' backdrop-blur-xs';
    } else if (widget.transparency === 'high') {
      bgClass = bgClass.replace('bg-white', 'bg-white/65').replace('bg-[#121214]', 'bg-[#121214]/65') + ' backdrop-blur-md';
    } else if (widget.transparency === 'full') {
      bgClass = 'bg-transparent backdrop-blur-none';
    }

    let borderClass = 'border border-[#EAE3D5] dark:border-[#242427]';
    if (widget.borders === 'none' || widget.style === 'minimalist') {
      borderClass = 'border-none';
    } else if (widget.borders === 'thick') {
      borderClass = 'border-2 border-[#8C6239]/40 dark:border-[#C6A07C]/40';
    }

    let roundedClass = 'rounded-3xl';
    if (widget.borderRadius === 'none') {
      roundedClass = 'rounded-none';
    } else if (widget.borderRadius === 'md') {
      roundedClass = 'rounded-lg';
    } else if (widget.borderRadius === 'lg') {
      roundedClass = 'rounded-xl';
    } else if (widget.borderRadius === '2xl') {
      roundedClass = 'rounded-2xl';
    } else if (widget.borderRadius === '3xl') {
      roundedClass = 'rounded-3xl';
    }

    let textClass = 'text-zinc-800 dark:text-zinc-100';
    if (isLightOverride) {
      bgClass = bgClass.replace('dark:bg-[#121214]', '').replace('dark:bg-[#1C1C1F]', '').replace('dark:bg-[#151412]', '') + ' bg-white';
      textClass = 'text-zinc-950';
      borderClass = borderClass.replace('dark:border-[#242427]', 'border-zinc-200');
    } else if (isDarkOverride) {
      bgClass = bgClass.replace('bg-white', '').replace('bg-[#FAF8F5]', '').replace('bg-[#FAF6F0]', '') + ' bg-[#121214]';
      textClass = 'text-white';
      borderClass = borderClass.replace('border-[#EAE3D5]', 'border-[#242427]');
    }

    return { bgClass, borderClass, roundedClass, textClass };
  };

  // Helper for grid col span based on size
  const getWidgetColSpan = (size: 'sm' | 'md' | 'lg' | 'full') => {
    switch (size) {
      case 'sm':
        return 'col-span-1';
      case 'md':
        return 'col-span-1 lg:col-span-2';
      case 'lg':
        return 'col-span-1 lg:col-span-3';
      case 'full':
        return 'col-span-1 md:col-span-2 lg:col-span-4';
      default:
        return 'col-span-1';
    }
  };

  // Calendar render details
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Pad previous month days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Standard days
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Visual Customizer Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#121214] border border-[#242427] px-5 py-3.5 rounded-2xl gap-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-400 animate-spin-slow" />
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-[#E2E2E2] tracking-wide block uppercase">Área de Trabalho Acadêmica</span>
            <span className="text-[10px] text-[#919196] block">Arraste os widgets para organizar, clique no ícone para customizar o visual</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCustomizerOpen(!customizerOpen)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1C1C1F] hover:bg-[#242427] border border-[#242427] text-[10px] font-bold text-white uppercase tracking-wider rounded-xl transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            {customizerOpen ? 'Fechar Organizador' : '+ Gerenciar Widgets'}
          </button>
        </div>
      </div>

      {/* Widget Customizer Dropdown Panel */}
      {customizerOpen && (
        <div className="bg-[#121214] border border-[#242427] p-5 rounded-3xl shadow-lg space-y-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between border-b border-[#242427] pb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Organizador e Configurações de Widgets
              </h3>
              <p className="text-[10px] text-[#919196] mt-0.5">Ative, desative e configure a estética e tamanhos dos seus blocos</p>
            </div>
            <button
              onClick={() => {
                // Restore all widgets
                StorageService.update((draft) => {
                  draft.profile.widgetsConfig = DEFAULT_WIDGETS;
                });
              }}
              className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
            >
              Restaurar Padrões
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {widgetsList.map((widget, index) => {
              const def = DEFAULT_WIDGETS.find(w => w.id === widget.id);
              return (
                <div
                  key={widget.id}
                  className={`p-3 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                    widget.visible ? 'bg-[#1C1C1F] border-[#2E2E32]' : 'bg-[#121214]/50 border-[#242427] opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <span className="text-xs font-bold text-white block truncate max-w-[130px]">
                        {widget.customTitle || widget.title}
                      </span>
                      <span className="text-[9px] text-[#919196] block uppercase tracking-tight">
                        Tamanho: {widget.size || 'md'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleUpdateWidget(widget.id, { visible: !widget.visible })}
                        className="p-1.5 hover:bg-[#242427] rounded-lg transition"
                        title={widget.visible ? 'Ocultar widget' : 'Ativar widget'}
                      >
                        {widget.visible ? (
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingWidget(widget)}
                        className="p-1.5 hover:bg-[#242427] rounded-lg text-blue-400 transition"
                        title="Customizar Visual"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#242427] pt-2">
                    <span className="text-[10px] text-zinc-500">Posição: {widget.position}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveWidget(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-[#242427] disabled:opacity-20 rounded text-white"
                        title="Mover para cima"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveWidget(index, 'down')}
                        disabled={index === widgetsList.length - 1}
                        className="p-1 hover:bg-[#242427] disabled:opacity-20 rounded text-white"
                        title="Mover para baixo"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Widget Grid Layout */}
      <div ref={containerRef} className="w-full">
        <Responsive
          className="layout"
          layouts={layouts}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={100}
          width={containerWidth}
          isDraggable={true}
          isResizable={true}
          draggableHandle=".grid-drag-handle"
          onLayoutChange={handleLayoutChange}
          margin={[24, 24]}
          containerPadding={[0, 0]}
        >
        {widgetsList
          .filter((w) => w.visible)
          .map((widget) => {
            const { bgClass, borderClass, roundedClass, textClass } = getWidgetStyleClasses(widget);

            // Render common edit options floating top-right during hover or drag modes
            const widgetControls = (
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-150 z-20">
                <button
                  onClick={() => setEditingWidget(widget)}
                  className="p-1.5 bg-black/50 hover:bg-black/85 backdrop-blur text-blue-400 rounded-lg hover:scale-105 transition shadow-xs cursor-pointer"
                  title="Configurar Widget"
                >
                  <Sliders className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleUpdateWidget(widget.id, { visible: false })}
                  className="p-1.5 bg-black/50 hover:bg-black/85 backdrop-blur text-red-400 rounded-lg hover:scale-105 transition shadow-xs cursor-pointer"
                  title="Ocultar do Início"
                >
                  <EyeOff className="w-3 h-3" />
                </button>
              </div>
            );

            switch (widget.id) {
              case 'profile_banner':
                return (
                  <div
                    key={widget.id}
                    className="group relative select-none"
                  >
                    {widgetControls}
                    <div className="grid-drag-handle absolute top-4 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/10 rounded-xl cursor-grab active:cursor-grabbing text-[9px] font-bold text-white uppercase tracking-wider">
                      <GripVertical className="w-3.5 h-3.5 text-zinc-300" />
                      Mover
                    </div>
                    <div className="w-full h-full relative overflow-hidden bg-[#2d3a22] flex flex-col justify-between p-6 sm:p-8 rounded-3xl shadow-xs border border-[#242427]/10 dark:border-[#242427] bg-[#121214] text-white">
                      <img
                        src={profile.dashboardWallpaperUrl || "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1600&auto=format&fit=crop"}
                        alt="Background Wallpaper"
                        className="absolute inset-0 w-full h-full object-cover select-none"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/25 to-black/65" />

                      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                        <div className="flex items-center gap-2 text-white/95 text-[10px] font-bold tracking-wider uppercase grid-drag-handle cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-3.5 h-3.5 text-zinc-300" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          {getFormattedDate()}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-black/40 text-white backdrop-blur-md border border-white/10 shadow-xs">
                            {currentSemester?.name || '1º Período'}
                          </span>

                          <button
                            onClick={() => setIsWallpaperEditorOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-black/55 backdrop-blur-md border border-white/10 text-[9px] font-bold text-white uppercase tracking-wider rounded-xl transition cursor-pointer"
                          >
                            <Sliders className="w-3 h-3 text-blue-400" />
                            Wallpaper
                          </button>
                        </div>
                      </div>

                      <div className="relative z-10 flex flex-col gap-4 mt-auto">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="relative w-20 h-20 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl shrink-0 group/avatar">
                            <img
                              src={profile.avatarUrl || profile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                              alt={profile.name}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => setIsAvatarEditorOpen(true)}
                              className="absolute inset-0 bg-black/65 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white text-[8px] font-bold uppercase transition duration-150 cursor-pointer"
                            >
                              <ImageIcon className="w-3.5 h-3.5 mb-0.5 text-blue-400" />
                              Editar Foto
                            </button>
                          </div>

                          <div className="space-y-0.5">
                            <h1 className="text-2xl sm:text-3xl font-serif font-extrabold text-white tracking-tight drop-shadow-sm">
                              Olá, {profile.name}
                            </h1>
                            <p className="text-xs sm:text-sm text-white/90 font-medium">
                              {profile.course} • {profile.institution || profile.university || 'Universidade Federal de Uberlândia (UFU)'}
                            </p>
                          </div>
                        </div>

                        {profile.quote && (
                          <div className="p-3.5 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 flex items-start gap-2.5 text-white/95 max-w-4xl">
                            <Quote className="w-3.5 h-3.5 text-white/60 shrink-0 mt-0.5" />
                            <div className="text-[11px] sm:text-xs text-white/90 italic font-medium leading-relaxed">
                              "{profile.quote}" {profile.quoteAuthor && <span className="font-semibold not-italic text-white/70 block mt-1">— {profile.quoteAuthor}</span>}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                          <button
                            onClick={() => onOpenTab?.('notebooks')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white text-zinc-950 shadow hover:scale-102 transition cursor-pointer"
                          >
                            <BookOpen className="w-3 h-3" />
                            Cadernos ({activeNotebooks.length})
                          </button>
                          <button
                            onClick={() => onOpenTab?.('mindmaps')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-md hover:scale-102 transition cursor-pointer"
                          >
                            <Network className="w-3 h-3 text-emerald-400" />
                            Mapas
                          </button>
                          <button
                            onClick={() => onOpenTab?.('flashcards')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-md hover:scale-102 transition cursor-pointer"
                          >
                            <Brain className="w-3 h-3 text-amber-400" />
                            Flashcards ({db.flashcardDecks.filter(d => d.semesterId === currentSemesterId).length})
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );

              case 'schedule':
                return (
                  <div
                    key={widget.id}
                    className="group relative"
                  >
                    {widgetControls}
                    <div className={`w-full h-full p-5 shadow-xs flex flex-col justify-between gap-4 relative overflow-hidden ${bgClass} ${borderClass} ${roundedClass} ${textClass}`}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 grid-drag-handle cursor-grab active:cursor-grabbing select-none">
                            <GripVertical className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                            <Clock className="w-4 h-4 text-[#8C6239] dark:text-[#C6A07C]" />
                            <h2 className="font-serif font-bold text-sm sm:text-base">
                              {widget.customTitle || 'Aulas de Hoje'}
                            </h2>
                          </div>
                          <button
                            onClick={onOpenSchedule}
                            className="text-[10px] font-bold text-zinc-400 hover:text-zinc-100 flex items-center gap-0.5"
                          >
                            GRADE <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="py-8 text-center space-y-2 rounded-2xl border border-dashed border-[#EAE3D5]/60 dark:border-[#242427] bg-[#FAF8F5]/40 dark:bg-[#1C1C1F]/10">
                          <CalendarIcon className="w-8 h-8 text-zinc-300 dark:text-[#434346] mx-auto" />
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">Nenhuma aula agendada para hoje.</p>
                            <p className="text-[10px] text-[#919196]">Aproveite para revisar seus flashcards!</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#FFF9E6] dark:bg-amber-950/20 border border-[#F5E6BE] dark:border-amber-900/20 rounded-2xl p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Bell className="w-4 h-4 text-amber-500 shrink-0" />
                          <div className="min-w-0">
                            <h4 className="text-[11px] font-bold text-[#78350F] dark:text-amber-200 truncate">
                              Próxima Entrega: Histologia Digestória
                            </h4>
                            <p className="text-[9px] text-[#B45309] dark:text-amber-400 font-medium">
                              Em 2 dias (Quarta-feira)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );

              case 'priority_tasks':
                return (
                  <div
                    key={widget.id}
                    className="group relative"
                  >
                    {widgetControls}
                    <div className={`w-full h-full p-5 shadow-xs flex flex-col gap-4 relative overflow-hidden ${bgClass} ${borderClass} ${roundedClass} ${textClass}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 grid-drag-handle cursor-grab active:cursor-grabbing select-none">
                          <GripVertical className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                          <CheckSquare className="w-4 h-4 text-[#8C6239] dark:text-[#C6A07C]" />
                          <h2 className="font-serif font-bold text-sm sm:text-base">
                            {widget.customTitle || 'Prioridades & Memos'}
                          </h2>
                        </div>
                        <span className="text-[10px] font-semibold text-zinc-400">
                          {pendingTasks.length} pendente(s)
                        </span>
                      </div>

                      <form onSubmit={handleQuickTaskAdd} className="flex gap-1.5">
                        <input
                          type="text"
                          value={quickTaskTitle}
                          onChange={(e) => setQuickTaskTitle(e.target.value)}
                          placeholder="+ Adicionar tarefa rápida..."
                          className="flex-1 px-3 py-2 text-[11px] rounded-xl bg-[#FAF8F5] dark:bg-[#1C1C1F] text-zinc-800 dark:text-white border border-[#EAE3D5] dark:border-[#242427] focus:outline-none focus:border-zinc-400"
                        />
                        <button
                          type="submit"
                          disabled={!quickTaskTitle.trim()}
                          className="p-2 bg-[#4A6B53] text-white hover:bg-[#3d5944] disabled:opacity-50 rounded-xl shadow-xs transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </form>

                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 no-scrollbar">
                        {currentTasks.slice(0, 4).map((task) => {
                          const isCompleted = task.status === 'done';
                          const discipline = db.disciplines.find((d) => d.id === task.disciplineId);
                          return (
                            <div
                              key={task.id}
                              onClick={() => handleToggleTask(task)}
                              className="p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between gap-2 cursor-pointer hover:border-zinc-300 transition"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <button className="text-zinc-400 hover:text-emerald-500 shrink-0">
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <Circle className="w-4 h-4" />
                                  )}
                                </button>
                                <span className={`text-xs truncate ${isCompleted ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                  {task.title}
                                </span>
                              </div>
                              {discipline && (
                                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: discipline.color, backgroundColor: `${discipline.color}15` }}>
                                  {discipline.name.slice(0, 6)}..
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );

              case 'today_tasks_widget':
                return (
                  <div
                    key={widget.id}
                    className="group relative"
                  >
                    {widgetControls}
                    <div className={`w-full h-full p-5 shadow-xs flex flex-col gap-3.5 relative overflow-hidden ${bgClass} ${borderClass} ${roundedClass} ${textClass}`}>
                      <div className="flex items-center justify-between border-b border-[#EAE3D5]/40 dark:border-zinc-800/40 pb-2">
                        <div className="flex items-center gap-1.5 grid-drag-handle cursor-grab active:cursor-grabbing select-none">
                          <GripVertical className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                          <CheckSquare className="w-4 h-4 text-emerald-500" />
                          <h3 className="font-serif font-bold text-xs sm:text-sm">
                            {widget.customTitle || 'Tarefas de Hoje'}
                          </h3>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                          {todayTasks.length} Hoje
                        </span>
                      </div>

                      <div className="space-y-2 max-h-[180px] overflow-y-auto no-scrollbar">
                        {todayTasks.length === 0 ? (
                          <div className="py-6 text-center text-zinc-400 text-xs italic">
                            Tudo em ordem para hoje!
                          </div>
                        ) : (
                          todayTasks.map((t) => (
                            <div
                              key={t.id}
                              onClick={() => handleToggleTask(t)}
                              className="p-2.5 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between gap-2 cursor-pointer hover:border-emerald-500/20"
                            >
                              <div className="flex items-center gap-2">
                                {t.status === 'done' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Circle className="w-4 h-4 text-zinc-400" />
                                )}
                                <span className={`text-xs ${t.status === 'done' ? 'line-through text-zinc-400' : ''}`}>
                                  {t.title}
                                </span>
                              </div>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                t.priority === 'urgent' ? 'bg-red-500/10 text-red-500' :
                                t.priority === 'high' ? 'bg-orange-500/10 text-orange-500' : 'bg-zinc-500/10 text-zinc-400'
                              }`}>
                                {t.priority}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );

              case 'clock_widget':
                const clockStyle = widget.settings?.clockStyle || 'big';
                const showSeconds = widget.settings?.showSeconds !== false;
                const hours = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: showSeconds ? '2-digit' : undefined });
                const fullDate = currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

                return (
                  <div
                    key={widget.id}
                    className="group relative"
                  >
                    {widgetControls}
                    <div className={`w-full h-full p-5 shadow-xs flex flex-col justify-center items-center relative overflow-hidden ${bgClass} ${borderClass} ${roundedClass} ${textClass}`}>
                      <div className="grid-drag-handle absolute top-4 left-4 cursor-grab active:cursor-grabbing text-zinc-400 dark:text-zinc-600 select-none">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      {clockStyle === 'big' && (
                        <div className="text-center space-y-2">
                          <Clock className="w-5 h-5 mx-auto text-[#8C6239] dark:text-[#C6A07C]" />
                          <h3 className="text-4xl font-serif font-extrabold tracking-tight">{hours}</h3>
                          <p className="text-[9px] font-bold tracking-widest text-[#919196]">{fullDate}</p>
                        </div>
                      )}
                      {clockStyle === 'minimalist' && (
                        <div className="text-center">
                          <span className="text-3xl font-mono tracking-widest text-[#4A6B53] dark:text-emerald-400 font-bold block">{hours}</span>
                          <span className="text-[10px] text-zinc-400 font-semibold">{currentTime.toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      {clockStyle === 'with_date' && (
                        <div className="w-full text-left space-y-1">
                          <span className="text-[10px] font-bold text-[#8C6239] uppercase tracking-wider block">Estudo Ativo</span>
                          <h4 className="text-2xl font-serif font-bold leading-tight">{hours}</h4>
                          <div className="border-t border-zinc-100 dark:border-zinc-800/60 pt-1.5 mt-1">
                            <span className="text-[10px] text-zinc-400 font-bold block">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase()}</span>
                          </div>
                        </div>
                      )}
                      {clockStyle === 'compact' && (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <div>
                            <span className="text-base font-bold tracking-tight block">{hours}</span>
                            <span className="text-[8px] text-zinc-400 uppercase tracking-widest">{currentTime.toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );

              case 'calendar_widget':
                const days = getDaysInMonth(calendarMonth);
                const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
                const monthNameHeader = calendarMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();

                // Group daily tasks/events list for selected date
                const itemsOnSelectedDate = upcomingAgenda.filter(item => item.date === selectedCalendarDate);

                return (
                  <div
                    key={widget.id}
                    className="group relative"
                  >
                    {widgetControls}
                    <div className={`w-full h-full p-5 shadow-xs flex flex-col gap-4 relative overflow-hidden ${bgClass} ${borderClass} ${roundedClass} ${textClass}`}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 grid-drag-handle cursor-grab active:cursor-grabbing select-none">
                            <GripVertical className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                            <CalendarIcon className="w-4 h-4 text-emerald-500" />
                            <h4 className="font-serif font-bold text-xs sm:text-sm">
                              {widget.customTitle || 'Calendário'}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={handlePrevMonth} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition">
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-bold tracking-wider text-zinc-500">{monthNameHeader}</span>
                            <button onClick={handleNextMonth} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center">
                          {weekdays.map((w, i) => (
                            <span key={i} className="text-[9px] font-bold text-zinc-400 py-1">{w}</span>
                          ))}
                          {days.map((day, idx) => {
                            if (!day) return <div key={`empty-${idx}`} />;
                            const dayStr = day.toISOString().split('T')[0];
                            const isToday = dayStr === todayStr;
                            const isSelected = dayStr === selectedCalendarDate;

                            // Check if day has any events or tasks
                            const hasActivity = db.events.some(e => e.date === dayStr && e.semesterId === currentSemesterId) ||
                              currentTasks.some(t => t.date === dayStr && t.semesterId === currentSemesterId);

                            return (
                              <button
                                key={idx}
                                onClick={() => setSelectedCalendarDate(dayStr)}
                                className={`aspect-square p-1 text-[10px] font-semibold rounded-lg relative transition flex flex-col items-center justify-center cursor-pointer ${
                                  isSelected ? 'bg-[#4A6B53] text-white' :
                                  isToday ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-white border border-emerald-500/40' :
                                  'hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                                }`}
                              >
                                {day.getDate()}
                                {hasActivity && !isSelected && (
                                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-amber-500" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Integrated day tasks/events schedule drawer */}
                      <div className="border-t border-[#EAE3D5]/40 dark:border-zinc-800/40 pt-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                            Compromissos ({selectedCalendarDate})
                          </span>
                          <button
                            onClick={() => {
                              setTaskModalOpen(true);
                            }}
                            className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-0.5"
                          >
                            + NOVO
                          </button>
                        </div>

                        <div className="space-y-1.5 max-h-[100px] overflow-y-auto no-scrollbar">
                          {itemsOnSelectedDate.length === 0 ? (
                            <p className="text-[10px] text-zinc-400 italic py-1 text-center">Nenhum evento registrado para este dia.</p>
                          ) : (
                            itemsOnSelectedDate.map((item, idx) => (
                              <div key={idx} className="p-1.5 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/40 flex items-center justify-between text-[10px]">
                                <span className="truncate max-w-[120px] font-semibold text-zinc-700 dark:text-zinc-300">
                                  {item.title}
                                </span>
                                <span className="text-[8px] uppercase font-bold text-zinc-400">
                                  {item.type}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );

              case 'timer_widget':
                const formattedStopwatch = (() => {
                  const minutes = Math.floor(stopwatchTime / 60000);
                  const seconds = Math.floor((stopwatchTime % 60000) / 1000);
                  const centiseconds = Math.floor((stopwatchTime % 1000) / 10);
                  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
                })();

                const formattedTimer = (() => {
                  const m = Math.floor(timerSeconds / 60);
                  const s = timerSeconds % 60;
                  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                })();

                const timerProgress = timerTarget > 0 ? (timerSeconds / timerTarget) * 100 : 0;

                return (
                  <div
                    key={widget.id}
                    className="group relative"
                  >
                    {widgetControls}
                    <div className={`w-full h-full p-5 shadow-xs flex flex-col gap-4 relative overflow-hidden ${bgClass} ${borderClass} ${roundedClass} ${textClass}`}>
                      <div className="flex items-center justify-between border-b border-[#EAE3D5]/40 dark:border-zinc-800/40 pb-2">
                        <div className="flex items-center gap-1.5 grid-drag-handle cursor-grab active:cursor-grabbing select-none">
                          <GripVertical className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                          <Timer className="w-4 h-4 text-emerald-500" />
                          <h4 className="font-serif font-bold text-xs">
                            {widget.customTitle || 'Cronômetro'}
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Tabs: Stopwatch vs Temporizador */}
                        <div className="space-y-2">
                          <div className="text-center">
                            <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-widest mb-1">CRONÔMETRO</span>
                            <span className="text-2xl font-mono tracking-wider font-extrabold">{formattedStopwatch}</span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setStopwatchRunning(!stopwatchRunning)}
                              className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg text-white transition ${stopwatchRunning ? 'bg-amber-600' : 'bg-emerald-600'}`}
                            >
                              {stopwatchRunning ? 'Pausar' : 'Iniciar'}
                            </button>
                            <button
                              onClick={() => {
                                setStopwatchRunning(false);
                                setStopwatchTime(0);
                              }}
                              className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-white"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="border-t border-[#EAE3D5]/40 dark:border-zinc-800/40 pt-3 space-y-2">
                          <div className="text-center">
                            <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-widest mb-1">TEMPORIZADOR</span>
                            <span className="text-2xl font-mono tracking-wider font-extrabold text-blue-400">{formattedTimer}</span>
                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                              <div className="bg-blue-400 h-full transition-all duration-300" style={{ width: `${timerProgress}%` }} />
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                max="180"
                                value={timerInputMinutes}
                                onChange={(e) => {
                                  setTimerInputMinutes(e.target.value);
                                  const mins = parseInt(e.target.value) || 5;
                                  setTimerSeconds(mins * 60);
                                  setTimerTarget(mins * 60);
                                }}
                                disabled={timerRunning}
                                className="w-12 bg-zinc-50 dark:bg-zinc-900 text-xs px-1.5 py-1 rounded border dark:border-zinc-800 text-center"
                              />
                              <span className="text-[9px] text-zinc-400 font-bold uppercase">MIN</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setTimerRunning(!timerRunning)}
                                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg text-white transition ${timerRunning ? 'bg-amber-600' : 'bg-blue-600'}`}
                              >
                                {timerRunning ? 'Pausar' : 'Estudar'}
                              </button>
                              <button
                                onClick={() => {
                                  setTimerRunning(false);
                                  const mins = parseInt(timerInputMinutes) || 5;
                                  setTimerSeconds(mins * 60);
                                  setTimerTarget(mins * 60);
                                }}
                                className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );

              case 'study_focus_widget':
                const focusProgress = (focusTimeLeft / 1500) * 100;
                const minRem = Math.floor(focusTimeLeft / 60);
                const secRem = focusTimeLeft % 60;

                return (
                  <div
                    key={widget.id}
                    className="group relative"
                  >
                    {widgetControls}
                    <div className={`w-full h-full p-5 shadow-xs flex flex-col gap-4 relative overflow-hidden ${bgClass} ${borderClass} ${roundedClass} ${textClass}`}>
                      <div className="flex items-center justify-between border-b border-[#EAE3D5]/40 dark:border-zinc-800/40 pb-2">
                        <div className="flex items-center gap-1.5 grid-drag-handle cursor-grab active:cursor-grabbing select-none">
                          <GripVertical className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                          <Brain className="w-4 h-4 text-amber-400 animate-pulse" />
                          <h4 className="font-serif font-bold text-xs">
                            {widget.customTitle || 'Foco nos Estudos'}
                          </h4>
                        </div>
                      </div>

                      <div className="text-center space-y-3">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 block">
                          {focusMode === 'study' ? 'Sessão de Concentração' : 'Intervalo de Descanso'}
                        </span>
                        <h3 className="text-4xl font-serif font-extrabold text-[#8C6239] dark:text-[#C6A07C]">
                          {minRem.toString().padStart(2, '0')}:{secRem.toString().padStart(2, '0')}
                        </h3>

                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${focusMode === 'study' ? 'bg-[#4A6B53]' : 'bg-blue-400'}`}
                            style={{ width: `${focusProgress}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => setFocusRunning(!focusRunning)}
                            className={`px-4 py-2 text-[10px] font-bold uppercase rounded-xl text-white tracking-wider shadow transition ${
                              focusRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#4A6B53] hover:bg-[#3d5944]'
                            }`}
                          >
                            {focusRunning ? 'Pausar' : 'Focar'}
                          </button>
                          <button
                            onClick={() => {
                              setFocusRunning(false);
                              setFocusTimeLeft(focusMode === 'study' ? 1500 : 300);
                            }}
                            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-white"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-[#4A6B53] dark:text-emerald-400 pt-1 border-t border-[#EAE3D5]/40 dark:border-zinc-800/40">
                          <Award className="w-3.5 h-3.5" />
                          <span>Sessões Completas: {focusSessions}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );

              case 'academic_agenda_widget':
                return (
                  <div
                    key={widget.id}
                    className="group relative"
                  >
                    {widgetControls}
                    <div className={`w-full h-full p-5 shadow-xs flex flex-col gap-3.5 relative overflow-hidden ${bgClass} ${borderClass} ${roundedClass} ${textClass}`}>
                      <div className="flex items-center justify-between border-b border-[#EAE3D5]/40 dark:border-zinc-800/40 pb-2">
                        <div className="flex items-center gap-1.5 grid-drag-handle cursor-grab active:cursor-grabbing select-none">
                          <GripVertical className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                          <GraduationCap className="w-4 h-4 text-blue-400" />
                          <h3 className="font-serif font-bold text-xs sm:text-sm">
                            {widget.customTitle || 'Próximos Compromissos'}
                          </h3>
                        </div>
                      </div>

                      <div className="space-y-2.5 max-h-[200px] overflow-y-auto no-scrollbar">
                        {upcomingAgenda.length === 0 ? (
                          <div className="py-8 text-center text-zinc-400 text-xs italic">
                            Agenda acadêmica livre!
                          </div>
                        ) : (
                          upcomingAgenda.slice(0, 4).map((item, index) => (
                            <div
                              key={index}
                              className="p-3 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/40 flex items-start gap-3"
                            >
                              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold truncate text-zinc-800 dark:text-zinc-200">{item.title}</h4>
                                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">{item.date} • {item.type}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );

              case 'music_focus_widget':
                return (
                  <div
                    key={widget.id}
                    className="group relative"
                  >
                    {widgetControls}
                    <div className={`w-full h-full p-5 shadow-xs flex flex-col gap-4 relative overflow-hidden ${bgClass} ${borderClass} ${roundedClass} ${textClass}`}>
                      <div className="flex items-center justify-between border-b border-[#EAE3D5]/40 dark:border-zinc-800/40 pb-2">
                        <div className="flex items-center gap-1.5 grid-drag-handle cursor-grab active:cursor-grabbing select-none">
                          <GripVertical className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                          <Music className="w-4 h-4 text-emerald-500 animate-spin-slow" />
                          <h4 className="font-serif font-bold text-xs">
                            {widget.customTitle || 'Música & Foco'}
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-3.5 text-center">
                        <div className="p-2.5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/40">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">MÚSICA ATIVA</p>
                          <span className="text-xs font-bold block truncate max-w-[160px] mx-auto">
                            {ambientSound !== 'none' && ambientPlaying ? `Sintetizador: ${ambientSound.toUpperCase()}` : 'Nenhuma reprodução offline'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          {(['rain', 'lofi', 'whitenoise', 'binaural'] as SoundType[]).map((sound) => (
                            <button
                              key={sound}
                              onClick={() => toggleAmbientSound(sound)}
                              className={`px-2 py-1.5 rounded-xl border text-[9px] font-bold uppercase transition flex items-center justify-center gap-1 ${
                                ambientSound === sound && ambientPlaying
                                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                  : 'bg-zinc-100/50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                              }`}
                            >
                              {sound === 'rain' && <CloudRain className="w-3 h-3" />}
                              {sound === 'lofi' && <Music className="w-3 h-3" />}
                              {sound === 'whitenoise' && <Volume2 className="w-3 h-3" />}
                              {sound === 'binaural' && <Brain className="w-3 h-3" />}
                              {sound}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800/40 pt-3">
                          <Volume1 className="w-4 h-4 text-zinc-400" />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={ambientVolume}
                            onChange={(e) => handleAmbientVolumeChange(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );

              case 'quote_widget':
                const activeQuote = PRESET_QUOTES[quoteIndex];

                return (
                  <div
                    key={widget.id}
                    className="group relative"
                  >
                    {widgetControls}
                    <div className={`w-full h-full p-5 shadow-xs flex flex-col gap-3.5 relative overflow-hidden ${bgClass} ${borderClass} ${roundedClass} ${textClass}`}>
                      <div className="flex items-center justify-between border-b border-[#EAE3D5]/40 dark:border-zinc-800/40 pb-2">
                        <div className="flex items-center gap-1.5 grid-drag-handle cursor-grab active:cursor-grabbing select-none">
                          <GripVertical className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                          <Quote className="w-4 h-4 text-emerald-500" />
                          <h4 className="font-serif font-bold text-xs sm:text-sm">
                            {widget.customTitle || 'Frase Motivacional'}
                          </h4>
                        </div>
                        <button
                          onClick={() => setQuoteIndex((prev) => (prev + 1) % PRESET_QUOTES.length)}
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                          title="Alternar Frase"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="py-2 space-y-2 text-center">
                        <p className="text-sm font-serif italic text-zinc-800 dark:text-zinc-200 leading-relaxed">
                          "{activeQuote.text}"
                        </p>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                          — {activeQuote.author}
                        </span>
                      </div>
                    </div>
                  </div>
                );

              case 'progress_widget':
                const studySessionTarget = 4;
                const focusPercentage = Math.min(100, (focusSessions / studySessionTarget) * 100);
                const taskPercentage = currentTasks.length > 0 ? (completedTasksCount / currentTasks.length) * 100 : 0;

                return (
                  <div
                    key={widget.id}
                    className="group relative"
                  >
                    {widgetControls}
                    <div className={`w-full h-full p-5 shadow-xs flex flex-col gap-4 relative overflow-hidden ${bgClass} ${borderClass} ${roundedClass} ${textClass}`}>
                      <div className="flex items-center justify-between border-b border-[#EAE3D5]/40 dark:border-zinc-800/40 pb-2">
                        <div className="flex items-center gap-1.5 grid-drag-handle cursor-grab active:cursor-grabbing select-none">
                          <GripVertical className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                          <Award className="w-4 h-4 text-amber-500" />
                          <h4 className="font-serif font-bold text-xs">
                            {widget.customTitle || 'Progresso Acadêmico'}
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-zinc-500">Tarefas de Hoje</span>
                            <span className="text-[#4A6B53] dark:text-emerald-400">{completedTasksCount}/{currentTasks.length} ({Math.round(taskPercentage)}%)</span>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-[#4A6B53] h-full" style={{ width: `${taskPercentage}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-zinc-500">Metas de Estudo</span>
                            <span className="text-[#4A6B53] dark:text-emerald-400">{focusSessions}/{studySessionTarget} ({Math.round(focusPercentage)}%)</span>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full" style={{ width: `${focusPercentage}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );

              case 'weather_widget':
                return (
                  <div
                    key={widget.id}
                    className="group relative"
                  >
                    {widgetControls}
                    <div className={`w-full h-full p-5 shadow-xs flex flex-col gap-3 relative overflow-hidden ${bgClass} ${borderClass} ${roundedClass} ${textClass}`}>
                      <div className="flex items-center justify-between border-b border-[#EAE3D5]/40 dark:border-zinc-800/40 pb-2">
                        <div className="flex items-center gap-1.5 grid-drag-handle cursor-grab active:cursor-grabbing select-none">
                          <GripVertical className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                          <Thermometer className="w-4 h-4 text-emerald-500" />
                          <h4 className="font-serif font-bold text-xs">
                            {widget.customTitle || 'Clima'}
                          </h4>
                        </div>
                      </div>

                      <div className="text-center space-y-2">
                        {isEditingWeather ? (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={weatherCity}
                              onChange={(e) => {
                                setWeatherCity(e.target.value);
                                localStorage.setItem('widget_weather_city', e.target.value);
                              }}
                              className="bg-zinc-50 dark:bg-zinc-900 border text-[11px] px-2 py-1 rounded w-full border-zinc-200 dark:border-zinc-800"
                              placeholder="Cidade, UF"
                            />
                            <button
                              onClick={() => setIsEditingWeather(false)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold uppercase"
                            >
                              Salvar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsEditingWeather(true)}
                            className="text-[10px] text-zinc-400 font-bold hover:underline flex items-center gap-1 mx-auto animate-pulse"
                          >
                            <MapPin className="w-3 h-3 text-emerald-400" />
                            {weatherCity}
                          </button>
                        )}

                        <div className="flex items-center justify-center gap-3">
                          {weatherDetails.icon}
                          <div>
                            <span className="text-3xl font-serif font-extrabold block">{weatherDetails.temp}°C</span>
                            <span className="text-[10px] text-[#919196] uppercase tracking-wider font-bold block">{weatherDetails.text}</span>
                          </div>
                        </div>

                        <div className="flex justify-center gap-4 text-[10px] font-semibold text-zinc-400 pt-1 border-t border-[#EAE3D5]/40 dark:border-zinc-800/40">
                          <span>Min: {weatherDetails.min}°C</span>
                          <span>Max: {weatherDetails.max}°C</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );

              case 'quick_note_widget':
                return (
                  <div
                    key={widget.id}
                    className="group relative"
                  >
                    {widgetControls}
                    <div className={`w-full h-full p-5 shadow-xs flex flex-col gap-3 relative overflow-hidden ${bgClass} ${borderClass} ${roundedClass} ${textClass}`}>
                      <div className="flex items-center justify-between border-b border-[#EAE3D5]/40 dark:border-zinc-800/40 pb-2">
                        <div className="flex items-center gap-1.5 grid-drag-handle cursor-grab active:cursor-grabbing select-none">
                          <GripVertical className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                          <PenTool className="w-4 h-4 text-[#8C6239] dark:text-[#C6A07C]" />
                          <h4 className="font-serif font-bold text-xs">
                            {widget.customTitle || 'Nota Rápida'}
                          </h4>
                        </div>
                      </div>

                      <textarea
                        value={quickNoteText}
                        onChange={(e) => handleQuickNoteChange(e.target.value)}
                        placeholder="Comece a digitar sua anotação aqui... (salva automaticamente)"
                        className="w-full flex-1 bg-zinc-50/50 dark:bg-zinc-900/40 border border-[#EAE3D5]/40 dark:border-zinc-800 text-xs p-3 rounded-2xl focus:outline-none focus:border-zinc-400 text-zinc-700 dark:text-zinc-200 placeholder-zinc-400 resize-none min-h-[80px]"
                      />
                    </div>
                  </div>
                );

              case 'daily_goal_widget':
                return (
                  <div
                    key={widget.id}
                    className="group relative"
                  >
                    {widgetControls}
                    <div className={`w-full h-full p-5 shadow-xs flex flex-col gap-3 relative overflow-hidden ${bgClass} ${borderClass} ${roundedClass} ${textClass}`}>
                      <div className="flex items-center justify-between border-b border-[#EAE3D5]/40 dark:border-zinc-800/40 pb-2">
                        <div className="flex items-center gap-1.5 grid-drag-handle cursor-grab active:cursor-grabbing select-none">
                          <GripVertical className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                          <Award className="w-4 h-4 text-emerald-500 animate-pulse" />
                          <h4 className="font-serif font-bold text-xs">
                            {widget.customTitle || 'Meta do Dia'}
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-3.5 text-center">
                        <input
                          type="text"
                          value={dailyGoalText}
                          onChange={(e) => handleSaveDailyGoalText(e.target.value)}
                          placeholder="Insira sua meta do dia..."
                          className="w-full text-center bg-transparent border-none text-xs font-bold text-zinc-700 dark:text-zinc-200 focus:outline-none placeholder-zinc-400"
                        />

                        <button
                          onClick={toggleDailyGoal}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                            dailyGoalCompleted
                              ? 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-white'
                          }`}
                        >
                          {dailyGoalCompleted ? 'Meta Concluída ✓' : 'Marcar Concluída'}
                        </button>
                      </div>
                    </div>
                  </div>
                );

              case 'disciplines':
                return (
                  <div
                    key={widget.id}
                    className="group relative"
                  >
                    {widgetControls}
                    <div className="w-full h-full p-1 flex flex-col gap-4 overflow-y-auto no-scrollbar">
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1.5 grid-drag-handle cursor-grab active:cursor-grabbing select-none">
                          <GripVertical className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                          <h2 className="font-serif font-bold text-base sm:text-lg text-zinc-800 dark:text-white">
                            {widget.customTitle || 'Meus Cadernos & Disciplinas'}
                          </h2>
                        </div>

                        <button
                          onClick={() => onOpenTab?.('notebooks')}
                          className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          Ver todos ({activeNotebooks.length})
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {activeDisciplines.map((disc) => {
                          const discNotebook = db.notebooks.find((n) => n.disciplineId === disc.id);
                          return (
                            <div
                              key={disc.id}
                              onClick={() => {
                                if (discNotebook) onOpenNotebook(discNotebook.id);
                                else onOpenNotebooksClick();
                              }}
                              className="bg-white dark:bg-[#121214] border border-[#EAE3D5] dark:border-[#242427] p-5 rounded-3xl flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-700 hover:shadow-xs transition cursor-pointer group h-44"
                            >
                              <div className="flex items-start justify-between">
                                <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#1C1C1F] border border-[#EAE3D5]/40 dark:border-[#242427]">
                                  {getDisciplineIcon(disc.icon)}
                                </div>
                                <span
                                  className="w-2.5 h-2.5 rounded-full ring-4 ring-[#FAF8F5] dark:ring-[#121214]"
                                  style={{ backgroundColor: disc.color || '#3B82F6' }}
                                />
                              </div>

                              <div className="mt-3">
                                <h3 className="text-sm font-bold text-zinc-800 dark:text-white line-clamp-1 group-hover:text-black dark:group-hover:text-white transition">
                                  {disc.name}
                                </h3>
                                <p className="text-[11px] text-zinc-400 dark:text-[#919196] mt-0.5">
                                  {disc.professor ? `Prof. ${disc.professor}` : 'Professor não informado'}
                                </p>
                              </div>

                              <div className="border-t border-[#EAE3D5]/40 dark:border-[#242427]/60 pt-2.5 mt-2.5 flex items-center justify-between text-[11px] font-semibold">
                                <span className="text-zinc-400 dark:text-[#919196] uppercase tracking-wider">
                                  {currentSemester?.code || 'Semestre 1'}
                                </span>
                                <span className="text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-white transition flex items-center gap-1">
                                  Abrir
                                  <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );

              case 'motivation_widget':
                return (
                  <div
                    key={widget.id}
                    className="group relative"
                  >
                    {widgetControls}
                    <div className="w-full h-full p-1 flex flex-col overflow-y-auto no-scrollbar">
                      <div className="grid-drag-handle flex items-center gap-1.5 px-3 py-1.5 mb-2 bg-zinc-100/10 hover:bg-zinc-100/20 text-xs font-semibold text-zinc-400 rounded-lg cursor-grab active:cursor-grabbing select-none w-fit">
                        <GripVertical className="w-3.5 h-3.5 text-zinc-400" />
                        Mover Mural de Visão & Metas
                      </div>
                      <div className="space-y-4 w-full">
                        <VisionMural />
                      </div>
                    </div>
                  </div>
                );

              default:
                return null;
            }
          })}
        </Responsive>
      </div>

      {/* Widget Visual Customization Settings Modal */}
      {editingWidget && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-250">
          <div className="bg-[#121214] border border-[#242427] p-6 rounded-3xl w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#242427] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  Personalizar: {editingWidget.title}
                </h3>
                <p className="text-[10px] text-[#919196] mt-0.5">Configure dimensões e preferências visuais do bloco</p>
              </div>
              <button
                onClick={() => setEditingWidget(null)}
                className="p-1 rounded-lg text-[#919196] hover:bg-[#1C1C1F] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-400 uppercase tracking-widest block text-[9px]">Título Customizado</label>
                <input
                  type="text"
                  placeholder={editingWidget.title}
                  value={editingWidget.customTitle || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingWidget((prev) => prev ? { ...prev, customTitle: val } : null);
                  }}
                  className="w-full bg-[#1C1C1F] border border-[#242427] text-white px-3.5 py-2.5 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-400 uppercase tracking-widest block text-[9px]">Dimensão (Tamanho)</label>
                  <select
                    value={editingWidget.size || 'md'}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setEditingWidget((prev) => prev ? { ...prev, size: val } : null);
                    }}
                    className="w-full bg-[#1C1C1F] border border-[#242427] text-white px-3 py-2.5 rounded-xl"
                  >
                    <option value="sm">Pequeno (1 col)</option>
                    <option value="md">Médio (2 col)</option>
                    <option value="lg">Grande (3 col)</option>
                    <option value="full">Largura Completa</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-400 uppercase tracking-widest block text-[9px]">Aparência de Cores</label>
                  <select
                    value={editingWidget.themeMode || 'auto'}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setEditingWidget((prev) => prev ? { ...prev, themeMode: val } : null);
                    }}
                    className="w-full bg-[#1C1C1F] border border-[#242427] text-white px-3 py-2.5 rounded-xl"
                  >
                    <option value="auto">Automático (Tema Global)</option>
                    <option value="light">Sempre Claro (Light)</option>
                    <option value="dark">Sempre Escuro (Dark)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-400 uppercase tracking-widest block text-[9px]">Estilo do Card</label>
                  <select
                    value={editingWidget.style || 'bordered'}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setEditingWidget((prev) => prev ? { ...prev, style: val } : null);
                    }}
                    className="w-full bg-[#1C1C1F] border border-[#242427] text-white px-2 py-2 rounded-xl text-[11px]"
                  >
                    <option value="bordered">Padrão</option>
                    <option value="minimalist">Minimalista</option>
                    <option value="glass">Vidro (Glass)</option>
                    <option value="pastel">Areia Pastel</option>
                    <option value="academic">Clássico Acadêmico</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-400 uppercase tracking-widest block text-[9px]">Transparência</label>
                  <select
                    value={editingWidget.transparency || 'none'}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setEditingWidget((prev) => prev ? { ...prev, transparency: val } : null);
                    }}
                    className="w-full bg-[#1C1C1F] border border-[#242427] text-white px-2 py-2 rounded-xl text-[11px]"
                  >
                    <option value="none">Sólido</option>
                    <option value="subtle">Sutil</option>
                    <option value="high">Forte</option>
                    <option value="full">Transparente</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-400 uppercase tracking-widest block text-[9px]">Bordas</label>
                  <select
                    value={editingWidget.borders || 'thin'}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setEditingWidget((prev) => prev ? { ...prev, borders: val } : null);
                    }}
                    className="w-full bg-[#1C1C1F] border border-[#242427] text-white px-2 py-2 rounded-xl text-[11px]"
                  >
                    <option value="none">Sem Borda</option>
                    <option value="thin">Borda Fina</option>
                    <option value="thick">Borda Realce</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-400 uppercase tracking-widest block text-[9px]">Borda Arredondada</label>
                  <select
                    value={editingWidget.borderRadius || '3xl'}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setEditingWidget((prev) => prev ? { ...prev, borderRadius: val } : null);
                    }}
                    className="w-full bg-[#1C1C1F] border border-[#242427] text-white px-3 py-2.5 rounded-xl"
                  >
                    <option value="none">Rígida (Canto vivo)</option>
                    <option value="md">Arredondado Leve (MD)</option>
                    <option value="lg">Arredondado Médio (LG)</option>
                    <option value="2xl">Arredondado Amplo (2XL)</option>
                    <option value="3xl">Espaçoso (3XL)</option>
                  </select>
                </div>
              </div>

              {/* Widget-specific additional settings rendering inside settings modal */}
              {editingWidget.id === 'clock_widget' && (
                <div className="p-3 bg-[#1C1C1F] border border-[#2E2E32] rounded-2xl space-y-3">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Configuração de Relógio</span>
                  <div className="flex items-center gap-5">
                    <label className="flex items-center gap-1.5 text-white cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editingWidget.settings?.showSeconds !== false}
                        onChange={(e) => {
                          const currentSettings = editingWidget.settings || {};
                          setEditingWidget((prev) => prev ? {
                            ...prev,
                            settings: { ...currentSettings, showSeconds: e.target.checked }
                          } : null);
                        }}
                      />
                      Mostrar Segundos
                    </label>

                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] text-zinc-400 font-bold block uppercase">Estilo de Layout</span>
                      <select
                        value={editingWidget.settings?.clockStyle || 'big'}
                        onChange={(e) => {
                          const currentSettings = editingWidget.settings || {};
                          setEditingWidget((prev) => prev ? {
                            ...prev,
                            settings: { ...currentSettings, clockStyle: e.target.value }
                          } : null);
                        }}
                        className="w-full bg-[#121214] border border-[#242427] text-white px-2 py-1.5 rounded-xl"
                      >
                        <option value="big">Digital Grande</option>
                        <option value="minimalist">Digital Minimalista</option>
                        <option value="with_date">Relógio com Data Completa</option>
                        <option value="compact">Relógio Compacto</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#242427] pt-4">
              <button
                onClick={() => setEditingWidget(null)}
                className="px-4 py-2 text-zinc-400 hover:text-white font-bold uppercase tracking-wider text-[10px]"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (editingWidget) {
                    handleUpdateWidget(editingWidget.id, {
                      customTitle: editingWidget.customTitle,
                      size: editingWidget.size,
                      style: editingWidget.style,
                      transparency: editingWidget.transparency,
                      borders: editingWidget.borders,
                      borderRadius: editingWidget.borderRadius,
                      themeMode: editingWidget.themeMode,
                      settings: editingWidget.settings
                    });
                  }
                  setEditingWidget(null);
                  confetti({ particleCount: 20, spread: 40 });
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] shadow"
              >
                Salvar Customização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {taskModalOpen && (
        <TaskModal
          isOpen={taskModalOpen}
          onClose={() => setTaskModalOpen(false)}
          activeSemesterId={currentSemesterId}
        />
      )}

      {eventModalOpen && (
        <EventModal
          isOpen={eventModalOpen}
          onClose={() => setEventModalOpen(false)}
          activeSemesterId={currentSemesterId}
        />
      )}

      {disciplineModalOpen && (
        <DisciplineModal
          isOpen={disciplineModalOpen}
          onClose={() => setDisciplineModalOpen(false)}
          activeSemesterId={currentSemesterId}
        />
      )}

      {/* Profile Avatar Image Editor */}
      {isAvatarEditorOpen && (
        <UniversalImageEditor
          isOpen={isAvatarEditorOpen}
          onClose={() => setIsAvatarEditorOpen(false)}
          title="Editar Foto de Perfil"
          originalImage={profile.avatarOriginal || profile.avatarUrl || profile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
          editParams={profile.avatarEditParams}
          circleCrop={true}
          aspectRatios={['1:1']}
          onSave={handleSaveAvatar}
        />
      )}

      {/* Dashboard Wallpaper Image Editor */}
      {isWallpaperEditorOpen && (
        <UniversalImageEditor
          isOpen={isWallpaperEditorOpen}
          onClose={() => setIsWallpaperEditorOpen(false)}
          title="Editar Wallpaper do Dashboard"
          originalImage={profile.dashboardWallpaperOriginal || profile.dashboardWallpaperUrl || "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1600&auto=format&fit=crop"}
          editParams={profile.dashboardWallpaperEditParams}
          circleCrop={false}
          aspectRatios={['free', '16:9', '4:3']}
          onSave={handleSaveWallpaper}
        />
      )}
    </div>
  );
};
