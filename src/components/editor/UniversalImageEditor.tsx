import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sliders,
  Sparkles,
  Crop,
  Undo,
  Redo,
  RefreshCw,
  Check,
  Type,
  FileImage,
  Sun,
  Eye,
  EyeOff,
  Move,
  Trash2,
  Copy,
  FolderPlus,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface ImageEditParams {
  zoom: number;       // 1x to 5x
  x: number;          // Horizontal offset (-100 to 100)
  y: number;          // Vertical offset (-100 to 100)
  rotation: number;   // Rotation angle (0 to 360)
  brightness: number; // 0 to 200 (100 is default)
  contrast: number;   // 0 to 200 (100 is default)
  saturation: number; // 0 to 200 (100 is default)
  temperature: number;// -100 to 100 (0 is default)
  exposure: number;   // -100 to 100 (0 is default)
  opacity: number;    // 0 to 100 (100 is default)
  blur: number;       // 0 to 30px (0 is default)
  dim: number;        // Dimming overlay percentage (0 to 100)
  filter: string;     // 'original', 'preto_e_branco', 'sepia', 'vintage', 'warm', 'cold', 'soft', 'high_contrast', 'analogic'
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
    aspectRatio: string; // 'free' | '1:1' | '4:3' | '16:9' | '3:4' | '9:16'
  } | null;
  fitMode: 'fill' | 'fit' | 'center' | 'custom';
}

export const DEFAULT_EDIT_PARAMS: ImageEditParams = {
  zoom: 1,
  x: 0,
  y: 0,
  rotation: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  temperature: 0,
  exposure: 0,
  opacity: 100,
  blur: 0,
  dim: 0,
  filter: 'original',
  crop: null,
  fitMode: 'fill',
};

export interface QuoteConfig {
  text: string;
  author?: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  alignment: 'left' | 'center' | 'right';
  opacity: number;
  spacing: number;
  shadow: boolean;
  position: { x: number; y: number }; // Percentage position on image
}

export const DEFAULT_QUOTE_CONFIG: QuoteConfig = {
  text: '',
  author: '',
  fontSize: 18,
  fontFamily: 'Playfair Display',
  color: '#FFFFFF',
  alignment: 'center',
  opacity: 100,
  spacing: 0,
  shadow: true,
  position: { x: 50, y: 50 },
};

export interface UniversalImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  originalImage: string; // Base64 or URL
  editParams?: ImageEditParams;
  quoteConfig?: QuoteConfig;
  showQuoteEditor?: boolean;
  circleCrop?: boolean; // Circular overlay for profile
  aspectRatios?: string[]; // Allowed aspect ratios for crop
  onSave: (editedImageUrl: string, finalParams: ImageEditParams, finalQuote?: QuoteConfig) => void;
}

// Client-side non-destructive compilation engine
export function compileImage(
  originalUrl: string,
  params: ImageEditParams,
  circleCrop: boolean = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(originalUrl);
        return;
      }

      // Limit high resolution limit for performance/storage but keep crisp
      const maxDim = 1200;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      let cropWidth = w;
      let cropHeight = h;
      let cropX = 0;
      let cropY = 0;

      if (params.crop) {
        cropX = (params.crop.x / 100) * w;
        cropY = (params.crop.y / 100) * h;
        cropWidth = (params.crop.width / 100) * w;
        cropHeight = (params.crop.height / 100) * h;
      }

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (circleCrop) {
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2, 0, Math.PI * 2);
        ctx.clip();
      }

      // Save transformations
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((params.rotation * Math.PI) / 180);
      ctx.scale(params.zoom, params.zoom);

      const offsetX = (params.x / 100) * canvas.width;
      const offsetY = (params.y / 100) * canvas.height;
      ctx.translate(offsetX, offsetY);

      ctx.drawImage(
        img,
        0, 0, img.width, img.height,
        -w / 2 - cropX, -h / 2 - cropY, w, h
      );
      ctx.restore();

      // Apply Filters
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const b = params.brightness / 100;
        const c = params.contrast / 100;
        const s = params.saturation / 100;
        const exp = params.exposure / 100;
        const temp = params.temperature / 100;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b_ = data[i + 2];
          let a = data[i + 3];

          if (a === 0) continue;

          // 1. Exposure
          r = Math.min(255, Math.max(0, r * Math.pow(2, exp)));
          g = Math.min(255, Math.max(0, g * Math.pow(2, exp)));
          b_ = Math.min(255, Math.max(0, b_ * Math.pow(2, exp)));

          // 2. Brightness
          r *= b;
          g *= b;
          b_ *= b;

          // 3. Contrast
          r = ((r / 255 - 0.5) * c + 0.5) * 255;
          g = ((g / 255 - 0.5) * c + 0.5) * 255;
          b_ = ((b_ / 255 - 0.5) * c + 0.5) * 255;

          // 4. Saturation
          const gray = 0.299 * r + 0.587 * g + 0.114 * b_;
          r = gray + (r - gray) * s;
          g = gray + (g - gray) * s;
          b_ = gray + (b_ - gray) * s;

          // 5. Temperature
          if (temp > 0) {
            r += temp * 30;
            b_ -= temp * 15;
          } else if (temp < 0) {
            b_ -= temp * 30;
            r += temp * 15;
          }

          // 6. Preset Presets
          if (params.filter === 'preto_e_branco') {
            const luma = 0.299 * r + 0.587 * g + 0.114 * b_;
            r = g = b_ = luma;
          } else if (params.filter === 'sepia' || params.filter === 'vintage') {
            const tr = 0.393 * r + 0.769 * g + 0.189 * b_;
            const tg = 0.349 * r + 0.686 * g + 0.168 * b_;
            const tb = 0.272 * r + 0.534 * g + 0.131 * b_;
            r = Math.min(255, tr);
            g = Math.min(255, tg);
            b_ = Math.min(255, tb);
            if (params.filter === 'vintage') {
              r = r * 1.05;
              b_ = b_ * 0.9;
            }
          } else if (params.filter === 'warm') {
            r = Math.min(255, r + 20);
            b_ = Math.max(0, b_ - 10);
          } else if (params.filter === 'cold') {
            b_ = Math.min(255, b_ + 25);
            r = Math.max(0, r - 10);
          } else if (params.filter === 'soft') {
            r = r * 0.9 + 25;
            g = g * 0.9 + 25;
            b_ = b_ * 0.9 + 25;
          } else if (params.filter === 'high_contrast') {
            r = ((r / 255 - 0.5) * 1.3 + 0.5) * 255;
            g = ((g / 255 - 0.5) * 1.3 + 0.5) * 255;
            b_ = ((b_ / 255 - 0.5) * 1.3 + 0.5) * 255;
          } else if (params.filter === 'analogic') {
            r = r * 0.95 + 10;
            g = g * 0.9 + 10;
            b_ = b_ * 0.85 + 5;
            const rand = (Math.random() - 0.5) * 12;
            r = Math.min(255, Math.max(0, r + rand));
            g = Math.min(255, Math.max(0, g + rand));
            b_ = Math.min(255, Math.max(0, b_ + rand));
          }

          data[i] = Math.min(255, Math.max(0, r));
          data[i + 1] = Math.min(255, Math.max(0, g));
          data[i + 2] = Math.min(255, Math.max(0, b_));
        }
        ctx.putImageData(imageData, 0, 0);
      } catch (err) {
        console.error('Erro de filtro:', err);
      }

      // Opacity
      if (params.opacity < 100) {
        ctx.globalAlpha = params.opacity / 100;
      }

      // Wallpaper Dim Layer (bake in directly or use CSS overlay)
      if (params.dim > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${params.dim / 100})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = (e) => reject(e);
    img.src = originalUrl;
  });
}

export const UniversalImageEditor: React.FC<UniversalImageEditorProps> = ({
  isOpen,
  onClose,
  title = 'Editar Imagem',
  originalImage,
  editParams = DEFAULT_EDIT_PARAMS,
  quoteConfig = DEFAULT_QUOTE_CONFIG,
  showQuoteEditor = false,
  circleCrop = false,
  aspectRatios = ['free', '1:1', '4:3', '16:9', '3:4', '9:16'],
  onSave,
}) => {
  // Current active editing tool tab
  const [activeTab, setActiveTab] = useState<'adjust' | 'filters' | 'crop' | 'quote'>('adjust');

  // Interactive Parameters
  const [currentParams, setCurrentParams] = useState<ImageEditParams>({
    ...DEFAULT_EDIT_PARAMS,
    ...editParams,
  });

  // Quote properties
  const [currentQuote, setCurrentQuote] = useState<QuoteConfig>({
    ...DEFAULT_QUOTE_CONFIG,
    ...quoteConfig,
  });

  // History system for Undo/Redo
  const [history, setHistory] = useState<ImageEditParams[]>([{ ...DEFAULT_EDIT_PARAMS, ...editParams }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // States
  const [imageSrc, setImageSrc] = useState(originalImage);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [quoteDragging, setQuoteDragging] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if originalImage or editParams change
  useEffect(() => {
    setImageSrc(originalImage);
    setCurrentParams({ ...DEFAULT_EDIT_PARAMS, ...editParams });
    setHistory([{ ...DEFAULT_EDIT_PARAMS, ...editParams }]);
    setHistoryIndex(0);
  }, [originalImage, editParams]);

  if (!isOpen) return null;

  // Add a state to history
  const pushHistory = (newParams: ImageEditParams) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newParams);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleParamChange = (field: keyof ImageEditParams, value: any) => {
    const updated = { ...currentParams, [field]: value };
    setCurrentParams(updated);
    pushHistory(updated);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      setCurrentParams(history[idx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      setCurrentParams(history[idx]);
    }
  };

  const handleReset = () => {
    const resetVal = { ...DEFAULT_EDIT_PARAMS };
    setCurrentParams(resetVal);
    pushHistory(resetVal);
  };

  // Image Upload / Swap Handler
  const handleImageSwap = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
        const fresh = { ...DEFAULT_EDIT_PARAMS };
        setCurrentParams(fresh);
        setHistory([fresh]);
        setHistoryIndex(0);
      }
    };
    reader.readAsDataURL(file);
  };

  // Compile final image and invoke onSave
  const handleSaveClick = async () => {
    try {
      const compiled = await compileImage(imageSrc, currentParams, circleCrop);
      onSave(compiled, currentParams, showQuoteEditor ? currentQuote : undefined);
      confetti({ particleCount: 30, spread: 50 });
      onClose();
    } catch (err) {
      console.error('Erro ao compilar imagem editada:', err);
      alert('Não foi possível processar as edições da imagem.');
    }
  };

  // Drag Support for Motivational Overlaid Quote Text
  const handleQuoteMouseDown = () => {
    setQuoteDragging(true);
  };

  const handleQuoteMouseMove = (e: React.MouseEvent) => {
    if (!quoteDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setCurrentQuote((prev) => ({ ...prev, position: { x, y } }));
  };

  const handleQuoteMouseUp = () => {
    setQuoteDragging(false);
  };

  // Helper styles for preview
  const previewFilterStyle = () => {
    let cssFilters = '';
    cssFilters += `brightness(${currentParams.brightness}%) `;
    cssFilters += `contrast(${currentParams.contrast}%) `;
    cssFilters += `saturate(${currentParams.saturation}%) `;
    if (currentParams.blur > 0) cssFilters += `blur(${currentParams.blur}px) `;
    if (currentParams.opacity < 100) cssFilters += `opacity(${currentParams.opacity / 100}) `;

    // Preset filter presets applied via Tailwind/CSS fallback helper
    let filterClass = '';
    switch (currentParams.filter) {
      case 'preto_e_branco':
        cssFilters += 'grayscale(100%) ';
        break;
      case 'sepia':
        cssFilters += 'sepia(100%) ';
        break;
      case 'vintage':
        cssFilters += 'sepia(60%) contrast(120%) saturate(110%) ';
        break;
      case 'warm':
        cssFilters += 'hue-rotate(10deg) saturate(120%) ';
        break;
      case 'cold':
        cssFilters += 'hue-rotate(-10deg) saturate(110%) ';
        break;
      case 'high_contrast':
        cssFilters += 'contrast(140%) ';
        break;
      case 'soft':
        cssFilters += 'blur(0.5px) brightness(110%) contrast(90%) ';
        break;
      default:
        break;
    }

    return { filter: cssFilters };
  };

  const previewTransformStyle = () => {
    let transform = `scale(${currentParams.zoom}) `;
    transform += `rotate(${currentParams.rotation}deg) `;
    transform += `translate(${currentParams.x}%, ${currentParams.y}%)`;
    return { transform };
  };

  const presetFilters = [
    { id: 'original', name: 'Original' },
    { id: 'preto_e_branco', name: 'P&B' },
    { id: 'sepia', name: 'Sépia' },
    { id: 'vintage', name: 'Vintage' },
    { id: 'warm', name: 'Quente' },
    { id: 'cold', name: 'Frio' },
    { id: 'soft', name: 'Suave' },
    { id: 'high_contrast', name: 'Contraste' },
    { id: 'analogic', name: 'Analógico' },
  ];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#121214] border border-[#242427] w-full max-w-5xl rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl h-[95vh] md:h-[85vh]">
        
        {/* Left Side: Live Image Workspace Viewport */}
        <div className="flex-1 bg-[#09090B] relative flex flex-col justify-between p-4 border-r border-[#242427]/40">
          
          {/* Top Panel Bar */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">{title}</h2>
            </div>

            {/* Quick history and swap triggers */}
            <div className="flex items-center gap-1.5 bg-[#1C1C1F] p-1 rounded-xl border border-[#2E2E32]">
              <button
                onClick={handleUndo}
                disabled={historyIndex === 0}
                className="p-2 text-[#919196] hover:text-white disabled:opacity-20 transition hover:bg-[#242427] rounded-lg cursor-pointer"
                title="Desfazer (Undo)"
              >
                <Undo className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex === history.length - 1}
                className="p-2 text-[#919196] hover:text-white disabled:opacity-20 transition hover:bg-[#242427] rounded-lg cursor-pointer"
                title="Refazer (Redo)"
              >
                <Redo className="w-3.5 h-3.5" />
              </button>
              <div className="h-4 w-px bg-[#242427] mx-1"></div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 transition hover:bg-[#242427] rounded-lg cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Trocar Imagem
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSwap}
                className="hidden"
              />
            </div>
          </div>

          {/* Interactive Bounding Frame Workspace Box */}
          <div
            ref={containerRef}
            onMouseMove={handleQuoteMouseMove}
            onMouseUp={handleQuoteMouseUp}
            onMouseLeave={handleQuoteMouseUp}
            className="flex-1 flex items-center justify-center relative overflow-hidden my-4 min-h-[300px] select-none rounded-2xl bg-[radial-gradient(#1c1c1f_1px,transparent_1px)] [background-size:16px_16px]"
          >
            {/* Aspect ratio bounding box frame or standard preview */}
            <div
              className={`relative max-w-full max-h-full aspect-video flex items-center justify-center overflow-hidden border-2 border-dashed border-[#242427] ${
                circleCrop ? 'rounded-full aspect-square w-64 h-64 shadow-2xl border-solid border-blue-500/40 ring-4 ring-black/80' : 'rounded-xl'
              }`}
            >
              {/* Image with transform & CSS visual filters applied dynamically */}
              <img
                src={imageSrc}
                alt="Workspace Preview"
                style={{
                  ...previewFilterStyle(),
                  ...previewTransformStyle(),
                }}
                className={`max-w-full max-h-full object-contain pointer-events-none transition-all duration-75 ${
                  circleCrop ? 'w-full h-full object-cover' : ''
                }`}
              />

              {/* Wallpaper Dark Dim Overlay Indicator */}
              {currentParams.dim > 0 && (
                <div
                  className="absolute inset-0 transition-opacity"
                  style={{ backgroundColor: `rgba(0,0,0,${currentParams.dim / 100})` }}
                />
              )}

              {/* OVERLAID MOTIVATIONAL QUOTE */}
              {showQuoteEditor && currentQuote.text && (
                <div
                  onMouseDown={handleQuoteMouseDown}
                  style={{
                    left: `${currentQuote.position.x}%`,
                    top: `${currentQuote.position.y}%`,
                    transform: 'translate(-50%, -50%)',
                    fontFamily: currentQuote.fontFamily,
                    fontSize: `${currentQuote.fontSize}px`,
                    color: currentQuote.color,
                    textAlign: currentQuote.alignment,
                    opacity: currentQuote.opacity / 100,
                    letterSpacing: `${currentQuote.spacing}px`,
                  }}
                  className={`absolute z-20 cursor-move p-3 rounded-xl hover:bg-white/10 hover:outline hover:outline-dashed hover:outline-1 hover:outline-white/35 transition-colors select-none ${
                    currentQuote.shadow ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]' : ''
                  }`}
                >
                  <p className="font-extrabold max-w-xs sm:max-w-md italic select-none">
                    "{currentQuote.text}"
                  </p>
                  {currentQuote.author && (
                    <p className="text-[0.8em] font-medium tracking-wider not-italic mt-1 text-white/80 select-none">
                      — {currentQuote.author}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Canvas Bottom Workspace Help info */}
          <div className="flex items-center justify-between text-[10px] text-[#919196]">
            <span>✓ Autosave offline ativado</span>
            {showQuoteEditor && <span>💡 Arraste a frase para reposicioná-la sobre a foto</span>}
          </div>
        </div>

        {/* Right Side: Tabbed Toolbox Side Panel */}
        <div className="w-full md:w-[360px] bg-[#121214] flex flex-col justify-between h-full">
          
          {/* Controls Tab Header */}
          <div className="grid grid-cols-4 border-b border-[#242427]">
            <button
              onClick={() => setActiveTab('adjust')}
              className={`py-3.5 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 cursor-pointer transition ${
                activeTab === 'adjust' ? 'bg-[#1C1C1F] text-blue-400 border-b-2 border-blue-500' : 'text-[#919196] hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Ajustar
            </button>
            <button
              onClick={() => setActiveTab('filters')}
              className={`py-3.5 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 cursor-pointer transition ${
                activeTab === 'filters' ? 'bg-[#1C1C1F] text-blue-400 border-b-2 border-blue-500' : 'text-[#919196] hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Filtros
            </button>
            <button
              onClick={() => setActiveTab('crop')}
              className={`py-3.5 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 cursor-pointer transition ${
                activeTab === 'crop' ? 'bg-[#1C1C1F] text-blue-400 border-b-2 border-blue-500' : 'text-[#919196] hover:text-white'
              }`}
            >
              <Crop className="w-4 h-4" />
              Cortar
            </button>
            <button
              onClick={() => setActiveTab('quote')}
              disabled={!showQuoteEditor}
              className={`py-3.5 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 cursor-pointer transition disabled:opacity-20 ${
                activeTab === 'quote' ? 'bg-[#1C1C1F] text-blue-400 border-b-2 border-blue-500' : 'text-[#919196] hover:text-white'
              }`}
            >
              <Type className="w-4 h-4" />
              Frase
            </button>
          </div>

          {/* Interactive Sliders list body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            
            {/* TAB 1: ADJUSTMENTS */}
            {activeTab === 'adjust' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Section 1: Enquadramento */}
                <div className="space-y-3.5">
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-widest text-[#919196]">Posicionamento</h3>
                  
                  {/* Zoom Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400 font-medium">
                      <span>Zoom</span>
                      <span className="text-white font-semibold">{currentParams.zoom.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.1"
                      value={currentParams.zoom}
                      onChange={(e) => handleParamChange('zoom', parseFloat(e.target.value))}
                      className="w-full accent-blue-500 h-1 bg-[#1C1C1F] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Horizontal slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400 font-medium">
                      <span>Posição Horizontal</span>
                      <span className="text-white font-semibold">{currentParams.x}%</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={currentParams.x}
                      onChange={(e) => handleParamChange('x', parseInt(e.target.value))}
                      className="w-full accent-blue-500 h-1 bg-[#1C1C1F] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Vertical slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400 font-medium">
                      <span>Posição Vertical</span>
                      <span className="text-white font-semibold">{currentParams.y}%</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={currentParams.y}
                      onChange={(e) => handleParamChange('y', parseInt(e.target.value))}
                      className="w-full accent-blue-500 h-1 bg-[#1C1C1F] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Rotation control */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-zinc-400 font-medium">
                      <span>Rotação Livre</span>
                      <span className="text-white font-semibold">{currentParams.rotation}°</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="1"
                        value={currentParams.rotation}
                        onChange={(e) => handleParamChange('rotation', parseInt(e.target.value))}
                        className="flex-1 accent-blue-500 h-1 bg-[#1C1C1F] rounded-lg appearance-none cursor-pointer"
                      />
                      <button
                        onClick={() => handleParamChange('rotation', (currentParams.rotation - 90 + 360) % 360)}
                        className="p-1.5 bg-[#1C1C1F] hover:bg-[#242427] border border-[#2E2E32] text-white rounded-lg transition cursor-pointer"
                        title="Girar 90° Esquerda"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleParamChange('rotation', (currentParams.rotation + 90) % 360)}
                        className="p-1.5 bg-[#1C1C1F] hover:bg-[#242427] border border-[#2E2E32] text-white rounded-lg transition cursor-pointer"
                        title="Girar 90° Direita"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-[#242427] my-3"></div>

                {/* Section 2: Visual Adjustments */}
                <div className="space-y-3.5">
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-widest text-[#919196]">Ajustes de Tom</h3>

                  {/* Brightness slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400 font-medium">
                      <span>Brilho</span>
                      <span className="text-white font-semibold">{currentParams.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={currentParams.brightness}
                      onChange={(e) => handleParamChange('brightness', parseInt(e.target.value))}
                      className="w-full accent-blue-500 h-1 bg-[#1C1C1F] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Contrast slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400 font-medium">
                      <span>Contraste</span>
                      <span className="text-white font-semibold">{currentParams.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={currentParams.contrast}
                      onChange={(e) => handleParamChange('contrast', parseInt(e.target.value))}
                      className="w-full accent-blue-500 h-1 bg-[#1C1C1F] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Saturation slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400 font-medium">
                      <span>Saturação</span>
                      <span className="text-white font-semibold">{currentParams.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={currentParams.saturation}
                      onChange={(e) => handleParamChange('saturation', parseInt(e.target.value))}
                      className="w-full accent-blue-500 h-1 bg-[#1C1C1F] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Temperature slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400 font-medium">
                      <span>Temperatura</span>
                      <span className="text-white font-semibold">{currentParams.temperature > 0 ? `+${currentParams.temperature}` : currentParams.temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={currentParams.temperature}
                      onChange={(e) => handleParamChange('temperature', parseInt(e.target.value))}
                      className="w-full accent-blue-500 h-1 bg-[#1C1C1F] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Exposure slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400 font-medium">
                      <span>Exposição</span>
                      <span className="text-white font-semibold">{currentParams.exposure > 0 ? `+${currentParams.exposure}` : currentParams.exposure}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={currentParams.exposure}
                      onChange={(e) => handleParamChange('exposure', parseInt(e.target.value))}
                      className="w-full accent-blue-500 h-1 bg-[#1C1C1F] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Blur slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400 font-medium">
                      <span>Desfoque</span>
                      <span className="text-white font-semibold">{currentParams.blur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={currentParams.blur}
                      onChange={(e) => handleParamChange('blur', parseInt(e.target.value))}
                      className="w-full accent-blue-500 h-1 bg-[#1C1C1F] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Dimming (Wallpaper specific darkening filter) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400 font-medium">
                      <span>Escurecer Wallpaper (Dim)</span>
                      <span className="text-white font-semibold">{currentParams.dim}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentParams.dim}
                      onChange={(e) => handleParamChange('dim', parseInt(e.target.value))}
                      className="w-full accent-blue-500 h-1 bg-[#1C1C1F] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FILTERS */}
            {activeTab === 'filters' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-[10px] font-bold text-white uppercase tracking-widest text-[#919196] mb-2">Filtros Acadêmicos</h3>
                <div className="grid grid-cols-3 gap-2.5">
                  {presetFilters.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleParamChange('filter', f.id)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center cursor-pointer ${
                        currentParams.filter === f.id
                          ? 'bg-blue-500/10 border-blue-500 text-blue-400 font-bold'
                          : 'bg-[#1C1C1F] border-[#2E2E32] text-[#919196] hover:text-white hover:border-[#434346]'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: CROPPING */}
            {activeTab === 'crop' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-[10px] font-bold text-white uppercase tracking-widest text-[#919196]">Enquadramento & Proporção</h3>

                {/* Keep Aspect Ratio toggle */}
                <div className="flex items-center justify-between p-3.5 bg-[#1C1C1F] border border-[#2E2E32] rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">Manter Proporção Original</span>
                    <span className="text-[10px] text-[#919196] block">Previne distorção acidental da foto</span>
                  </div>
                  <button
                    onClick={() => setKeepAspectRatio(!keepAspectRatio)}
                    className={`px-3 py-1.5 text-[10px] font-extrabold uppercase rounded-lg tracking-wider cursor-pointer ${
                      keepAspectRatio ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {keepAspectRatio ? 'Bloqueado' : 'Livre'}
                  </button>
                </div>

                {/* Aspect ratio presets list */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-400 block">Cortar Proporções Rápidas:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {aspectRatios.map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => {
                          let cropArea = null;
                          if (ratio === '1:1') {
                            cropArea = { x: 10, y: 10, width: 80, height: 80, aspectRatio: '1:1' };
                          } else if (ratio === '16:9') {
                            cropArea = { x: 5, y: 15, width: 90, height: 50.6, aspectRatio: '16:9' };
                          } else if (ratio === '4:3') {
                            cropArea = { x: 10, y: 10, width: 80, height: 60, aspectRatio: '4:3' };
                          } else if (ratio === '9:16') {
                            cropArea = { x: 20, y: 5, width: 60, height: 90, aspectRatio: '9:16' };
                          }
                          handleParamChange('crop', cropArea);
                        }}
                        className={`py-2 px-3 rounded-xl border text-[11px] font-bold tracking-wider transition uppercase text-center cursor-pointer ${
                          currentParams.crop?.aspectRatio === ratio
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-[#1C1C1F] border-[#2E2E32] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                    <button
                      onClick={() => handleParamChange('crop', null)}
                      className={`py-2 px-3 rounded-xl border text-[11px] font-bold tracking-wider transition uppercase text-center cursor-pointer ${
                        currentParams.crop === null
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-[#1C1C1F] border-[#2E2E32] text-zinc-400 hover:text-white'
                      }`}
                    >
                      Original
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: MOTIVATIONAL QUOTE OVERLAY EDITOR */}
            {activeTab === 'quote' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-[10px] font-bold text-white uppercase tracking-widest text-[#919196]">Frase Motivacional</h3>

                {/* Phrase Quote Text */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">Texto da Frase</label>
                  <textarea
                    value={currentQuote.text}
                    onChange={(e) => setCurrentQuote({ ...currentQuote, text: e.target.value })}
                    rows={3}
                    placeholder="Sua frase inspiradora aqui..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#242427] bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Author */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">Autor</label>
                  <input
                    type="text"
                    value={currentQuote.author}
                    onChange={(e) => setCurrentQuote({ ...currentQuote, author: e.target.value })}
                    placeholder="Friedrich Nietzsche"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#242427] bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Custom Quote Font */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">Estilo de Fonte</label>
                  <select
                    value={currentQuote.fontFamily}
                    onChange={(e) => setCurrentQuote({ ...currentQuote, fontFamily: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#242427] bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Playfair Display">Playfair Display (Premium)</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (Moderna)</option>
                    <option value="Inter">Inter (Padrão)</option>
                    <option value="Courier New">Courier New (Acadêmica)</option>
                  </select>
                </div>

                {/* Font Size slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-zinc-400 font-medium">
                    <span>Tamanho do Texto</span>
                    <span>{currentQuote.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="48"
                    value={currentQuote.fontSize}
                    onChange={(e) => setCurrentQuote({ ...currentQuote, fontSize: parseInt(e.target.value) })}
                    className="w-full accent-blue-500 h-1 bg-[#1C1C1F] rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Alignment Toggle */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Alinhamento</label>
                  <div className="grid grid-cols-3 gap-1 bg-[#1C1C1F] p-1 border border-[#2E2E32] rounded-xl">
                    <button
                      onClick={() => setCurrentQuote({ ...currentQuote, alignment: 'left' })}
                      className={`py-1 px-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer text-center ${
                        currentQuote.alignment === 'left' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Esquerda
                    </button>
                    <button
                      onClick={() => setCurrentQuote({ ...currentQuote, alignment: 'center' })}
                      className={`py-1 px-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer text-center ${
                        currentQuote.alignment === 'center' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Centro
                    </button>
                    <button
                      onClick={() => setCurrentQuote({ ...currentQuote, alignment: 'right' })}
                      className={`py-1 px-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer text-center ${
                        currentQuote.alignment === 'right' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Direita
                    </button>
                  </div>
                </div>

                {/* Text Color Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-400 block">Cor do Texto</label>
                  <div className="flex items-center gap-1.5">
                    {['#FFFFFF', '#FAF8F5', '#FFE082', '#90CAF9', '#A5D6A7', '#F48FB1'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setCurrentQuote({ ...currentQuote, color: c })}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 transition cursor-pointer hover:scale-110 ${
                          currentQuote.color === c ? 'border-blue-500 scale-105' : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Drop shadow Toggle */}
                <div className="flex items-center justify-between p-3 bg-[#1C1C1F] border border-[#2E2E32] rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">Sombra Projetada</span>
                    <span className="text-[10px] text-[#919196] block">Aumenta a legibilidade da frase</span>
                  </div>
                  <button
                    onClick={() => setCurrentQuote({ ...currentQuote, shadow: !currentQuote.shadow })}
                    className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg tracking-wider cursor-pointer ${
                      currentQuote.shadow ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {currentQuote.shadow ? 'Ativa' : 'Inativa'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Side Panel Footer Buttons */}
          <div className="p-5 border-t border-[#242427] space-y-2 bg-[#121214]">
            <button
              onClick={handleReset}
              className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-[#1C1C1F] border border-[#2E2E32] rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Original
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onClose}
                className="py-2.5 text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveClick}
                className="py-2.5 text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
