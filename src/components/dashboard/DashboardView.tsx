import React, { useState } from 'react';
import { StorageService } from '../../lib/storage';
import { AcademicTask, AcademicEvent, Notebook, Lesson, Discipline, WidgetConfig } from '../../types';
import { TaskModal } from '../tasks/TaskModal';
import { EventModal } from '../calendar/EventModal';
import { DisciplineModal } from '../semesters/DisciplineModal';
import { UniversalImageEditor, DEFAULT_EDIT_PARAMS } from '../editor/UniversalImageEditor';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Plus,
  ArrowRight,
  Brain,
  Layers,
  ChevronRight,
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
} from 'lucide-react';
import confetti from 'canvas-confetti';

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

  // Quick Task list input state
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  // Load customizable widgets from database
  const widgetsList: WidgetConfig[] = profile.widgetsConfig || [
    { id: 'profile_banner', title: 'Banner de Perfil', visible: true, size: 'full', position: 0 },
    { id: 'schedule', title: 'Aulas de Hoje (Cronograma)', visible: true, size: 'full', position: 1 },
    { id: 'priority_tasks', title: 'Prioridades & Memos', visible: true, size: 'full', position: 2 },
    { id: 'motivation_widget', title: 'Mural de Visão & Metas', visible: true, size: 'full', position: 3 },
    { id: 'disciplines', title: 'Meus Cadernos & Disciplinas', visible: true, size: 'full', position: 4 },
  ];

  // Sorting widgets by position
  const sortedWidgets = [...widgetsList].sort((a, b) => a.position - b.position);

  // Widget customizer handler
  const handleUpdateWidget = (id: string, updates: Partial<WidgetConfig>) => {
    StorageService.update((draft) => {
      if (!draft.profile.widgetsConfig) {
        draft.profile.widgetsConfig = [...widgetsList];
      }
      const widget = draft.profile.widgetsConfig.find((w) => w.id === id);
      if (widget) {
        Object.assign(widget, updates);
      }
    });
  };

  const handleMoveWidget = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= sortedWidgets.length) return;

    StorageService.update((draft) => {
      if (!draft.profile.widgetsConfig) {
        draft.profile.widgetsConfig = [...widgetsList];
      }
      const list = draft.profile.widgetsConfig;
      const current = list.find((w) => w.id === sortedWidgets[index].id);
      const neighbor = list.find((w) => w.id === sortedWidgets[nextIndex].id);

      if (current && neighbor) {
        const temp = current.position;
        current.position = neighbor.position;
        neighbor.position = temp;
      }
    });
  };

  // Get active disciplines and notebooks
  const activeNotebooks = db.notebooks.filter((n) => n.semesterId === currentSemesterId);
  const activeDisciplines = db.disciplines.filter((d) => d.semesterId === currentSemesterId);

  // All Tasks for the Semester
  const currentTasks = db.tasks.filter((t) => t.semesterId === currentSemesterId);
  const completedTasksCount = currentTasks.filter((t) => t.status === 'done').length;
  const pendingTasks = currentTasks.filter((t) => t.status !== 'done');

  // Handle Quick Task Adding
  const handleQuickTaskAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    // Pick first active discipline or default
    const targetDiscipline = activeDisciplines[0] || db.disciplines[0];

    const newTask: AcademicTask = {
      id: `task-${Date.now()}`,
      semesterId: currentSemesterId,
      disciplineId: targetDiscipline?.id || 'disc-1',
      title: quickTaskTitle.trim(),
      description: 'Adicionada rapidamente pelo painel.',
      date: new Date().toISOString().split('T')[0],
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
    const now = new Date();
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Visual Customizer Control Bar */}
      <div className="flex items-center justify-between bg-[#121214] border border-[#242427] px-4 py-2.5 rounded-2xl">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-[#E2E2E2]">Painel de Controle Acadêmico</span>
        </div>
        <button
          onClick={() => setCustomizerOpen(!customizerOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C1F] hover:bg-[#242427] border border-[#242427] text-[10px] font-bold text-white uppercase tracking-wider rounded-xl transition cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-blue-400" />
          {customizerOpen ? 'Fechar Ajustes' : 'Personalizar Painel'}
        </button>
      </div>

      {/* Widget Customizer Slide-down Panel */}
      {customizerOpen && (
        <div className="bg-[#121214] border border-[#242427] p-5 rounded-2xl shadow-lg space-y-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between border-b border-[#242427] pb-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-blue-400" />
              Organizador Visual de Widgets
            </h3>
            <span className="text-[10px] text-[#919196]">Ajuste a visibilidade e ordem dos elementos</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {sortedWidgets.map((widget, index) => (
              <div
                key={widget.id}
                className="p-3 bg-[#1C1C1F] border border-[#2E2E32] rounded-xl flex flex-col justify-between gap-3 hover:border-blue-500/30 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white truncate">{widget.title}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateWidget(widget.id, { visible: !widget.visible })}
                      className="p-1 hover:bg-[#242427] rounded-lg transition text-[#919196] hover:text-white cursor-pointer"
                      title={widget.visible ? 'Ocultar widget' : 'Mostrar widget'}
                    >
                      {widget.visible ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
                    </button>
                    <button
                      onClick={() => handleMoveWidget(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-[#242427] disabled:opacity-30 rounded-lg text-white cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveWidget(index, 'down')}
                      disabled={index === sortedWidgets.length - 1}
                      className="p-1 hover:bg-[#242427] disabled:opacity-30 rounded-lg text-white cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Widget Layout */}
      <div className="space-y-6">
        {sortedWidgets
          .filter((w) => w.visible)
          .map((widget) => {
            switch (widget.id) {
              case 'profile_banner':
                return (
                  <div key={widget.id} className="relative rounded-3xl overflow-hidden shadow-sm border border-[#242427]/10 dark:border-[#242427] bg-[#121214] text-white">
                    {/* Sunlit Tree Wallpaper Background */}
                    <div className="min-h-[28rem] sm:min-h-[26rem] w-full relative overflow-hidden bg-[#2d3a22] flex flex-col justify-between p-6 sm:p-8">
                      {/* Premium Wallpaper Unsplash Image */}
                      <img
                        src={profile.dashboardWallpaperUrl || "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1600&auto=format&fit=crop"}
                        alt="Árvore Solar Wallpaper"
                        className="absolute inset-0 w-full h-full object-cover select-none"
                      />
                      {/* Dark gradient overlay for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/30 to-black/60" />

                      {/* Top Row: Date & Wallpaper customization */}
                      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                        <div className="flex items-center gap-2 text-white/95 text-[11px] font-bold tracking-wider uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
                          {getFormattedDate()}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Active Semester Name */}
                          <span className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-black/40 text-white backdrop-blur-md border border-white/10 shadow-xs">
                            Matérias {currentSemester?.name || '1º Período'}
                          </span>

                          <button
                            onClick={() => setIsWallpaperEditorOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-black/55 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider rounded-xl transition cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5 text-blue-400" />
                            Editar Wallpaper
                          </button>
                        </div>
                      </div>

                      {/* Middle: Profile Info Card */}
                      <div className="relative z-10 flex flex-col gap-5 mt-auto pt-12">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                          {/* Profile Avatar framed beautifully */}
                          <div className="relative w-24 h-24 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl shrink-0 group">
                            <img
                              src={profile.avatarUrl || profile.avatar}
                              alt={profile.name}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => setIsAvatarEditorOpen(true)}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-bold uppercase transition-all duration-200 cursor-pointer"
                            >
                              <ImageIcon className="w-4 h-4 mb-0.5 text-blue-400" />
                              Editar Foto
                            </button>
                          </div>

                          <div className="space-y-1">
                            <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-white tracking-tight drop-shadow-md">
                              Olá, {profile.name}
                            </h1>
                            <p className="text-sm sm:text-base text-white/90 font-medium tracking-tight">
                              {profile.course} • {profile.institution || profile.university || 'Universidade Federal de Uberlândia (UFU)'}
                            </p>
                          </div>
                        </div>

                        {/* Glassmorphic Quote Block */}
                        {profile.quote && (
                          <div className="p-4 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 flex items-start gap-3 text-white/95 shadow-lg max-w-4xl">
                            <Quote className="w-4 h-4 text-white/70 shrink-0 mt-0.5" />
                            <div className="text-xs sm:text-sm text-white/90 italic font-medium leading-relaxed">
                              "{profile.quote}" {profile.quoteAuthor && <span className="font-semibold not-italic text-white/80 block mt-1.5">— {profile.quoteAuthor}</span>}
                            </div>
                          </div>
                        )}

                        {/* Dynamic Stat Pills Bar mapped exactly to image 1 */}
                        <div className="flex flex-wrap items-center gap-2.5 mt-2 border-t border-white/10 pt-4">
                          <button
                            onClick={() => onOpenTab?.('notebooks')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-white text-zinc-950 shadow-md hover:scale-102 transition duration-200 cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-zinc-600" />
                            Cadernos ({activeNotebooks.length})
                          </button>
                          <button
                            onClick={() => onOpenTab?.('mindmaps')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-md hover:scale-102 transition duration-200 cursor-pointer"
                          >
                            <Network className="w-3.5 h-3.5 text-emerald-400" />
                            Mapas Mentais
                          </button>
                          <button
                            onClick={() => onOpenTab?.('flashcards')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-md hover:scale-102 transition duration-200 cursor-pointer"
                          >
                            <Brain className="w-3.5 h-3.5 text-amber-400" />
                            Flashcards ({db.flashcardDecks.filter(d => d.semesterId === currentSemesterId).length})
                          </button>
                          <button
                            onClick={() => onOpenTab?.('motivation')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-md hover:scale-102 transition duration-200 cursor-pointer"
                          >
                            <Flame className="w-3.5 h-3.5 text-red-400" />
                            Foco Pomodoro
                          </button>
                          <button
                            onClick={() => onOpenTab?.('games')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-md hover:scale-102 transition duration-200 cursor-pointer"
                          >
                            <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
                            Jogos Educativos
                          </button>
                          {(() => {
                            const semDiscs = db.disciplines.filter((d) => d.semesterId === currentSemesterId);
                            const totalDiscs = semDiscs.length;
                            const totalGrades = semDiscs.reduce((sum, d) => {
                              if (!d.grades) return sum;
                              return sum + (d.grades.prova || 0) + (d.grades.trabalhos || 0) + (d.grades.eds || 0) + (d.grades.seminarios || 0) + (d.grades.projetos || 0);
                            }, 0);
                            const avgGrade = totalDiscs > 0 ? (totalGrades / totalDiscs) : 0;
                            return (
                              <button
                                onClick={() => onOpenTab?.('boletim')}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-md hover:scale-102 transition duration-200 cursor-pointer"
                              >
                                <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                                Boletim {avgGrade > 0 ? `(${avgGrade.toFixed(0)}%)` : '(Lançar)'}
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                );

              case 'schedule':
                return (
                  <div key={widget.id} className="bg-white dark:bg-[#121214] rounded-3xl border border-[#EAE3D5] dark:border-[#242427] p-6 shadow-xs space-y-5">
                    {/* Title Header exactly like image 2 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-zinc-800 dark:text-white">
                        <Clock className="w-4 h-4 text-[#8C6239] dark:text-[#C6A07C]" />
                        <h2 className="font-serif font-bold text-base sm:text-lg">Aulas de Hoje (Domingo)</h2>
                      </div>
                      <button
                        onClick={onOpenSchedule}
                        className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        Grade
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Placeholder content exactly like image 2 */}
                    <div className="py-10 text-center space-y-2.5 rounded-2xl border border-dashed border-[#EAE3D5] dark:border-[#242427] bg-[#FAF8F5]/30 dark:bg-[#1C1C1F]/10">
                      <Calendar className="w-10 h-10 text-zinc-300 dark:text-[#434346] mx-auto" />
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-zinc-700 dark:text-white">Nenhuma aula agendada para hoje.</p>
                        <p className="text-[11px] text-zinc-400 dark:text-[#919196]">Aproveite para revisar seus flashcards!</p>
                      </div>
                    </div>

                    {/* Histology Task specific notification exactly like image 2 */}
                    <div className="bg-[#FFF9E6] dark:bg-amber-950/20 border border-[#F5E6BE] dark:border-amber-900/30 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-[#F5E6BE]/60 dark:bg-amber-950/50 text-[#B45309] shrink-0">
                          <Bell className="w-4 h-4 text-[#B45309] dark:text-amber-400 animate-pulse" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-[#78350F] dark:text-amber-200 truncate">
                            Entrega do Trabalho de Histologia — Lâminas do Sistema Digestório
                          </h4>
                          <p className="text-[11px] text-[#B45309] dark:text-amber-400/95 mt-0.5 font-medium">
                            2026-08-26 (Citologia, Histologia e Embri. Geral)
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenTab?.('tasks')}
                        className="text-xs font-bold text-[#78350F] dark:text-amber-200 hover:underline shrink-0 px-2 cursor-pointer"
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                );

              case 'priority_tasks':
                return (
                  <div key={widget.id} className="bg-white dark:bg-[#121214] rounded-3xl border border-[#EAE3D5] dark:border-[#242427] p-6 shadow-xs space-y-5">
                    {/* Header with counter exactly like image 3 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-zinc-800 dark:text-white">
                        <CheckSquare className="w-4 h-4 text-[#8C6239] dark:text-[#C6A07C]" />
                        <h2 className="font-serif font-bold text-base sm:text-lg">Prioridades & Memos</h2>
                      </div>
                      <span className="text-xs font-medium text-zinc-400 dark:text-[#919196]">
                        {pendingTasks.length} pendente(s)
                      </span>
                    </div>

                    {/* Quick Task Input Field precisely styled like image 3 */}
                    <form onSubmit={handleQuickTaskAdd} className="flex gap-2">
                      <input
                        type="text"
                        value={quickTaskTitle}
                        onChange={(e) => setQuickTaskTitle(e.target.value)}
                        placeholder="+ Adicionar tarefa rápida..."
                        className="flex-1 px-4 py-3 text-xs rounded-2xl bg-[#FAF8F5] dark:bg-[#1C1C1F] text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 border border-[#EAE3D5] dark:border-[#242427] focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
                      />
                      <button
                        type="submit"
                        disabled={!quickTaskTitle.trim()}
                        className="p-3 bg-[#4A6B53] text-white hover:bg-[#3d5944] disabled:opacity-50 rounded-2xl shadow-xs transition shrink-0 cursor-pointer flex items-center justify-center w-11 h-11"
                        title="Adicionar tarefa"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </form>

                    {/* Task checklist rows exactly like image 3 */}
                    {currentTasks.length === 0 ? (
                      <div className="p-4 text-center text-xs text-zinc-400 italic">
                        Nenhuma tarefa pendente! Use o campo acima para adicionar uma nova prioridade.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {currentTasks.slice(0, 5).map((task) => {
                          const discipline = db.disciplines.find((d) => d.id === task.disciplineId);
                          const isCompleted = task.status === 'done';

                          return (
                            <div
                              key={task.id}
                              onClick={() => handleToggleTask(task)}
                              className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer group ${
                                isCompleted
                                  ? 'bg-[#FAF8F5]/50 dark:bg-[#1C1C1F]/40 border-[#FAF8F5] dark:border-[#1C1C1F]'
                                  : 'bg-[#FAF8F5] dark:bg-[#1C1C1F] border-[#EAE3D5]/40 dark:border-[#242427] hover:border-zinc-300 dark:hover:border-zinc-700'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleTask(task);
                                  }}
                                  className="text-zinc-400 hover:text-[#4A6B53] transition shrink-0"
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                                  ) : (
                                    <Circle className="w-5 h-5 group-hover:scale-105 transition-transform" />
                                  )}
                                </button>

                                <span
                                  className={`text-xs sm:text-sm font-medium transition truncate ${
                                    isCompleted
                                      ? 'line-through text-zinc-400 dark:text-zinc-600'
                                      : 'text-zinc-800 dark:text-zinc-100'
                                  }`}
                                >
                                  {task.title}
                                </span>
                              </div>

                              {discipline && (
                                <span
                                  className="text-[10px] font-semibold uppercase tracking-wider shrink-0 transition"
                                  style={{ color: discipline.color || '#8C6239' }}
                                >
                                  {discipline.name}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Footer completion state count precisely like image 3 */}
                    <div className="border-t border-[#EAE3D5]/40 dark:border-[#242427] pt-3 text-[11px] font-semibold text-zinc-400 dark:text-[#919196]">
                      {completedTasksCount} tarefa(s) concluída(s)
                    </div>
                  </div>
                );

              case 'motivation_widget':
                return (
                  <div key={widget.id} className="bg-white dark:bg-[#121214] rounded-3xl border border-[#EAE3D5] dark:border-[#242427] p-6 shadow-xs space-y-5">
                    {/* Header with Mural > link exactly like image 4 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-zinc-800 dark:text-white">
                        <Sparkles className="w-4 h-4 text-[#8C6239] dark:text-[#C6A07C]" />
                        <h2 className="font-serif font-bold text-base sm:text-lg">Mural de Visão & Metas</h2>
                      </div>
                      <button
                        onClick={() => onOpenTab?.('motivation')}
                        className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        Mural
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Meta Mosaic Grid with 2 beautiful images exactly like image 4 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Image 1: Minimalist Study Space */}
                      <div className="relative aspect-[3/2] sm:aspect-video rounded-2xl overflow-hidden border border-[#EAE3D5] dark:border-[#242427] group shadow-sm">
                        <img
                          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop"
                          alt="Mesa de Estudos Minimalista"
                          className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-3.5 left-4 text-white">
                          <p className="text-xs sm:text-sm font-bold tracking-tight">Mesa de Estudos Minimalista & Foco</p>
                          <p className="text-[10px] text-white/80 font-medium mt-0.5">Rotina & Foco</p>
                        </div>
                      </div>

                      {/* Image 2: Veterinarian Cell Biology */}
                      <div className="relative aspect-[3/2] sm:aspect-video rounded-2xl overflow-hidden border border-[#EAE3D5] dark:border-[#242427] group shadow-sm">
                        <img
                          src="https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop"
                          alt="Clínica Veterinária"
                          className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-3.5 left-4 text-white">
                          <p className="text-xs sm:text-sm font-bold tracking-tight">Clínica e Diagnóstico Veterinário</p>
                          <p className="text-[10px] text-white/80 font-medium mt-0.5">Carreira dos Sonhos</p>
                        </div>
                      </div>
                    </div>

                    {/* Slogan under image precisely like image 4 */}
                    <div className="text-xs sm:text-sm italic font-medium text-zinc-500 dark:text-[#919196] border-l-2 border-[#4A6B53]/50 pl-3">
                      "O hábito diário de estudar constrói a carreira dos seus sonhos."
                    </div>

                    {/* Interactive Button exactly like image 4 */}
                    <button
                      onClick={() => onOpenTab?.('motivation')}
                      className="w-full py-3 bg-[#FAF8F5] hover:bg-[#FAF8F5]/80 dark:bg-[#1C1C1F] dark:hover:bg-[#242427] text-zinc-700 dark:text-[#EDEDED] border border-[#EAE3D5] dark:border-[#242427] text-xs font-semibold rounded-2xl transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-[#8C6239]" />
                      Adicionar Frase / Foto ao Mural
                    </button>
                  </div>
                );

              case 'disciplines':
                return (
                  <div key={widget.id} className="space-y-4">
                    {/* Title section exactly like image 5 */}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <h2 className="font-serif font-bold text-base sm:text-lg text-zinc-800 dark:text-white">
                          Meus Cadernos & Disciplinas
                        </h2>
                        <p className="text-xs text-zinc-400 dark:text-[#919196] mt-0.5">
                          Abra qualquer disciplina para criar páginas no editor completo estilo Word
                        </p>
                      </div>

                      <button
                        onClick={() => onOpenTab?.('notebooks')}
                        className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        Ver todos ({activeNotebooks.length})
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Grid card structure matching precisely image 5 */}
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
                              {/* Left top: Lucide Topic-specific Icon */}
                              <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#1C1C1F] border border-[#EAE3D5]/40 dark:border-[#242427]">
                                {getDisciplineIcon(disc.icon)}
                              </div>

                              {/* Right top: Colored dot */}
                              <span
                                className="w-2.5 h-2.5 rounded-full ring-4 ring-[#FAF8F5] dark:ring-[#121214]"
                                style={{ backgroundColor: disc.color || '#3B82F6' }}
                              />
                            </div>

                            {/* Center: Course & Prof details */}
                            <div className="mt-3">
                              <h3 className="text-sm font-bold text-zinc-800 dark:text-white line-clamp-1 group-hover:text-black dark:group-hover:text-white transition">
                                {disc.name}
                              </h3>
                              <p className="text-[11px] text-zinc-400 dark:text-[#919196] mt-0.5">
                                {disc.professor ? `Prof. ${disc.professor}` : 'Professor não informado'}
                              </p>
                            </div>

                            {/* Card Footer */}
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
                );

              default:
                return null;
            }
          })}
      </div>

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
          semesterId={currentSemesterId}
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
