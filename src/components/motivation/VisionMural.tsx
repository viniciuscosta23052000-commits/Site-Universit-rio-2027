import React, { useState, useRef } from 'react';
import { StorageService, INITIAL_DATABASE } from '../../lib/storage';
import { VisionCard, VisionMuralConfig } from '../../types';
import {
  Sparkles,
  Edit2,
  Check,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Layout,
  Sliders,
  Type,
  Image as ImageIcon,
  Heart,
  Calendar,
  Layers,
  Eye,
  Settings,
  X,
  Target,
  ChevronLeft,
  ChevronRight,
  Upload,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VisionMuralProps {
  onMuralUpdated?: () => void;
}

const IMAGE_PRESETS = [
  { name: 'Mesa Minimalista', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop' },
  { name: 'Clínica Veterinária', url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop' },
  { name: 'Laboratório & Microscópio', url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop' },
  { name: 'Biblioteca Acadêmica', url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop' },
  { name: 'Foco no Caderno', url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop' },
  { name: 'Formatura', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop' },
];

export const VisionMural: React.FC<VisionMuralProps> = ({ onMuralUpdated }) => {
  const db = StorageService.getDatabase();
  const mural = db.visionMural || (INITIAL_DATABASE.visionMural as VisionMuralConfig);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states for active card editing
  const [cardTitle, setCardTitle] = useState('');
  const [cardSubtitle, setCardSubtitle] = useState('');
  const [cardCategory, setCardCategory] = useState('');
  const [cardImageUrl, setCardImageUrl] = useState('');
  const [cardFontSize, setCardFontSize] = useState<number>(14);
  const [cardFontStyle, setCardFontStyle] = useState<string>('font-sans');
  const [cardAlignment, setCardAlignment] = useState<'left' | 'center' | 'right'>('left');
  const [cardDescription, setCardDescription] = useState('');
  const [cardRelatedGoal, setCardRelatedGoal] = useState('');
  const [cardDueDate, setCardDueDate] = useState('');
  const [cardStatus, setCardStatus] = useState<'pending' | 'completed'>('pending');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reorder helper
  const handleMoveCard = (index: number, direction: 'prev' | 'next') => {
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mural.cards.length) return;

    StorageService.update((draft) => {
      if (!draft.visionMural) draft.visionMural = JSON.parse(JSON.stringify(mural));
      const cards = draft.visionMural.cards;
      const temp = cards[index];
      cards[index] = cards[targetIndex];
      cards[targetIndex] = temp;

      // Reset orders
      cards.forEach((c, idx) => {
        c.order = idx;
      });
    });

    if (onMuralUpdated) onMuralUpdated();
  };

  // Restore Default Mural
  const handleRestoreDefault = () => {
    if (window.confirm('Deseja restaurar o mural para a configuração original? Isso excluirá suas personalizações.')) {
      StorageService.update((draft) => {
        draft.visionMural = JSON.parse(JSON.stringify(INITIAL_DATABASE.visionMural));
      });
      setIsEditing(false);
      if (onMuralUpdated) onMuralUpdated();
      confetti({ particleCount: 20, spread: 40 });
    }
  };

  // Delete Card
  const handleDeleteCard = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza de que deseja excluir este card de visão/meta?')) {
      StorageService.update((draft) => {
        if (!draft.visionMural) draft.visionMural = JSON.parse(JSON.stringify(mural));
        draft.visionMural.cards = draft.visionMural.cards.filter((c) => c.id !== cardId);
        draft.visionMural.cards.forEach((c, idx) => {
          c.order = idx;
        });
      });
      if (onMuralUpdated) onMuralUpdated();
    }
  };

  // Trigger modal for editing specific card
  const handleOpenEditCard = (card: VisionCard) => {
    setSelectedCardId(card.id);
    setIsAddingNew(false);
    setCardTitle(card.title);
    setCardSubtitle(card.subtitle);
    setCardCategory(card.category);
    setCardImageUrl(card.imageUrl);
    setCardFontSize(card.fontSize || 14);
    setCardFontStyle(card.fontStyle || 'font-sans');
    setCardAlignment(card.alignment || 'left');
    setCardDescription(card.description || '');
    setCardRelatedGoal(card.relatedGoal || '');
    setCardDueDate(card.dueDate || '');
    setCardStatus(card.status || 'pending');
    setCardModalOpen(true);
  };

  // Trigger modal for adding a new card
  const handleOpenAddCard = () => {
    setSelectedCardId(null);
    setIsAddingNew(true);
    setCardTitle('');
    setCardSubtitle('');
    setCardCategory('Metas');
    setCardImageUrl('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop');
    setCardFontSize(14);
    setCardFontStyle('font-sans');
    setCardAlignment('left');
    setCardDescription('');
    setCardRelatedGoal('');
    setCardDueDate('');
    setCardStatus('pending');
    setCardModalOpen(true);
  };

  // Save Card
  const handleSaveCard = () => {
    if (!cardTitle.trim()) {
      alert('O título do card é obrigatório.');
      return;
    }

    StorageService.update((draft) => {
      if (!draft.visionMural) draft.visionMural = JSON.parse(JSON.stringify(mural));
      const cards = draft.visionMural.cards || [];

      if (isAddingNew) {
        const newCard: VisionCard = {
          id: `vision-card-${Date.now()}`,
          title: cardTitle.trim(),
          subtitle: cardSubtitle.trim(),
          category: cardCategory.trim() || 'Visão',
          imageUrl: cardImageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop',
          fontSize: cardFontSize,
          fontStyle: cardFontStyle,
          alignment: cardAlignment,
          description: cardDescription.trim(),
          relatedGoal: cardRelatedGoal.trim(),
          dueDate: cardDueDate,
          status: cardStatus,
          order: cards.length,
        };
        cards.push(newCard);
      } else {
        const cardIndex = cards.findIndex((c) => c.id === selectedCardId);
        if (cardIndex !== -1) {
          cards[cardIndex] = {
            ...cards[cardIndex],
            title: cardTitle.trim(),
            subtitle: cardSubtitle.trim(),
            category: cardCategory.trim() || 'Visão',
            imageUrl: cardImageUrl,
            fontSize: cardFontSize,
            fontStyle: cardFontStyle,
            alignment: cardAlignment,
            description: cardDescription.trim(),
            relatedGoal: cardRelatedGoal.trim(),
            dueDate: cardDueDate,
            status: cardStatus,
          };
        }
      }
    });

    setCardModalOpen(false);
    if (onMuralUpdated) onMuralUpdated();
    confetti({ particleCount: 15, spread: 30 });
  };

  // File Upload base64 helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3.5 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha um arquivo menor que 3.5MB para evitar limites de armazenamento.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCardImageUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // General settings updates
  const updateGeneralSettings = (updater: (draft: VisionMuralConfig) => void) => {
    StorageService.update((draft) => {
      if (!draft.visionMural) draft.visionMural = JSON.parse(JSON.stringify(mural));
      updater(draft.visionMural);
    });
    if (onMuralUpdated) onMuralUpdated();
  };

  // Rounded classes mapping
  const getRadiusClass = (r?: string) => {
    switch (r) {
      case 'none': return 'rounded-none';
      case 'sm': return 'rounded-sm';
      case 'md': return 'rounded-md';
      case 'lg': return 'rounded-lg';
      case 'xl': return 'rounded-xl';
      case '2xl': return 'rounded-2xl';
      case '3xl': return 'rounded-3xl';
      default: return 'rounded-2xl';
    }
  };

  // Card Size class
  const getCardSizeStyle = (size?: string) => {
    switch (size) {
      case 'small': return 'aspect-[4/3]';
      case 'large': return 'aspect-[16/10]';
      default: return 'aspect-video';
    }
  };

  // Spacing Class
  const getSpacingClass = (spacing?: string) => {
    switch (spacing) {
      case 'tight': return 'gap-3';
      case 'loose': return 'gap-6';
      default: return 'gap-4';
    }
  };

  // Card Style classes
  const getCardStyleClass = (style?: string) => {
    switch (style) {
      case 'bordered':
        return 'border-2 border-[#EAE3D5] dark:border-[#2E2E32] bg-[#FAF8F5] dark:bg-[#121214]';
      case 'glass':
        return 'border border-white/20 bg-white/10 dark:bg-[#121214]/40 backdrop-blur-md shadow-xl';
      case 'polaroid':
        return 'border border-gray-200 bg-white shadow-lg p-3 text-zinc-800';
      default: // minimalist
        return 'border border-[#EAE3D5]/40 dark:border-[#242427] bg-[#FAF8F5]/30 dark:bg-[#121214]';
    }
  };

  // Render font style
  const getFontStyleClass = (fontStyle?: string) => {
    switch (fontStyle) {
      case 'font-serif': return 'font-serif font-bold';
      case 'font-mono': return 'font-mono font-bold';
      default: return 'font-sans font-bold';
    }
  };

  const currentCards = mural.cards || [];

  return (
    <div className="space-y-6" id="vision-mural-container">
      {/* Mural Header Card */}
      <div className="bg-white dark:bg-[#121214] rounded-3xl border border-[#EAE3D5] dark:border-[#242427] p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FAF8F5] dark:bg-[#1C1C1F] border border-[#EAE3D5]/40 dark:border-[#242427] rounded-2xl text-[#8C6239] dark:text-[#C6A07C]">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
            <div>
              <h2 className="font-serif font-extrabold text-lg sm:text-xl text-zinc-800 dark:text-white leading-tight">
                {mural.title}
              </h2>
              {mural.subtitle && (
                <p className="text-xs text-zinc-400 dark:text-[#919196] mt-0.5 font-medium">
                  {mural.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleRestoreDefault}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF8F5] hover:bg-[#FAF8F5]/80 dark:bg-[#1C1C1F] text-zinc-600 dark:text-zinc-300 hover:text-red-500 dark:hover:text-red-400 border border-[#EAE3D5] dark:border-[#242427] text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
                  title="Restaurar padrão original"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restaurar Original
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    confetti({ particleCount: 30, spread: 60 });
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  Concluir
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#FAF8F5] hover:bg-[#FAF8F5]/80 dark:bg-[#1C1C1F] dark:hover:bg-[#242427] text-zinc-700 dark:text-zinc-200 border border-[#EAE3D5] dark:border-[#242427] text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#8C6239]" />
                Editar Mural
              </button>
            )}
          </div>
        </div>

        {/* --- EDIT MODE CONTROLS BAR --- */}
        {isEditing && (
          <div className="bg-[#FAF8F5] dark:bg-[#1C1C1F] border border-[#EAE3D5] dark:border-[#242427] p-5 rounded-2xl space-y-4 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2 border-b border-[#EAE3D5] dark:border-[#242427] pb-2.5">
              <Settings className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-zinc-800 dark:text-white uppercase tracking-wider">
                Configurações do Painel Visual
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Change Titles */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Título do Mural</label>
                <input
                  type="text"
                  value={mural.title}
                  onChange={(e) => updateGeneralSettings((m) => { m.title = e.target.value; })}
                  placeholder="Título do Mural"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#121214] text-zinc-800 dark:text-white border border-[#EAE3D5] dark:border-[#242427] focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Subtítulo / Descrição</label>
                <input
                  type="text"
                  value={mural.subtitle || ''}
                  onChange={(e) => updateGeneralSettings((m) => { m.subtitle = e.target.value; })}
                  placeholder="Subtítulo ou descrição curta"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#121214] text-zinc-800 dark:text-white border border-[#EAE3D5] dark:border-[#242427] focus:outline-none focus:border-zinc-400"
                />
              </div>

              {/* Card Style Customization */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Estilo dos Cards</label>
                <select
                  value={mural.visualSettings?.cardStyle || 'minimalist'}
                  onChange={(e) => updateGeneralSettings((m) => {
                    if (!m.visualSettings) m.visualSettings = {};
                    m.visualSettings.cardStyle = e.target.value as any;
                  })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#121214] text-zinc-800 dark:text-white border border-[#EAE3D5] dark:border-[#242427] focus:outline-none"
                >
                  <option value="minimalist">Minimalista (Original)</option>
                  <option value="bordered">Borda Reforçada</option>
                  <option value="glass">Efeito Vidro Translúcido</option>
                  <option value="polaroid">Polaroid Clássica</option>
                </select>
              </div>

              {/* Card Border Radius */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Arredondamento das Bordas</label>
                <select
                  value={mural.visualSettings?.borderRadius || '2xl'}
                  onChange={(e) => updateGeneralSettings((m) => {
                    if (!m.visualSettings) m.visualSettings = {};
                    m.visualSettings.borderRadius = e.target.value as any;
                  })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#121214] text-zinc-800 dark:text-white border border-[#EAE3D5] dark:border-[#242427] focus:outline-none"
                >
                  <option value="none">Reto (Sem arredondar)</option>
                  <option value="sm">Pequeno (sm)</option>
                  <option value="md">Médio (md)</option>
                  <option value="lg">Grande (lg)</option>
                  <option value="xl">Extra Grande (xl)</option>
                  <option value="2xl">Arredondamento Suave (2xl)</option>
                  <option value="3xl">Totalmente Arredondado (3xl)</option>
                </select>
              </div>

              {/* Card Size / Spacing */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Formato dos Cards</label>
                <select
                  value={mural.visualSettings?.cardSize || 'medium'}
                  onChange={(e) => updateGeneralSettings((m) => {
                    if (!m.visualSettings) m.visualSettings = {};
                    m.visualSettings.cardSize = e.target.value as any;
                  })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#121214] text-zinc-800 dark:text-white border border-[#EAE3D5] dark:border-[#242427] focus:outline-none"
                >
                  <option value="small">Mais Compacto (4:3)</option>
                  <option value="medium">Proporção Padrão (Video)</option>
                  <option value="large">Panorâmico (16:10)</option>
                </select>
              </div>

              {/* Grid Spacing */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Espaçamento do Painel</label>
                <select
                  value={mural.visualSettings?.spacing || 'normal'}
                  onChange={(e) => updateGeneralSettings((m) => {
                    if (!m.visualSettings) m.visualSettings = {};
                    m.visualSettings.spacing = e.target.value as any;
                  })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#121214] text-zinc-800 dark:text-white border border-[#EAE3D5] dark:border-[#242427] focus:outline-none"
                >
                  <option value="tight">Apertado (Tight)</option>
                  <option value="normal">Normal (Padrão)</option>
                  <option value="loose">Amplo (Loose)</option>
                </select>
              </div>

              {/* Dark Overlay darkness slider */}
              {mural.visualSettings?.cardStyle !== 'polaroid' && (
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Escurecimento da Imagem sobreposta (Legibilidade): {mural.visualSettings?.overlayOpacity || 60}%
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="20"
                      max="90"
                      value={mural.visualSettings?.overlayOpacity || 60}
                      onChange={(e) => updateGeneralSettings((m) => {
                        if (!m.visualSettings) m.visualSettings = {};
                        m.visualSettings.overlayOpacity = parseInt(e.target.value);
                      })}
                      className="flex-1 accent-[#4A6B53] dark:accent-[#C6A07C]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- DYNAMIC MOSAIC / GRID OF VISION CARDS --- */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${getSpacingClass(mural.visualSettings?.spacing)}`}>
          {currentCards.map((card, index) => {
            const isPolaroid = mural.visualSettings?.cardStyle === 'polaroid';
            return (
              <div
                key={card.id}
                className={`group relative overflow-hidden transition-all duration-300 flex flex-col justify-between ${getRadiusClass(
                  mural.visualSettings?.borderRadius
                )} ${getCardStyleClass(mural.visualSettings?.cardStyle)} ${getCardSizeStyle(mural.visualSettings?.cardSize)}`}
              >
                {/* Background Image (when not polaroid, covers card. When polaroid, bounded container) */}
                <div className={isPolaroid ? "relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100" : "absolute inset-0 w-full h-full"}>
                  <img
                    src={card.imageUrl}
                    alt={card.title}
                    className="w-full h-full object-cover transition duration-700 group-hover:scale-103"
                  />

                  {/* Gradient dark overlay for text legibility inside the non-polaroid cards */}
                  {!isPolaroid && (
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20"
                      style={{ opacity: (mural.visualSettings?.overlayOpacity || 60) / 100 }}
                    />
                  )}

                  {/* Reordering and Edit overlays inside card (visible in Edit mode) */}
                  {isEditing && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 z-30 bg-black/70 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
                      <button
                        onClick={() => handleOpenEditCard(card)}
                        className="p-1 hover:bg-white/15 rounded-lg text-blue-400 transition"
                        title="Editar Card"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveCard(index, 'prev')}
                        disabled={index === 0}
                        className="p-1 hover:bg-white/15 disabled:opacity-20 rounded-lg text-white transition"
                        title="Mover para esquerda/cima"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveCard(index, 'next')}
                        disabled={index === currentCards.length - 1}
                        className="p-1 hover:bg-white/15 disabled:opacity-20 rounded-lg text-white transition"
                        title="Mover para direita/baixo"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteCard(card.id, e)}
                        className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-[#919196] transition"
                        title="Excluir Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Category eye-brow badge (when in display or not polaroid) */}
                  {card.category && !isPolaroid && (
                    <span className="absolute top-3 left-4 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-widest bg-white/10 border border-white/10 backdrop-blur-md text-white z-20">
                      {card.category}
                    </span>
                  )}
                </div>

                {/* Card Info text */}
                {isPolaroid ? (
                  /* Polaroid Text Layout */
                  <div className="pt-3 pb-1 flex-1 flex flex-col justify-between font-sans">
                    <div>
                      {card.category && (
                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-0.5">
                          {card.category}
                        </span>
                      )}
                      <h3 className={`text-xs text-zinc-800 dark:text-zinc-100 leading-snug line-clamp-2 ${getFontStyleClass(card.fontStyle)}`} style={{ fontSize: `${card.fontSize}px`, textAlign: card.alignment }}>
                        {card.title}
                      </h3>
                      {card.subtitle && (
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                          {card.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Goal detail indicators on hover/click */}
                    {card.relatedGoal && (
                      <div className="mt-2.5 border-t border-gray-100 pt-2 flex items-center justify-between text-[9px] text-zinc-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-emerald-500" />
                          Meta: {card.relatedGoal.slice(0, 18)}...
                        </span>
                        {card.dueDate && (
                          <span className="flex items-center gap-0.5 bg-gray-50 px-1.5 py-0.5 rounded">
                            <Calendar className="w-2.5 h-2.5" />
                            {card.dueDate}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Floating Overlap Text Layout */
                  <div className="p-4 relative z-10 mt-auto text-white">
                    <div style={{ textAlign: card.alignment }}>
                      <h3 className={`text-sm tracking-tight text-white drop-shadow-md leading-snug line-clamp-2 ${getFontStyleClass(card.fontStyle)}`} style={{ fontSize: `${card.fontSize}px` }}>
                        {card.title}
                      </h3>
                      {card.subtitle && (
                        <p className="text-[10px] text-white/80 font-medium mt-1 drop-shadow-xs">
                          {card.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Related active goals */}
                    {card.relatedGoal && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-white/70 font-semibold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-emerald-400 shrink-0" />
                          Meta: {card.relatedGoal.slice(0, 24)}...
                        </span>
                        {card.dueDate && (
                          <span className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-md backdrop-blur-md border border-white/5">
                            <Calendar className="w-3 h-3" />
                            {card.dueDate}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* ADD CARD BUTTON (only visible when in Edit mode, styled as empty card) */}
          {isEditing && (
            <button
              onClick={handleOpenAddCard}
              className={`flex flex-col items-center justify-center border-2 border-dashed border-[#EAE3D5] dark:border-[#2E2E32] hover:border-blue-500/40 bg-zinc-50/50 dark:bg-[#1C1C1F]/10 hover:bg-blue-50/10 transition duration-300 min-h-[10rem] cursor-pointer ${getRadiusClass(
                mural.visualSettings?.borderRadius
              )} ${getCardSizeStyle(mural.visualSettings?.cardSize)}`}
            >
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full mb-2 border border-blue-500/10">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">Adicionar Card</span>
              <span className="text-[10px] text-zinc-400 mt-1">Defina metas e visualize seus objetivos</span>
            </button>
          )}
        </div>

        {/* --- MOTIVATIONAL PHRASE BOARD --- */}
        {(mural.phraseConfig?.visible ?? true) && (
          <div className="border-t border-[#EAE3D5]/40 dark:border-[#242427]/60 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-[#919196] uppercase tracking-wider">
                Frase Ativa no Mural
              </span>
              {isEditing && (
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mural.phraseConfig?.visible ?? true}
                      onChange={(e) => updateGeneralSettings((m) => {
                        if (!m.phraseConfig) m.phraseConfig = {};
                        m.phraseConfig.visible = e.target.checked;
                      })}
                      className="accent-[#4A6B53]"
                    />
                    Exibir Frase
                  </label>
                </div>
              )}
            </div>

            {isEditing ? (
              /* Inline Phrase Editor in Edit mode */
              <div className="p-4 bg-[#FAF8F5] dark:bg-[#1C1C1F] border border-[#EAE3D5] dark:border-[#242427] rounded-2xl space-y-3.5">
                <textarea
                  value={mural.phrase}
                  onChange={(e) => updateGeneralSettings((m) => { m.phrase = e.target.value; })}
                  placeholder="Escreva sua frase motivacional favorita..."
                  rows={2}
                  className="w-full p-3 text-xs sm:text-sm rounded-xl bg-white dark:bg-[#121214] text-zinc-800 dark:text-white border border-[#EAE3D5] dark:border-[#242427] focus:outline-none"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Color picker */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Cor do Texto</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={mural.phraseConfig?.textColor || '#4A6B53'}
                        onChange={(e) => updateGeneralSettings((m) => {
                          if (!m.phraseConfig) m.phraseConfig = {};
                          m.phraseConfig.textColor = e.target.value;
                        })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
                      />
                      <input
                        type="text"
                        value={mural.phraseConfig?.textColor || '#4A6B53'}
                        onChange={(e) => updateGeneralSettings((m) => {
                          if (!m.phraseConfig) m.phraseConfig = {};
                          m.phraseConfig.textColor = e.target.value;
                        })}
                        className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-[#121214] text-zinc-800 dark:text-white border border-[#EAE3D5] dark:border-[#242427] rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Alignment */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Alinhamento</label>
                    <select
                      value={mural.phraseConfig?.alignment || 'left'}
                      onChange={(e) => updateGeneralSettings((m) => {
                        if (!m.phraseConfig) m.phraseConfig = {};
                        m.phraseConfig.alignment = e.target.value as any;
                      })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#121214] text-zinc-800 dark:text-white border border-[#EAE3D5] dark:border-[#242427] rounded-lg"
                    >
                      <option value="left">Esquerda</option>
                      <option value="center">Centralizado</option>
                      <option value="right">Direita</option>
                    </select>
                  </div>

                  {/* Font Size */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Tamanho da Fonte</label>
                    <input
                      type="range"
                      min="11"
                      max="20"
                      value={mural.phraseConfig?.fontSize || 13}
                      onChange={(e) => updateGeneralSettings((m) => {
                        if (!m.phraseConfig) m.phraseConfig = {};
                        m.phraseConfig.fontSize = parseInt(e.target.value);
                      })}
                      className="w-full accent-[#4A6B53]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Beautiful styled display quote in normal mode */
              <div
                className="text-xs sm:text-sm italic font-medium border-l-2 pl-3 py-1 text-zinc-500 dark:text-[#919196]"
                style={{
                  borderLeftColor: mural.phraseConfig?.textColor || '#4A6B53',
                  textAlign: mural.phraseConfig?.alignment || 'left',
                  fontSize: mural.phraseConfig?.fontSize ? `${mural.phraseConfig.fontSize}px` : '13px',
                }}
              >
                "{mural.phrase}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===================== CARD DETAILED MODAL EDITOR ===================== */}
      {cardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121214] border border-[#EAE3D5] dark:border-[#242427] rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200 text-zinc-800 dark:text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE3D5]/60 dark:border-[#242427] pb-3">
              <h3 className="text-base font-bold font-serif text-zinc-800 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                {isAddingNew ? 'Criar Card de Visão & Metas' : 'Editar Card de Visão'}
              </h3>
              <button
                onClick={() => setCardModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition text-[#919196]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Fields */}
            <div className="space-y-4 text-xs">
              {/* Image Picker */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Foto de Fundo / Inspiração</label>
                
                {/* Image presets */}
                <div className="grid grid-cols-3 gap-2">
                  {IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setCardImageUrl(preset.url)}
                      className={`p-1.5 rounded-lg border text-[10px] text-center truncate transition ${
                        cardImageUrl === preset.url
                          ? 'border-blue-500 bg-blue-50/10 text-blue-500 font-bold'
                          : 'border-gray-200 dark:border-[#2E2E32] text-zinc-500 hover:bg-gray-50'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-[#1C1C1F] hover:bg-gray-100 dark:hover:bg-[#242427] border border-[#EAE3D5] dark:border-[#242427] rounded-xl text-zinc-700 dark:text-zinc-200 font-semibold cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Fazer Upload
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <input
                    type="text"
                    value={cardImageUrl}
                    onChange={(e) => setCardImageUrl(e.target.value)}
                    placeholder="Ou cole a URL direta de uma foto..."
                    className="flex-1 px-3 py-2 rounded-xl border border-[#EAE3D5] dark:border-[#242427] bg-white dark:bg-[#121214] text-zinc-800 dark:text-white focus:outline-none"
                  />
                </div>

                {cardImageUrl && (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-[#EAE3D5] bg-gray-50">
                    <img src={cardImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Título do Card *</label>
                  <input
                    type="text"
                    value={cardTitle}
                    onChange={(e) => setCardTitle(e.target.value)}
                    placeholder="Ex: Mesa de Estudos Minimalista"
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3D5] dark:border-[#242427] bg-white dark:bg-[#121214] text-zinc-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Subtítulo / Descrição Curta</label>
                  <input
                    type="text"
                    value={cardSubtitle}
                    onChange={(e) => setCardSubtitle(e.target.value)}
                    placeholder="Ex: Rotina & Foco diário"
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3D5] dark:border-[#242427] bg-white dark:bg-[#121214] text-zinc-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Categoria</label>
                  <input
                    type="text"
                    value={cardCategory}
                    onChange={(e) => setCardCategory(e.target.value)}
                    placeholder="Ex: Estudos, Veterinária, Saúde"
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3D5] dark:border-[#242427] bg-white dark:bg-[#121214] text-zinc-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Descrição (Nota de Visão)</label>
                  <input
                    type="text"
                    value={cardDescription}
                    onChange={(e) => setCardDescription(e.target.value)}
                    placeholder="O que essa visão representa para você?"
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3D5] dark:border-[#242427] bg-white dark:bg-[#121214] text-zinc-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Typography preferences inside Card */}
              <div className="border-t border-[#EAE3D5]/50 dark:border-[#242427]/60 pt-3.5 space-y-3">
                <span className="block text-[10px] font-bold text-zinc-400 dark:text-[#919196] uppercase tracking-wider">
                  Personalização Tipográfica do Card
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Estilo da Fonte</label>
                    <select
                      value={cardFontStyle}
                      onChange={(e) => setCardFontStyle(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white dark:bg-[#121214] text-zinc-800 dark:text-white border border-[#EAE3D5] dark:border-[#242427] rounded-lg"
                    >
                      <option value="font-sans">Sem Serifa (Sans)</option>
                      <option value="font-serif">Serifa Elegante</option>
                      <option value="font-mono">Monoespaçada</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Tamanho (px)</label>
                    <input
                      type="number"
                      min="11"
                      max="24"
                      value={cardFontSize}
                      onChange={(e) => setCardFontSize(parseInt(e.target.value) || 14)}
                      className="w-full px-2 py-1.5 text-xs bg-white dark:bg-[#121214] text-zinc-800 dark:text-white border border-[#EAE3D5] dark:border-[#242427] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Alinhamento</label>
                    <select
                      value={cardAlignment}
                      onChange={(e) => setCardAlignment(e.target.value as any)}
                      className="w-full px-2 py-1.5 text-xs bg-white dark:bg-[#121214] text-zinc-800 dark:text-white border border-[#EAE3D5] dark:border-[#242427] rounded-lg"
                    >
                      <option value="left">Esquerda</option>
                      <option value="center">Centro</option>
                      <option value="right">Direita</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Goal Integration */}
              <div className="border-t border-[#EAE3D5]/50 dark:border-[#242427]/60 pt-3.5 space-y-3">
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4 text-[#4A6B53] dark:text-[#C6A07C]" />
                  <span className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Vincular a uma Meta Concreta
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase">Ação / Objetivo da Meta</label>
                    <input
                      type="text"
                      value={cardRelatedGoal}
                      onChange={(e) => setCardRelatedGoal(e.target.value)}
                      placeholder="Ex: Estudar 4 horas diárias na escrivaninha"
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3D5] dark:border-[#242427] bg-white dark:bg-[#121214] text-zinc-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase">Prazo / Alvo</label>
                    <input
                      type="date"
                      value={cardDueDate}
                      onChange={(e) => setCardDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3D5] dark:border-[#242427] bg-white dark:bg-[#121214] text-zinc-800 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#EAE3D5]/60 dark:border-[#242427] pt-4">
              <button
                onClick={() => setCardModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCard}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition"
              >
                Salvar Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
