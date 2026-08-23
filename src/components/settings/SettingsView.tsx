import React, { useState, useEffect } from 'react';
import { StorageService } from '../../lib/storage';
import { Semester, Profile, CustomThemeColors, ThemeType } from '../../types';
import { exportSemesterToPdf } from '../../lib/pdfExport';
import { PwaSyncPanel } from './PwaSyncPanel';
import { ImageEditorModal } from '../common/ImageEditorModal';
import {
  User,
  Settings,
  Layers,
  Download,
  Upload,
  RotateCcw,
  Palette,
  Moon,
  Sun,
  Shield,
  Smartphone,
  Check,
  Plus,
  Trash2,
  Archive,
  Image as ImageIcon,
  Heart,
  Sparkles,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SettingsViewProps {
  onSemesterChange?: () => void;
  onThemeChange?: () => void;
  initialTab?: 'profile' | 'semesters' | 'appearance' | 'backup' | 'pwa';
}

// Function to apply the visual theme variables globally
export function applyGlobalTheme(profile: Profile) {
  let styleEl = document.getElementById('custom-theme-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'custom-theme-styles';
    document.head.appendChild(styleEl);
  }

  // Determine light/dark/auto mode
  let isDark = profile.isDarkMode;
  if (profile.themeMode === 'light') isDark = false;
  else if (profile.themeMode === 'dark') isDark = true;
  else if (profile.themeMode === 'auto') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Predefined theme presets
  let colors: CustomThemeColors = {
    primary: '#3B82F6',
    secondary: '#1E40AF',
    button: '#3B82F6',
    menu: '#1C1C1E',
    icon: '#60A5FA',
    highlight: '#60A5FA',
    text: '#E2E2E2',
    background: '#0A0A0B',
    card: '#121214',
    sidebar: '#121214',
    topbar: '#121214',
  };

  const t = profile.theme;
  if (t === 'nature' || t === 'sage') {
    colors = {
      primary: '#4A6B53',
      secondary: '#2E4333',
      button: '#4A6B53',
      menu: isDark ? '#1C241E' : '#E8EFEA',
      icon: '#81C784',
      highlight: '#A5D6A7',
      text: isDark ? '#E8F5E9' : '#1C241E',
      background: isDark ? '#0C0F0D' : '#F1F7F3',
      card: isDark ? '#141A16' : '#FFFFFF',
      sidebar: isDark ? '#111613' : '#E8EFEA',
      topbar: isDark ? '#111613' : '#E8EFEA',
    };
  } else if (t === 'pastel' || t === 'lavender') {
    colors = {
      primary: '#9F7AEA',
      secondary: '#6B46C1',
      button: '#9F7AEA',
      menu: isDark ? '#1E152A' : '#F3EAFE',
      icon: '#D6BCFA',
      highlight: '#F687B3',
      text: isDark ? '#F3EAFE' : '#1E152A',
      background: isDark ? '#0E0915' : '#FAF5FF',
      card: isDark ? '#150E1E' : '#FFFFFF',
      sidebar: isDark ? '#120C1A' : '#F3EAFE',
      topbar: isDark ? '#120C1A' : '#F3EAFE',
    };
  } else if (t === 'dark_academia') {
    colors = {
      primary: '#B85D43',
      secondary: '#7A3B2A',
      button: '#B85D43',
      menu: '#1E1512',
      icon: '#E28A75',
      highlight: '#F59E0B',
      text: '#F3EAE7',
      background: '#0F0A09',
      card: '#16100E',
      sidebar: '#120C0B',
      topbar: '#120C0B',
    };
  } else if (t === 'academic' || t === 'warm_academic') {
    colors = {
      primary: '#8C6239',
      secondary: '#5C3E21',
      button: '#8C6239',
      menu: isDark ? '#1E1611' : '#F5EFEA',
      icon: '#C6A07C',
      highlight: '#D97706',
      text: isDark ? '#F5EFEA' : '#1E1611',
      background: isDark ? '#0F0B08' : '#FAF8F5',
      card: isDark ? '#17110C' : '#FFFFFF',
      sidebar: isDark ? '#120E0A' : '#F5EFEA',
      topbar: isDark ? '#120E0A' : '#F5EFEA',
    };
  } else if (t === 'minimalist' || t === 'light') {
    colors = {
      primary: isDark ? '#FFFFFF' : '#111111',
      secondary: isDark ? '#888888' : '#E5E5E5',
      button: isDark ? '#2E2E32' : '#F3F4F6',
      menu: isDark ? '#111111' : '#FAFAFA',
      icon: isDark ? '#CCCCCC' : '#4B5563',
      highlight: '#3B82F6',
      text: isDark ? '#EEEEEE' : '#111111',
      background: isDark ? '#080808' : '#FFFFFF',
      card: isDark ? '#111111' : '#FAFAFA',
      sidebar: isDark ? '#0C0C0C' : '#F3F4F6',
      topbar: isDark ? '#0C0C0C' : '#F3F4F6',
    };
  } else if (t === 'custom' && profile.customThemeColors) {
    colors = { ...colors, ...profile.customThemeColors };
  }

  // Ensure that text is strictly pure white (#FFFFFF) in dark mode and pure black (#000000) in light mode
  colors.text = isDark ? '#FFFFFF' : '#000000';

  // Inject CSS Variables dynamically
  styleEl.innerHTML = `
    :root {
      --color-primary: ${colors.primary};
      --color-secondary: ${colors.secondary};
      --color-button: ${colors.button};
      --color-menu: ${colors.menu};
      --color-icon: ${colors.icon};
      --color-highlight: ${colors.highlight};
      --color-text: ${colors.text};
      --color-background: ${colors.background};
      --color-card: ${colors.card};
      --color-sidebar: ${colors.sidebar};
      --color-topbar: ${colors.topbar};
      --color-border: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
      --color-text-secondary: ${isDark ? '#919196' : '#636366'};
      --color-hover: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
      --color-active: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'};
      --color-selected: ${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'};
      --color-error: #EF4444;
      --color-warning: #F59E0B;
      --color-success: #10B981;
    }
  `;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSemesterChange, onThemeChange, initialTab }) => {
  const db = StorageService.getDatabase();
  const profile = db.profile;

  // Profile Form state
  const [name, setName] = useState(profile.name);
  const [course, setCourse] = useState(profile.course);
  const [university, setUniversity] = useState(profile.university || profile.institution);
  const [studentId, setStudentId] = useState(profile.studentId || '');
  const [avatar, setAvatar] = useState(profile.avatarUrl || profile.avatar);
  const [banner, setBanner] = useState(profile.bannerUrl || profile.banner);
  const [bio, setBio] = useState(profile.bio || profile.quote || '');
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [bannerEditorOpen, setBannerEditorOpen] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'semesters' | 'appearance' | 'backup' | 'pwa'>(initialTab || 'profile');

  // Semester modal state
  const [newSemName, setNewSemName] = useState('');
  const [newSemCode, setNewSemCode] = useState('');
  const [newSemStart, setNewSemStart] = useState('');
  const [newSemEnd, setNewSemEnd] = useState('');
  const [newSemModal, setNewSemModal] = useState(false);

  // Appearance / Custom Theme granular states
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>(profile.themeMode || 'dark');
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>(profile.theme as ThemeType || 'dark');

  const defaultCustomColors: CustomThemeColors = profile.customThemeColors || {
    primary: '#3B82F6',
    secondary: '#1E40AF',
    button: '#3B82F6',
    menu: '#1C1C1E',
    icon: '#60A5FA',
    highlight: '#60A5FA',
    text: '#E2E2E2',
    background: '#0A0A0B',
    card: '#121214',
    sidebar: '#121214',
    topbar: '#121214',
  };

  const [customColors, setCustomColors] = useState<CustomThemeColors>(defaultCustomColors);
  const [favoriteColors, setFavoriteColors] = useState<string[]>(profile.favoriteColors || ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']);

  // Handle color picker change
  const handleColorChange = (key: keyof CustomThemeColors, value: string) => {
    const updated = { ...customColors, [key]: value };
    setCustomColors(updated);

    // Live update for custom option
    if (selectedTheme === 'custom') {
      const updatedProfile = {
        ...profile,
        theme: 'custom' as ThemeType,
        customThemeColors: updated,
        themeMode,
      };
      applyGlobalTheme(updatedProfile);
    }
  };

  // Preset ready-to-use custom palettes
  const palettes = [
    { name: 'Geleira Azul', primary: '#3B82F6', secondary: '#1D4ED8', button: '#2563EB', menu: '#111827', icon: '#60A5FA', highlight: '#06B6D4', text: '#F3F4F6', background: '#030712', card: '#0B0F19', sidebar: '#0B0F19', topbar: '#0B0F19' },
    { name: 'Floresta Esmeralda', primary: '#10B981', secondary: '#047857', button: '#059669', menu: '#064E3B', icon: '#34D399', highlight: '#10B981', text: '#ECFDF5', background: '#022C22', card: '#064E3B', sidebar: '#022C22', topbar: '#022C22' },
    { name: 'Ametista Roxo', primary: '#8B5CF6', secondary: '#5B21B6', button: '#7C3AED', menu: '#1E1B4B', icon: '#A78BFA', highlight: '#EC4899', text: '#F5F3FF', background: '#0C0A0F', card: '#12101F', sidebar: '#12101F', topbar: '#12101F' },
    { name: 'Carmesim Real', primary: '#EF4444', secondary: '#991B1B', button: '#DC2626', menu: '#450A0A', icon: '#F87171', highlight: '#F59E0B', text: '#FEF2F2', background: '#110202', card: '#1C0606', sidebar: '#110202', topbar: '#110202' },
  ];

  const applyPalette = (palette: any) => {
    const colors: CustomThemeColors = {
      primary: palette.primary,
      secondary: palette.secondary,
      button: palette.button,
      menu: palette.menu,
      icon: palette.icon,
      highlight: palette.highlight,
      text: palette.text,
      background: palette.background,
      card: palette.card,
      sidebar: palette.sidebar,
      topbar: palette.topbar,
    };
    setCustomColors(colors);
    setSelectedTheme('custom');

    const updatedProfile = {
      ...profile,
      theme: 'custom' as ThemeType,
      customThemeColors: colors,
      themeMode,
    };
    applyGlobalTheme(updatedProfile);
    confetti({ particleCount: 15, spread: 30 });
  };

  // Add favorite color circle helper
  const handleAddFavoriteColor = (color: string) => {
    if (!favoriteColors.includes(color) && favoriteColors.length < 12) {
      const updated = [...favoriteColors, color];
      setFavoriteColors(updated);
      StorageService.update((draft) => {
        draft.profile.favoriteColors = updated;
      });
    }
  };

  const handleSaveProfile = () => {
    StorageService.update((draft) => {
      draft.profile = {
        ...draft.profile,
        name: name.trim(),
        course: course.trim(),
        university: university.trim(),
        institution: university.trim(),
        studentId: studentId.trim(),
        avatarUrl: avatar,
        avatar,
        bannerUrl: banner,
        banner,
        bio: bio.trim(),
        quote: bio.trim(),
      };
    });
    confetti({ particleCount: 40, spread: 50 });
    alert('Perfil acadêmico atualizado com sucesso!');
  };

  const handleCreateSemester = () => {
    if (!newSemName.trim()) return;

    const newSem: Semester = {
      id: `sem-${Date.now()}`,
      name: newSemName.trim(),
      code: newSemCode.trim() || newSemName.trim(),
      year: new Date().getFullYear(),
      period: 1,
      periodNumber: 1,
      startDate: newSemStart || '2026-02-01',
      endDate: newSemEnd || '2026-06-30',
      isActive: false,
      isArchived: false,
      color: '#4A6B53',
      createdAt: new Date().toISOString(),
    };

    StorageService.update((draft) => {
      draft.semesters.push(newSem);
    });

    setNewSemName('');
    setNewSemCode('');
    setNewSemModal(false);
    if (onSemesterChange) onSemesterChange();
  };

  const handleSwitchActiveSemester = (semId: string) => {
    StorageService.update((draft) => {
      draft.semesters.forEach((s) => {
        s.isActive = s.id === semId;
      });
      draft.profile.activeSemesterId = semId;
    });
    if (onSemesterChange) onSemesterChange();
  };

  const handleArchiveSemester = (semId: string) => {
    StorageService.update((draft) => {
      const sem = draft.semesters.find((s) => s.id === semId);
      if (sem) sem.isArchived = !sem.isArchived;
    });
    if (onSemesterChange) onSemesterChange();
  };

  const handleExportSemesterPdf = (semester: Semester) => {
    try {
      const currentDb = StorageService.getDatabase();
      exportSemesterToPdf(semester, currentDb);
      confetti({ particleCount: 50, spread: 60 });
    } catch (e) {
      console.error(e);
      alert('Erro ao compilar e exportar notas do semestre em PDF.');
    }
  };

  const handleExportBackup = () => {
    const jsonStr = StorageService.exportToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_caderno_academico_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    confetti({ particleCount: 60, spread: 70 });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importFromJson(content);
      if (success) {
        alert('Backup restaurado com sucesso! Recarregando os dados...');
        window.location.reload();
      } else {
        alert('Erro: Arquivo JSON de backup inválido.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('Tem certeza que deseja resetar para os dados iniciais do curso? Esta ação não pode ser desfeita.')) {
      StorageService.resetToSeed();
      window.location.reload();
    }
  };

  const handleSaveThemeSettings = () => {
    StorageService.update((draft) => {
      draft.profile.theme = selectedTheme;
      draft.profile.themeMode = themeMode;
      draft.profile.customThemeColors = customColors;
      draft.profile.isDarkMode = themeMode === 'dark' || (themeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    // Apply globally
    applyGlobalTheme({
      ...profile,
      theme: selectedTheme,
      themeMode,
      customThemeColors: customColors,
    });

    if (onThemeChange) onThemeChange();
    confetti({ particleCount: 50, spread: 60 });
    alert('Nova configuração visual aplicada e salva com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Configurações & Gestão de Semestres
        </h1>
        <p className="text-xs sm:text-sm text-[#919196] mt-1">
          Personalize seu perfil acadêmico, gerencie o histórico de anos de faculdade e customize o design completo do caderno
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-[#121214] p-1.5 rounded-2xl border border-[#242427] shadow-xs gap-1">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-[#1C1C1F] text-white shadow-xs border border-[#2E2E32]'
              : 'text-[#919196] hover:text-white'
          }`}
        >
          <User className="w-4 h-4 text-blue-400" />
          Perfil Acadêmico
        </button>

        <button
          onClick={() => setActiveTab('semesters')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
            activeTab === 'semesters'
              ? 'bg-[#1C1C1F] text-white shadow-xs border border-[#2E2E32]'
              : 'text-[#919196] hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-400" />
          Semestres & Histórico ({db.semesters.length})
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
            activeTab === 'appearance'
              ? 'bg-[#1C1C1F] text-white shadow-xs border border-[#2E2E32]'
              : 'text-[#919196] hover:text-white'
          }`}
        >
          <Palette className="w-4 h-4 text-amber-400" />
          Personalizar Aplicativo
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-[#1C1C1F] text-white shadow-xs border border-[#2E2E32]'
              : 'text-[#919196] hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4 text-emerald-400" />
          Backup & Dados
        </button>

        <button
          onClick={() => setActiveTab('pwa')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
            activeTab === 'pwa'
              ? 'bg-[#1C1C1F] text-white shadow-xs border border-[#2E2E32]'
              : 'text-[#919196] hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          📱 Aplicativo PWA
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="bg-[#121214] p-6 sm:p-8 rounded-2xl border border-[#242427] shadow-xs space-y-6">
          {/* Cover Banner */}
          <div className="relative h-32 w-full rounded-xl overflow-hidden border border-[#242427] bg-[#1C1C1F]">
            <img
              src={banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'}
              alt="Banner de Capa"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => setBannerEditorOpen(true)}
              className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 backdrop-blur-xs text-white px-2.5 py-1.5 rounded-lg border border-[#242427] text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
              Editar Banner
            </button>
          </div>

          <div className="flex items-center gap-4 -mt-12 relative px-4 z-10">
            <div className="relative group shrink-0">
              <img
                src={avatar}
                alt={name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-[#121214] shadow-md bg-[#1C1C1F]"
              />
              <button
                type="button"
                onClick={() => setProfileEditorOpen(true)}
                className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-lg border border-[#121214] transition cursor-pointer shadow-md"
                title="Editar foto"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="pt-6">
              <h3 className="text-lg font-semibold text-white leading-none">{name}</h3>
              <p className="text-xs text-[#919196] mt-1.5">{course} • {university}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                Nome do Estudante *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                Curso de Graduação *
              </label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                Universidade / Faculdade *
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                Matrícula / RA
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                URL da Foto de Perfil (Avatar)
              </label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                URL do Banner de Capa
              </label>
              <input
                type="text"
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
              Frase Motivacional / Bio de Estudos
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveProfile}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>

          {/* Profile Avatar Image Editor Modal */}
          <ImageEditorModal
            isOpen={profileEditorOpen}
            onClose={() => setProfileEditorOpen(false)}
            initialImageUrl={avatar}
            onSave={(processedUrl) => {
              setAvatar(processedUrl);
            }}
            aspectRatio="circle"
            title="Editar Foto de Perfil"
          />

          {/* Cover Banner Image Editor Modal */}
          <ImageEditorModal
            isOpen={bannerEditorOpen}
            onClose={() => setBannerEditorOpen(false)}
            initialImageUrl={banner}
            onSave={(processedUrl) => {
              setBanner(processedUrl);
            }}
            aspectRatio="wide"
            title="Editar Banner de Capa"
          />
        </div>
      )}

      {/* Tab 2: Semesters */}
      {activeTab === 'semesters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#919196]">
              O aplicativo foi projetado para durar todos os anos da sua graduação. Cadastre novos semestres e arquive os já concluídos.
            </p>
            <button
              onClick={() => setNewSemModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adicionar Semestre
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {db.semesters.map((sem) => {
              const semDiscs = db.disciplines.filter((d) => d.semesterId === sem.id);
              const semLessons = db.lessons.filter((l) => l.semesterId === sem.id);
              const isActive = sem.id === profile.activeSemesterId;

              return (
                <div
                  key={sem.id}
                  className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 ${
                    isActive
                      ? 'bg-[#141820] border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                      : 'bg-[#121214] border-[#242427]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#919196]">
                        {sem.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleExportSemesterPdf(sem)}
                          className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                          title="Exportar todo o semestre acadêmico compilado em PDF"
                        >
                          <Download className="w-3 h-3" />
                          Exportar PDF
                        </button>
                        {isActive && (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                            Ativo Atual
                          </span>
                        )}
                        {sem.isArchived && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#242427] text-[#919196] text-[10px] font-bold">
                            Arquivado
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-white mt-1">
                      {sem.name}
                    </h3>
                    <p className="text-xs text-[#919196] mt-1">
                      {semDiscs.length} matérias cadastradas • {semLessons.length} aulas registradas
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#242427] flex items-center justify-between">
                    {!isActive ? (
                      <button
                        onClick={() => handleSwitchActiveSemester(sem.id)}
                        className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer"
                      >
                        Tornar Semestre Ativo
                      </button>
                    ) : (
                      <span className="text-xs text-[#919196]">Semestre em andamento</span>
                    )}

                    <button
                      onClick={() => handleArchiveSemester(sem.id)}
                      className="p-1.5 text-[#919196] hover:text-white rounded-lg cursor-pointer"
                      title={sem.isArchived ? 'Desarquivar' : 'Arquivar'}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Appearance Custom Theme */}
      {activeTab === 'appearance' && (
        <div className="bg-[#121214] p-6 sm:p-8 rounded-2xl border border-[#242427] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#242427] pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <Palette className="w-5 h-5 text-amber-400" />
                🎨 Personalizar Aplicativo
              </h3>
              <p className="text-xs text-[#919196] mt-0.5">
                Altere por completo o design do seu Caderno Acadêmico: menus, botões, ícones e destaques
              </p>
            </div>
            <button
              onClick={handleSaveThemeSettings}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Aplicar Visual
            </button>
          </div>

          {/* Sub-section 1: Theme Mode Selectors */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#919196]">
              Modo do Tema
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setThemeMode('light')}
                className={`p-3.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer transition ${
                  themeMode === 'light'
                    ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                    : 'bg-[#1C1C1F] border-[#242427] text-[#919196] hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4" />
                Modo Claro
              </button>
              <button
                onClick={() => setThemeMode('dark')}
                className={`p-3.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer transition ${
                  themeMode === 'dark'
                    ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                    : 'bg-[#1C1C1F] border-[#242427] text-[#919196] hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4" />
                Modo Escuro
              </button>
              <button
                onClick={() => setThemeMode('auto')}
                className={`p-3.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer transition ${
                  themeMode === 'auto'
                    ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                    : 'bg-[#1C1C1F] border-[#242427] text-[#919196] hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Automático (Sinc)
              </button>
            </div>
          </div>

          {/* Sub-section 2: Built-in Premium Themes */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#919196]">
              Temas Integrados Premium
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { id: 'dark', name: 'Sophisticated Dark', preview: 'bg-zinc-900 border-zinc-700' },
                { id: 'minimalist', name: 'Minimalista', preview: 'bg-zinc-100 border-zinc-300 text-black' },
                { id: 'academic', name: 'Warm Academic', preview: 'bg-[#FAF8F5] border-[#D6C4B0] text-amber-900' },
                { id: 'nature', name: 'Natureza (Sage)', preview: 'bg-[#E8EFEA] border-[#A5D6A7] text-green-900' },
                { id: 'pastel', name: 'Pastel Lavender', preview: 'bg-[#F3EAFE] border-[#D6BCFA] text-purple-900' },
                { id: 'dark_academia', name: 'Dark Academia', preview: 'bg-[#16100E] border-[#7A3B2A] text-amber-50' },
                { id: 'custom', name: '🎨 Personalizado', preview: 'bg-gradient-to-tr from-blue-500 via-emerald-500 to-amber-500 text-white' },
              ].map((thm) => (
                <button
                  key={thm.id}
                  onClick={() => setSelectedTheme(thm.id as ThemeType)}
                  className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 cursor-pointer transition ${
                    selectedTheme === thm.id
                      ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black'
                      : 'bg-[#121214] border-[#242427] hover:border-zinc-500/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${thm.preview} flex items-center justify-center text-[9px] font-black shadow-xs shrink-0`}>
                    Ab
                  </div>
                  <span className="text-[11px] text-[#E2E2E2] text-center">{thm.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sub-section 3: Granular Color Picker Panel */}
          {selectedTheme === 'custom' && (
            <div className="p-5 rounded-2xl border border-[#242427] bg-[#1C1C1F]/40 space-y-5 animate-in slide-in-from-top duration-300">
              <div className="flex items-center justify-between border-b border-[#242427] pb-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  Paleta Customizada Avançada
                </h4>
                <span className="text-[10px] text-[#919196]">Escolha cores em tempo real</span>
              </div>

              {/* Ready custom presets */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-[#919196] uppercase tracking-wider">Paletas de Cores Prontas</span>
                <div className="flex flex-wrap gap-2">
                  {palettes.map((pal, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyPalette(pal)}
                      className="px-3 py-1.5 bg-[#1C1C1F] hover:bg-[#242427] border border-[#2E2E32] text-xs font-semibold text-white rounded-lg transition cursor-pointer flex items-center gap-2"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.primary }} />
                      {pal.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color list grid picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'primary', label: 'Cor Principal' },
                  { key: 'secondary', label: 'Cor Secundária' },
                  { key: 'button', label: 'Cor dos Botões' },
                  { key: 'menu', label: 'Cor dos Menus' },
                  { key: 'icon', label: 'Cor dos Ícones' },
                  { key: 'highlight', label: 'Cor dos Destaques' },
                  { key: 'text', label: 'Cor dos Textos' },
                  { key: 'background', label: 'Cor de Fundo da Tela' },
                  { key: 'card', label: 'Cor de Fundo dos Cards' },
                  { key: 'sidebar', label: 'Cor da Barra Lateral' },
                  { key: 'topbar', label: 'Cor da Barra Superior' },
                ].map((item) => (
                  <div key={item.key} className="space-y-1.5 p-3 rounded-xl bg-[#121214] border border-[#242427]">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#919196]">{item.label}</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={customColors[item.key as keyof CustomThemeColors]}
                        onChange={(e) => handleColorChange(item.key as keyof CustomThemeColors, e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={customColors[item.key as keyof CustomThemeColors]}
                        onChange={(e) => handleColorChange(item.key as keyof CustomThemeColors, e.target.value)}
                        className="w-full text-center py-1.5 bg-[#1C1C1F] border border-[#242427] rounded text-xs text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Favorites color panel */}
              <div className="space-y-2 border-t border-[#242427] pt-4">
                <span className="block text-[10px] font-bold text-[#919196] uppercase tracking-wider">Cores Favoritas de Rápido Acesso</span>
                <div className="flex flex-wrap items-center gap-2">
                  {favoriteColors.map((col, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleColorChange('primary', col)}
                      className="w-6 h-6 rounded-full border border-white/20 shadow-xs cursor-pointer hover:scale-110 transition relative group"
                      style={{ backgroundColor: col }}
                      title="Definir como cor principal"
                    >
                      <span className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 px-1.5 py-0.5 bg-black text-[8px] text-white rounded whitespace-nowrap mb-1">
                        {col}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      const col = prompt('Digite o código HEX da sua cor preferida:', '#3B82F6');
                      if (col && col.startsWith('#')) handleAddFavoriteColor(col);
                    }}
                    className="w-6 h-6 rounded-full bg-[#1C1C1F] border border-dashed border-[#2E2E32] hover:border-white/40 flex items-center justify-center text-xs text-white cursor-pointer"
                    title="Adicionar cor personalizada"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick theme summary bar */}
          <div className="p-4 rounded-xl bg-[#1C1C1F] border border-[#242427] flex items-center justify-between">
            <span className="text-xs text-[#919196]">
              Aperte o botão para confirmar e salvar as modificações estéticas.
            </span>
            <button
              onClick={handleSaveThemeSettings}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Confirmar Visual
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Backup & Data */}
      {activeTab === 'backup' && (
        <div className="bg-[#121214] p-6 sm:p-8 rounded-2xl border border-[#242427] shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-semibold text-white">
              Exportação e Backup do Caderno
            </h3>
            <p className="text-xs text-[#919196] mt-0.5">
              Seus dados pertencem a você. Exporte um arquivo JSON completo contendo todos os semestres, cadernos, desenhos, flashcards e notas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-[#242427] bg-[#1C1C1F] space-y-3">
              <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                Exportar Backup Completo (.JSON)
              </h4>
              <p className="text-[11px] text-[#919196]">
                Baixe um arquivo seguro com todas as suas anotações para guardar no Google Drive ou computador.
              </p>
              <button
                onClick={handleExportBackup}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer"
              >
                Fazer Download do Backup
              </button>
            </div>

            <div className="p-5 rounded-2xl border border-[#242427] bg-[#1C1C1F] space-y-3">
              <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-400" />
                Restaurar Backup de Arquivo
              </h4>
              <p className="text-[11px] text-[#919196]">
                Restaure todas as anotações a partir de um arquivo .json salvo anteriormente.
              </p>
              <label className="block w-full text-center py-2 bg-[#242427] hover:bg-[#2A2A2D] text-white border border-[#2E2E32] text-xs font-semibold rounded-xl cursor-pointer transition">
                <span>Selecionar Arquivo JSON</span>
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>
          </div>

          {/* Reset button */}
          <div className="pt-4 border-t border-red-500/20 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-red-400">Restaurar Dados Iniciais de Demonstração</p>
              <p className="text-[11px] text-[#919196]">Reseta o banco de dados para os dados padrão de Medicina Veterinária.</p>
            </div>
            <button
              onClick={handleResetData}
              className="px-4 py-2 border border-red-500/30 text-red-400 text-xs font-semibold rounded-xl hover:bg-red-500/10 transition cursor-pointer"
            >
              Resetar Tudo
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: PWA & Sync */}
      {activeTab === 'pwa' && (
        <PwaSyncPanel />
      )}

      {/* New Semester Modal */}
      {newSemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-white">
              Novo Semestre Letivo
            </h3>
            <div>
              <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                Nome do Semestre *
              </label>
              <input
                type="text"
                value={newSemName}
                onChange={(e) => setNewSemName(e.target.value)}
                placeholder="Ex: 5º Semestre — 2026.2"
                className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white placeholder-[#636366] focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                Código Curto
              </label>
              <input
                type="text"
                value={newSemCode}
                onChange={(e) => setNewSemCode(e.target.value)}
                placeholder="Ex: 2026.2"
                className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white placeholder-[#636366] focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setNewSemModal(false)}
                className="px-4 py-2 text-xs font-medium text-[#919196] hover:text-white rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSemester}
                disabled={!newSemName.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
              >
                Cadastrar Semestre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
