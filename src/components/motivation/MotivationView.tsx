import React, { useState, useRef } from 'react';
import { StorageService } from '../../lib/storage';
import { MotivationPhoto, MotivationAlbum, MotivationPhrase, CombinedMotivationCard, UserProfile } from '../../types';
import { UniversalImageEditor, ImageEditParams, QuoteConfig } from '../editor/UniversalImageEditor';
import { VisionMural } from './VisionMural';
import {
  Sparkles,
  Camera,
  Quote as QuoteIcon,
  FolderPlus,
  Heart,
  Trash2,
  Folder,
  LayoutGrid,
  Image as ImageIcon,
  Grid,
  Maximize2,
  Move,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Check,
  Download,
  Sliders,
  Type,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MotivationViewProps {
  onWallpaperChange?: () => void;
}

export const MotivationView: React.FC<MotivationViewProps> = ({ onWallpaperChange }) => {
  const db = StorageService.getDatabase();
  const profile = db.profile;

  // Active Motivation tab
  const [activeTab, setActiveTab] = useState<'mural' | 'phrases' | 'composer'>('mural');

  // Photo & Album state
  const photos: MotivationPhoto[] = db.motivationPhotos || [];
  const albums: MotivationAlbum[] = db.motivationAlbums || [];
  const phrases: MotivationPhrase[] = db.motivationPhrases || [];
  const combinedCards: CombinedMotivationCard[] = db.combinedMotivationCards || [];

  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('all');
  const [galleryLayout, setGalleryLayout] = useState<'grid' | 'mosaic' | 'polaroid'>('grid');

  // Modal / Add states
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [phraseModalOpen, setPhraseModalOpen] = useState(false);

  // Editing state
  const [editingPhoto, setEditingPhoto] = useState<MotivationPhoto | null>(null);

  const handleSaveEditedPhoto = (editedUrl: string, params: ImageEditParams, quote?: QuoteConfig) => {
    if (!editingPhoto) return;
    StorageService.update((draft) => {
      const p = (draft.motivationPhotos || []).find((photo) => photo.id === editingPhoto.id);
      if (p) {
        p.url = editedUrl;
        p.originalUrl = p.originalUrl || editingPhoto.url;
        p.editParams = params;
        if (quote) {
          p.quoteConfig = quote;
        }
      }
    });
    setEditingPhoto(null);
  };

  // Form states - Photo
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoAlbumId, setNewPhotoAlbumId] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Form states - Album
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');
  const [newAlbumCover, setNewAlbumCover] = useState('');
  const [newAlbumColor, setNewAlbumColor] = useState('#3B82F6');

  // Form states - Phrase
  const [newPhraseText, setNewPhraseText] = useState('');
  const [newPhraseAuthor, setNewPhraseAuthor] = useState('');
  const [newPhraseCategory, setNewPhraseCategory] = useState('Estudos');
  const [newPhraseFont, setNewPhraseFont] = useState('Plus Jakarta Sans');
  const [newPhraseSize, setNewPhraseSize] = useState<number>(16);
  const [newPhraseColor, setNewPhraseColor] = useState('#FFFFFF');
  const [newPhraseBg, setNewPhraseBg] = useState('#1C1C1F');
  const [newPhraseAlign, setNewPhraseAlign] = useState<'left' | 'center' | 'right'>('center');
  const [newPhraseStyle, setNewPhraseStyle] = useState<'minimalist' | 'academic' | 'aesthetic' | 'polaroid'>('minimalist');

  // Composer interactive editor state
  const [composerPhotoId, setComposerPhotoId] = useState<string>(photos[0]?.id || '');
  const [composerPhraseId, setComposerPhraseId] = useState<string>(phrases[0]?.id || '');
  const [composerFontColor, setComposerFontColor] = useState('#FFFFFF');
  const [composerFontSize, setComposerFontSize] = useState<number>(20);
  const [composerBgOpacity, setComposerBgOpacity] = useState<number>(50);
  const [composerShadow, setComposerShadow] = useState(true);
  const [composerPosition, setComposerPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [composerDragging, setComposerDragging] = useState(false);

  const composerContainerRef = useRef<HTMLDivElement>(null);

  // Wallpaper Slider state
  const [wallpaperOpacity, setWallpaperOpacity] = useState<number>(profile.dashboardWallpaperOpacity !== undefined ? profile.dashboardWallpaperOpacity : 15);

  // Photo uploading / drag-and-drop
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewPhotoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = () => {
    if (!newPhotoUrl.trim()) return;

    const newPhoto: MotivationPhoto = {
      id: `photo-${Date.now()}`,
      url: newPhotoUrl,
      title: newPhotoTitle.trim() || 'Foto Motivacional',
      albumId: newPhotoAlbumId || undefined,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    StorageService.update((draft) => {
      if (!draft.motivationPhotos) draft.motivationPhotos = [];
      draft.motivationPhotos.push(newPhoto);
    });

    setNewPhotoUrl('');
    setNewPhotoTitle('');
    setNewPhotoAlbumId('');
    setPhotoFile(null);
    setPhotoModalOpen(false);
    confetti({ particleCount: 30, spread: 50 });
  };

  const handleDeletePhoto = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja excluir esta foto do mural?')) {
      StorageService.update((draft) => {
        draft.motivationPhotos = (draft.motivationPhotos || []).filter((p) => p.id !== photoId);
      });
    }
  };

  const handleToggleFavoritePhoto = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.update((draft) => {
      const p = (draft.motivationPhotos || []).find((photo) => photo.id === photoId);
      if (p) p.isFavorite = !p.isFavorite;
    });
  };

  // Album creation
  const handleSaveAlbum = () => {
    if (!newAlbumName.trim()) return;

    const newAlbum: MotivationAlbum = {
      id: `alb-${Date.now()}`,
      name: newAlbumName.trim(),
      description: newAlbumDesc.trim(),
      coverUrl: newAlbumCover.trim() || 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&auto=format&fit=crop&q=80',
      color: newAlbumColor,
      createdAt: new Date().toISOString(),
    };

    StorageService.update((draft) => {
      if (!draft.motivationAlbums) draft.motivationAlbums = [];
      draft.motivationAlbums.push(newAlbum);
    });

    setNewAlbumName('');
    setNewAlbumDesc('');
    setNewAlbumCover('');
    setAlbumModalOpen(false);
    confetti({ particleCount: 20, spread: 40 });
  };

  // Phrase creation
  const handleSavePhrase = () => {
    if (!newPhraseText.trim()) return;

    const newPhrase: MotivationPhrase = {
      id: `phr-${Date.now()}`,
      text: newPhraseText.trim(),
      author: newPhraseAuthor.trim() || 'Desconhecido',
      category: newPhraseCategory,
      fontFamily: newPhraseFont,
      fontSize: newPhraseSize,
      textColor: newPhraseColor,
      backgroundColor: newPhraseBg,
      alignment: newPhraseAlign,
      styleType: newPhraseStyle,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    StorageService.update((draft) => {
      if (!draft.motivationPhrases) draft.motivationPhrases = [];
      draft.motivationPhrases.push(newPhrase);
    });

    setNewPhraseText('');
    setNewPhraseAuthor('');
    setPhraseModalOpen(false);
    confetti({ particleCount: 30, spread: 50 });
  };

  const handleDeletePhrase = (phraseId: string) => {
    if (confirm('Deseja excluir esta frase?')) {
      StorageService.update((draft) => {
        draft.motivationPhrases = (draft.motivationPhrases || []).filter((p) => p.id !== phraseId);
      });
    }
  };

  const handleToggleFavoritePhrase = (phraseId: string) => {
    StorageService.update((draft) => {
      const p = (draft.motivationPhrases || []).find((phrase) => phrase.id === phraseId);
      if (p) p.isFavorite = !p.isFavorite;
    });
  };

  // Wallpaper set
  const handleSetWallpaper = (photoUrl: string) => {
    StorageService.update((draft) => {
      draft.profile.dashboardBgType = 'image';
      draft.profile.dashboardWallpaperUrl = photoUrl;
      draft.profile.dashboardWallpaperOpacity = wallpaperOpacity;
    });
    if (onWallpaperChange) onWallpaperChange();
    confetti({ particleCount: 50, spread: 60 });
    alert('Foto definida como plano de fundo do seu Dashboard acadêmico!');
  };

  const handleResetWallpaper = () => {
    StorageService.update((draft) => {
      draft.profile.dashboardBgType = 'color';
      draft.profile.dashboardWallpaperUrl = undefined;
    });
    if (onWallpaperChange) onWallpaperChange();
    alert('Plano de fundo resetado para o padrão.');
  };

  // Quote of the Day scheduling
  const handleSetPhraseOfTheDay = (phraseId: string) => {
    StorageService.update((draft) => {
      if (!draft.phraseOfTheDayConfig) {
        draft.phraseOfTheDayConfig = { type: 'manual' };
      }
      draft.phraseOfTheDayConfig.type = 'manual';
      draft.phraseOfTheDayConfig.selectedPhraseId = phraseId;
      draft.phraseOfTheDayConfig.lastSelectedDate = new Date().toISOString().split('T')[0];
    });
    alert('Frase definida manualmente como a Frase do Dia!');
  };

  const handleToggleAutoQuote = () => {
    const isAuto = db.phraseOfTheDayConfig?.type === 'auto';
    StorageService.update((draft) => {
      if (!draft.phraseOfTheDayConfig) {
        draft.phraseOfTheDayConfig = { type: 'auto' };
      }
      draft.phraseOfTheDayConfig.type = isAuto ? 'manual' : 'auto';
    });
    alert(isAuto ? 'Modo de troca automática desativado.' : 'Modo automático ativado! As frases trocarão sozinhas diariamente.');
  };

  // Combined creator drag support
  const handleComposerMouseDown = (e: React.MouseEvent) => {
    setComposerDragging(true);
  };

  const handleComposerMouseMove = (e: React.MouseEvent) => {
    if (!composerDragging || !composerContainerRef.current) return;
    const rect = composerContainerRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setComposerPosition({ x, y });
  };

  const handleComposerMouseUp = () => {
    setComposerDragging(false);
  };

  const handleSaveCombinedCard = () => {
    if (!composerPhotoId || !composerPhraseId) return;

    const newCombined: CombinedMotivationCard = {
      id: `comb-${Date.now()}`,
      photoId: composerPhotoId,
      phraseId: composerPhraseId,
      overlayPosition: composerPosition,
      fontColor: composerFontColor,
      fontSize: composerFontSize,
      bgOpacity: composerBgOpacity,
      shadow: composerShadow,
      createdAt: new Date().toISOString(),
    };

    StorageService.update((draft) => {
      if (!draft.combinedMotivationCards) draft.combinedMotivationCards = [];
      draft.combinedMotivationCards.push(newCombined);
    });

    confetti({ particleCount: 40, spread: 50 });
    alert('Composição "Foto + Frase" salva com sucesso! Você pode visualizá-la no widget da página inicial.');
  };

  // Get current active Quote of the Day
  const getActivePhraseOfTheDay = (): MotivationPhrase | undefined => {
    const config = db.phraseOfTheDayConfig;
    if (phrases.length === 0) return undefined;

    if (config?.type === 'manual' && config.selectedPhraseId) {
      const found = phrases.find((p) => p.id === config.selectedPhraseId);
      if (found) return found;
    }

    // Auto: select phrase based on day index
    const day = new Date().getDate();
    const idx = day % phrases.length;
    return phrases[idx];
  };

  const activePhraseOfTheDay = getActivePhraseOfTheDay();

  // Filtered photos
  const filteredPhotos = selectedAlbumId === 'all'
    ? photos
    : selectedAlbumId === 'favorites'
    ? photos.filter((p) => p.isFavorite)
    : photos.filter((p) => p.albumId === selectedAlbumId);

  return (
    <div className="space-y-6">
      {/* Cover Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-amber-400 animate-pulse" />
          Central de Motivação & Visão de Estudos
        </h1>
        <p className="text-xs sm:text-sm text-[#919196] mt-1">
          Alimente sua mente diariamente, organize seus álbuns de metas acadêmicas, crie papéis de parede inspiradores e gerencie suas frases favoritas
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-[#121214] p-1.5 rounded-2xl border border-[#242427] shadow-xs gap-1">
        <button
          onClick={() => setActiveTab('mural')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
            activeTab === 'mural'
              ? 'bg-[#1C1C1F] text-white shadow-xs border border-[#2E2E32]'
              : 'text-[#919196] hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4 text-blue-400" />
          Mural de Fotos & Metas
        </button>

        <button
          onClick={() => setActiveTab('phrases')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
            activeTab === 'phrases'
              ? 'bg-[#1C1C1F] text-white shadow-xs border border-[#2E2E32]'
              : 'text-[#919196] hover:text-white'
          }`}
        >
          <QuoteIcon className="w-4 h-4 text-emerald-400" />
          Minhas Frases & Diário
        </button>

        <button
          onClick={() => setActiveTab('composer')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
            activeTab === 'composer'
              ? 'bg-[#1C1C1F] text-white shadow-xs border border-[#2E2E32]'
              : 'text-[#919196] hover:text-white'
          }`}
        >
          <LayoutGrid className="w-4 h-4 text-purple-400" />
          Compositor Foto + Frase
        </button>
      </div>

      {/* --------------------- TAB 1: MURAL --------------------- */}
      {activeTab === 'mural' && (
        <div className="space-y-6">
          {/* Custom Editable Vision & Goals Mural */}
          <VisionMural />

          {/* Wallpaper Controls Widget */}
          {profile.dashboardWallpaperUrl && (
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-blue-400" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Papel de Parede Ativo</h4>
                  <p className="text-[11px] text-[#919196]">Ajuste a transparência da imagem no fundo do Dashboard acadêmico</p>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2 flex-1 sm:flex-none">
                  <span className="text-[10px] text-[#919196]">Opacidade: {wallpaperOpacity}%</span>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={wallpaperOpacity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setWallpaperOpacity(val);
                      StorageService.update((draft) => {
                        draft.profile.dashboardWallpaperOpacity = val;
                      });
                      if (onWallpaperChange) onWallpaperChange();
                    }}
                    className="w-24 accent-blue-500"
                  />
                </div>
                <button
                  onClick={handleResetWallpaper}
                  className="px-3 py-1 bg-[#242427] hover:bg-red-950/40 hover:text-red-400 hover:border-red-500/20 border border-[#2E2E32] text-xs font-semibold text-white rounded-lg transition shrink-0 cursor-pointer"
                >
                  Remover Fundo
                </button>
              </div>
            </div>
          )}

          {/* Album & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedAlbumId('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                  selectedAlbumId === 'all'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-[#121214] border-[#242427] text-[#919196] hover:text-white'
                }`}
              >
                Todas as Fotos ({photos.length})
              </button>

              <button
                onClick={() => setSelectedAlbumId('favorites')}
                className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                  selectedAlbumId === 'favorites'
                    ? 'bg-red-600/20 border-red-500/30 text-red-400'
                    : 'bg-[#121214] border-[#242427] text-[#919196] hover:text-white'
                }`}
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                Favoritas ({photos.filter((p) => p.isFavorite).length})
              </button>

              {albums.map((alb) => (
                <button
                  key={alb.id}
                  onClick={() => setSelectedAlbumId(alb.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                    selectedAlbumId === alb.id
                      ? 'text-white'
                      : 'bg-[#121214] border-[#242427] text-[#919196] hover:text-white'
                  }`}
                  style={
                    selectedAlbumId === alb.id
                      ? { backgroundColor: alb.color || '#3B82F6', borderColor: alb.color || '#3B82F6' }
                      : undefined
                  }
                >
                  <Folder className="w-3.5 h-3.5 shrink-0" />
                  {alb.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAlbumModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#121214] border border-[#242427] rounded-xl text-xs font-semibold text-[#E2E2E2] hover:text-white transition cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
                Novo Álbum
              </button>

              <button
                onClick={() => setPhotoModalOpen(true)}
                className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Adicionar Foto
              </button>
            </div>
          </div>

          {/* Layout Controls */}
          <div className="flex items-center justify-between border-t border-b border-[#242427] py-2">
            <span className="text-[10px] font-bold text-[#919196] uppercase tracking-wider">
              {filteredPhotos.length} fotos encontradas neste mural
            </span>

            <div className="flex items-center gap-1 bg-[#121214] p-1 rounded-lg border border-[#242427]">
              <button
                onClick={() => setGalleryLayout('grid')}
                className={`p-1.5 rounded-md text-[#919196] hover:text-white transition cursor-pointer ${
                  galleryLayout === 'grid' ? 'bg-[#1C1C1F] text-blue-400' : ''
                }`}
                title="Visualização em Grade clássica"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGalleryLayout('mosaic')}
                className={`p-1.5 rounded-md text-[#919196] hover:text-white transition cursor-pointer ${
                  galleryLayout === 'mosaic' ? 'bg-[#1C1C1F] text-blue-400' : ''
                }`}
                title="Mosaico assimétrico"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGalleryLayout('polaroid')}
                className={`p-1.5 rounded-md text-[#919196] hover:text-white transition cursor-pointer ${
                  galleryLayout === 'polaroid' ? 'bg-[#1C1C1F] text-blue-400' : ''
                }`}
                title="Formato Polaroid"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Photos Grid */}
          {filteredPhotos.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-[#242427] bg-[#121214]/40">
              <Camera className="w-10 h-10 text-blue-500/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white">Nenhuma foto adicionada</p>
              <p className="text-xs text-[#919196] mt-0.5">Comece enviando fotos inspiradoras ou metas profissionais para este álbum!</p>
              <button
                onClick={() => setPhotoModalOpen(true)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                + Enviar Foto
              </button>
            </div>
          ) : (
            <div
              className={`grid gap-4 ${
                galleryLayout === 'mosaic'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 md:grid-flow-row-dense'
                  : galleryLayout === 'polaroid'
                  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
              }`}
            >
              {filteredPhotos.map((photo, index) => {
                const album = albums.find((a) => a.id === photo.albumId);

                // Mosaic span rendering calculations
                const isSpanned = galleryLayout === 'mosaic' && (index % 3 === 0);

                if (galleryLayout === 'polaroid') {
                  return (
                    <div
                      key={photo.id}
                      className="bg-white p-3 rounded-md shadow-lg border border-gray-200 transform hover:scale-105 transition duration-300 flex flex-col"
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-gray-100 border border-gray-100">
                        <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            onClick={() => setEditingPhoto(photo)}
                            className="p-1.5 rounded-full bg-white/90 shadow-xs text-blue-600 hover:bg-blue-50 cursor-pointer"
                            title="Editar Foto"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleToggleFavoritePhoto(photo.id, e)}
                            className={`p-1.5 rounded-full bg-white/90 shadow-xs cursor-pointer hover:scale-110 transition`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${photo.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                          </button>
                          <button
                            onClick={(e) => handleDeletePhoto(photo.id, e)}
                            className="p-1.5 rounded-full bg-white/90 shadow-xs text-red-500 hover:bg-red-100 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="pt-3 pb-1 text-center font-sans">
                        <p className="text-xs font-bold text-gray-800 line-clamp-1">{photo.title}</p>
                        {album && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 inline-block mt-1 font-semibold">
                            {album.name}
                          </span>
                        )}
                        <button
                          onClick={() => handleSetWallpaper(photo.url)}
                          className="w-full mt-2.5 py-1 text-[9px] font-bold text-blue-600 hover:bg-blue-50 bg-blue-50/50 rounded-lg cursor-pointer border border-blue-100 transition"
                        >
                          Definir como Fundo
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={photo.id}
                    className={`group relative rounded-2xl overflow-hidden border border-[#242427] bg-[#121214] shadow-xs hover:border-blue-500/50 transition cursor-pointer ${
                      isSpanned ? 'sm:col-span-2 sm:row-span-2 aspect-video sm:aspect-square' : 'aspect-square'
                    }`}
                  >
                    <img src={photo.url} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    
                    {/* Shadow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-between p-3.5" />

                    {/* Controls overlay always accessible on hover */}
                    <div className="absolute inset-0 p-3.5 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition duration-300">
                      <div className="flex items-center justify-between">
                        {album ? (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold text-white uppercase tracking-wider" style={{ backgroundColor: album.color }}>
                            {album.name}
                          </span>
                        ) : (
                          <span />
                        )}

                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPhoto(photo);
                            }}
                            className="p-1.5 rounded-lg bg-[#121214]/80 text-[#919196] hover:text-blue-400 transition cursor-pointer"
                            title="Editar Foto"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleToggleFavoritePhoto(photo.id, e)}
                            className="p-1.5 rounded-lg bg-[#121214]/80 text-[#919196] hover:text-red-500 transition cursor-pointer"
                          >
                            <Heart className={`w-3.5 h-3.5 ${photo.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => handleDeletePhoto(photo.id, e)}
                            className="p-1.5 rounded-lg bg-[#121214]/80 text-[#919196] hover:text-red-500 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{photo.title}</p>
                          <p className="text-[10px] text-[#919196] mt-0.5">Adicionado em {new Date(photo.createdAt).toLocaleDateString()}</p>
                        </div>

                        <button
                          onClick={() => handleSetWallpaper(photo.url)}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg shadow-xs transition cursor-pointer"
                        >
                          Definir como Fundo
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --------------------- TAB 2: PHRASES --------------------- */}
      {activeTab === 'phrases' && (
        <div className="space-y-6">
          {/* Quote of the Day Active Board */}
          {activePhraseOfTheDay ? (
            <div className="bg-[#121214] rounded-2xl border border-[#242427] p-6 space-y-4 shadow-md relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">A Frase do Dia</h3>
                    <p className="text-[10px] text-[#919196]">Aparece como destaque na página inicial</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleAutoQuote}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold transition border cursor-pointer ${
                      db.phraseOfTheDayConfig?.type === 'auto'
                        ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 font-bold'
                        : 'bg-[#1C1C1F] border-[#242427] text-[#919196]'
                    }`}
                  >
                    Troca Diária Automática: {db.phraseOfTheDayConfig?.type === 'auto' ? 'LIGADO' : 'DESLIGADO'}
                  </button>
                </div>
              </div>

              {/* Render Selected Phrase with Style Layout */}
              <div
                className={`p-5 rounded-xl border text-center transition ${
                  activePhraseOfTheDay.styleType === 'academic'
                    ? 'font-serif border-blue-500/20 bg-[#1C1C1F]/60 text-[#E1F5FE]'
                    : activePhraseOfTheDay.styleType === 'polaroid'
                    ? 'font-serif bg-white text-gray-800 border-gray-200 shadow-md p-6'
                    : activePhraseOfTheDay.styleType === 'aesthetic'
                    ? 'font-sans bg-[#EFF6FF] border-blue-200 text-blue-900 font-medium'
                    : 'bg-[#1C1C1F]/40 border-[#242427] text-white'
                }`}
                style={
                  activePhraseOfTheDay.styleType === 'minimalist'
                    ? { backgroundColor: activePhraseOfTheDay.backgroundColor, color: activePhraseOfTheDay.textColor }
                    : undefined
                }
              >
                <QuoteIcon className={`w-8 h-8 opacity-20 mx-auto mb-2 ${activePhraseOfTheDay.styleType === 'polaroid' ? 'text-gray-400' : 'text-blue-400'}`} />
                <p className="text-base sm:text-lg italic font-medium leading-relaxed">
                  "{activePhraseOfTheDay.text}"
                </p>
                {activePhraseOfTheDay.author && (
                  <p className={`text-xs mt-3 font-semibold tracking-wide uppercase ${activePhraseOfTheDay.styleType === 'polaroid' ? 'text-gray-500' : 'text-white/60'}`}>
                    — {activePhraseOfTheDay.author}
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {/* Controls Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#919196]">
              Escreva suas próprias citações favoritas ou filosofias de vida para usar no widget.
            </span>
            <button
              onClick={() => setPhraseModalOpen(true)}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adicionar Frase
            </button>
          </div>

          {/* Phrases list */}
          {phrases.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-[#242427] bg-[#121214]/40">
              <QuoteIcon className="w-10 h-10 text-emerald-500/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white">Nenhuma frase cadastrada</p>
              <p className="text-xs text-[#919196] mt-0.5">Adicione frases inspiradoras para começar o dia com o pé direito.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {phrases.map((phrase) => (
                <div
                  key={phrase.id}
                  className="bg-[#121214] border border-[#242427] p-4.5 rounded-2xl hover:border-blue-500/40 transition flex flex-col justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <QuoteIcon className="w-5 h-5 text-emerald-400 shrink-0 opacity-40" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1.5">{phrase.category}</p>
                      <p className="text-xs sm:text-sm text-white italic font-medium leading-relaxed">
                        "{phrase.text}"
                      </p>
                      {phrase.author && (
                        <p className="text-[11px] text-[#919196] mt-2 font-semibold">
                          — {phrase.author}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#242427] text-xs">
                    <div className="flex items-center gap-1 text-[#919196]">
                      <span className="px-2 py-0.5 rounded-full bg-[#1C1C1F] text-[9px] font-bold uppercase tracking-wider">
                        Estilo: {phrase.styleType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSetPhraseOfTheDay(phrase.id)}
                        className={`px-2 py-1 text-[10px] font-semibold rounded-lg transition cursor-pointer ${
                          db.phraseOfTheDayConfig?.selectedPhraseId === phrase.id
                            ? 'bg-emerald-600/20 text-emerald-400 font-bold border border-emerald-500/20'
                            : 'bg-[#1C1C1F] text-[#919196] hover:text-white border border-[#242427]'
                        }`}
                        title="Definir esta frase como Frase do Dia"
                      >
                        {db.phraseOfTheDayConfig?.selectedPhraseId === phrase.id ? 'Ativa de Hoje' : 'Marcar p/ Hoje'}
                      </button>

                      <button
                        onClick={() => handleToggleFavoritePhrase(phrase.id)}
                        className={`p-1.5 rounded-lg bg-[#1C1C1F] text-[#919196] hover:text-red-500 transition border border-[#242427] cursor-pointer`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${phrase.isFavorite ? 'fill-red-500 text-red-500 border-none' : ''}`} />
                      </button>

                      <button
                        onClick={() => handleDeletePhrase(phrase.id)}
                        className="p-1.5 rounded-lg bg-[#1C1C1F] text-[#919196] hover:text-red-500 transition border border-[#242427] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --------------------- TAB 3: COMPOSER --------------------- */}
      {activeTab === 'composer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Editor Sidebar */}
          <div className="bg-[#121214] p-5 rounded-2xl border border-[#242427] shadow-xs space-y-5 lg:col-span-1">
            <div className="flex items-center gap-2 border-b border-[#242427] pb-3">
              <Sliders className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Ajustes Visuais</h3>
            </div>

            {/* Photo Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase text-[#919196] mb-1.5">
                Escolha a Foto de Fundo
              </label>
              {photos.length === 0 ? (
                <p className="text-[11px] text-red-400">Adicione fotos na aba "Mural" primeiro para usar no compositor.</p>
              ) : (
                <select
                  value={composerPhotoId}
                  onChange={(e) => setComposerPhotoId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none"
                >
                  {photos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title || 'Foto Motivacional'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Phrase Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase text-[#919196] mb-1.5">
                Escolha a Frase
              </label>
              {phrases.length === 0 ? (
                <p className="text-[11px] text-red-400">Adicione frases na aba "Minhas Frases" primeiro.</p>
              ) : (
                <select
                  value={composerPhraseId}
                  onChange={(e) => setComposerPhraseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none"
                >
                  {phrases.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.text.slice(0, 35)}...
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Font Color */}
            <div>
              <label className="block text-xs font-semibold uppercase text-[#919196] mb-1.5">
                Cor do Texto
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={composerFontColor}
                  onChange={(e) => setComposerFontColor(e.target.value)}
                  className="w-10 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={composerFontColor}
                  onChange={(e) => setComposerFontColor(e.target.value)}
                  className="flex-1 px-3 py-1 text-xs bg-[#1C1C1F] border border-[#242427] rounded-lg text-white"
                />
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-xs font-semibold uppercase text-[#919196] mb-1.5">
                Tamanho da Fonte: {composerFontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="36"
                value={composerFontSize}
                onChange={(e) => setComposerFontSize(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            {/* Dark Overlay Opacity */}
            <div>
              <label className="block text-xs font-semibold uppercase text-[#919196] mb-1.5">
                Escurecimento do Fundo: {composerBgOpacity}%
              </label>
              <input
                type="range"
                min="0"
                max="90"
                value={composerBgOpacity}
                onChange={(e) => setComposerBgOpacity(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            {/* Shadow toggler */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase text-[#919196]">Sombra no Texto</label>
              <input
                type="checkbox"
                checked={composerShadow}
                onChange={(e) => setComposerShadow(e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
            </div>

            <button
              onClick={handleSaveCombinedCard}
              disabled={photos.length === 0 || phrases.length === 0}
              className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              Salvar Composição
            </button>
          </div>

          {/* Composition Live Stage Sandbox Canvas */}
          <div className="lg:col-span-2 flex flex-col justify-between bg-[#121214] p-5 rounded-2xl border border-[#242427] space-y-4">
            <div className="flex items-center gap-2 text-xs text-[#919196]">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Clique e arraste a frase na tela para ajustar a posição vertical e horizontal</span>
            </div>

            {/* Sandbox screen */}
            <div
              ref={composerContainerRef}
              onMouseMove={handleComposerMouseMove}
              onMouseUp={handleComposerMouseUp}
              onMouseLeave={handleComposerMouseUp}
              className="relative aspect-video w-full rounded-xl overflow-hidden border border-[#242427] bg-[#0A0A0B] cursor-crosshair select-none"
            >
              {photos.find((p) => p.id === composerPhotoId) ? (
                <img
                  src={photos.find((p) => p.id === composerPhotoId)?.url}
                  alt="Composer Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#919196]">
                  Adicione fotos para gerar o plano de fundo
                </div>
              )}

              {/* Dynamic darker overlay */}
              <div
                className="absolute inset-0 bg-black"
                style={{ opacity: composerBgOpacity / 100 }}
              />

              {/* Interactive Quote overlay */}
              {phrases.find((p) => p.id === composerPhraseId) && (
                <div
                  onMouseDown={handleComposerMouseDown}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 p-4 rounded-xl cursor-move bg-black/30 backdrop-blur-xs max-w-xs text-center border border-white/10"
                  style={{
                    left: `${composerPosition.x}%`,
                    top: `${composerPosition.y}%`,
                    color: composerFontColor,
                    fontSize: `${composerFontSize}px`,
                    textShadow: composerShadow ? '2px 2px 8px rgba(0,0,0,0.9)' : 'none',
                  }}
                >
                  <p className="italic font-serif leading-relaxed">
                    "{phrases.find((p) => p.id === composerPhraseId)?.text}"
                  </p>
                  <p className="text-[10px] uppercase font-bold tracking-wider mt-2 opacity-80">
                    — {phrases.find((p) => p.id === composerPhraseId)?.author || 'Autor'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-[#919196]">
              <span>Arraste o elemento para criar composições únicas.</span>
              <span className="font-bold text-white">X: {Math.round(composerPosition.x)}% | Y: {Math.round(composerPosition.y)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADICIONAR FOTO ===================== */}
      {photoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-400" />
              Adicionar Nova Foto Motivacional
            </h3>

            {/* Drag-and-drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 border-2 border-dashed border-[#242427] hover:border-blue-500/40 bg-[#1C1C1F]/40 text-center rounded-xl cursor-pointer transition flex flex-col items-center gap-2"
            >
              <UploadIcon className="w-8 h-8 text-blue-400/60" />
              <p className="text-xs font-bold text-white">Selecione uma imagem ou arraste aqui</p>
              <p className="text-[10px] text-[#919196]">Suporta JPG, PNG ou WEBP acadêmico</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* URL Fallback */}
            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#919196] mb-1">
                Ou cole a URL da imagem (Unsplash, etc.)
              </label>
              <input
                type="text"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {newPhotoUrl && (
              <div className="aspect-video rounded-xl overflow-hidden border border-[#242427] bg-[#1C1C1F]">
                <img src={newPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#919196] mb-1">
                Título ou Nome da Meta *
              </label>
              <input
                type="text"
                value={newPhotoTitle}
                onChange={(e) => setNewPhotoTitle(e.target.value)}
                placeholder="Ex: Formatura Veterinária"
                className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#919196] mb-1">
                Vincular ao Álbum
              </label>
              <select
                value={newPhotoAlbumId}
                onChange={(e) => setNewPhotoAlbumId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Sem álbum (Mural Geral)</option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPhotoModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#919196] hover:text-white rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePhoto}
                disabled={!newPhotoUrl.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
              >
                Adicionar ao Mural
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADICIONAR ÁLBUM ===================== */}
      {albumModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-blue-400" />
              Criar Novo Álbum de Metas
            </h3>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#919196] mb-1">
                Nome do Álbum *
              </label>
              <input
                type="text"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                placeholder="Ex: Estágio e Carreira"
                className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#919196] mb-1">
                Descrição do Álbum
              </label>
              <input
                type="text"
                value={newAlbumDesc}
                onChange={(e) => setNewAlbumDesc(e.target.value)}
                placeholder="Fotos de veterinários e clínicas para me motivar..."
                className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#919196] mb-1">
                URL da Foto de Capa do Álbum
              </label>
              <input
                type="text"
                value={newAlbumCover}
                onChange={(e) => setNewAlbumCover(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#919196] mb-1">
                Cor Temática do Álbum
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newAlbumColor}
                  onChange={(e) => setNewAlbumColor(e.target.value)}
                  className="w-10 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={newAlbumColor}
                  onChange={(e) => setNewAlbumColor(e.target.value)}
                  className="flex-1 px-3 py-1 text-xs bg-[#1C1C1F] border border-[#242427] rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAlbumModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#919196] hover:text-white rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAlbum}
                disabled={!newAlbumName.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
              >
                Cadastrar Álbum
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADICIONAR FRASE ===================== */}
      {phraseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <QuoteIcon className="w-5 h-5 text-emerald-400" />
              Adicionar Frase Motivacional
            </h3>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#919196] mb-1">
                Texto da Frase ou Citação *
              </label>
              <textarea
                value={newPhraseText}
                onChange={(e) => setNewPhraseText(e.target.value)}
                placeholder="Escreva sua frase favorita aqui..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#919196] mb-1">
                Autor ou Fonte
              </label>
              <input
                type="text"
                value={newPhraseAuthor}
                onChange={(e) => setNewPhraseAuthor(e.target.value)}
                placeholder="Ex: Friedrich Nietzsche"
                className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#919196] mb-1">
                  Categoria
                </label>
                <select
                  value={newPhraseCategory}
                  onChange={(e) => setNewPhraseCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none"
                >
                  <option value="Estudos">Estudos</option>
                  <option value="Inspiração">Inspiração</option>
                  <option value="Metas">Metas</option>
                  <option value="Filosofia">Filosofia</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#919196] mb-1">
                  Estilo da Frase
                </label>
                <select
                  value={newPhraseStyle}
                  onChange={(e) => setNewPhraseStyle(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none"
                >
                  <option value="minimalist">Minimalista</option>
                  <option value="academic">Acadêmico</option>
                  <option value="aesthetic">Estético</option>
                  <option value="polaroid">Polaroid</option>
                </select>
              </div>
            </div>

            {newPhraseStyle === 'minimalist' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#919196] mb-1">
                    Cor do Texto
                  </label>
                  <input
                    type="color"
                    value={newPhraseColor}
                    onChange={(e) => setNewPhraseColor(e.target.value)}
                    className="w-full h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#919196] mb-1">
                    Cor do Fundo
                  </label>
                  <input
                    type="color"
                    value={newPhraseBg}
                    onChange={(e) => setNewPhraseBg(e.target.value)}
                    className="w-full h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPhraseModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#919196] hover:text-white rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePhrase}
                disabled={!newPhraseText.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
              >
                Salvar Citação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Image Editor for Motivation Photos */}
      {editingPhoto && (
        <UniversalImageEditor
          isOpen={!!editingPhoto}
          onClose={() => setEditingPhoto(null)}
          title="Editar Foto Motivacional"
          originalImage={editingPhoto.originalUrl || editingPhoto.url}
          editParams={editingPhoto.editParams}
          quoteConfig={editingPhoto.quoteConfig}
          showQuoteEditor={true}
          circleCrop={false}
          onSave={handleSaveEditedPhoto}
        />
      )}
    </div>
  );
};

// Simple Upload SVG helper
function UploadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}
