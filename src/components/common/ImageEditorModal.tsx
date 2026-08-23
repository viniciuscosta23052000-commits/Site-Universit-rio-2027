import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Move,
  FlipHorizontal,
  FlipVertical,
} from 'lucide-react';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImageUrl?: string;
  onSave: (processedDataUrl: string) => void;
  aspectRatio?: 'circle' | 'square' | 'wide' | 'free';
  title?: string;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  onClose,
  initialImageUrl = '',
  onSave,
  aspectRatio = 'free',
  title = 'Editar Imagem',
}) => {
  const [imageSrc, setImageSrc] = useState<string>(initialImageUrl);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // in degrees
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Filters state
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [grayscale, setGrayscale] = useState<number>(0);
  const [sepia, setSepia] = useState<number>(0);
  const [blur, setBlur] = useState<number>(0);

  // Dragging state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffsetStart = useRef({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load image on mount/source change
  useEffect(() => {
    if (initialImageUrl) {
      setImageSrc(initialImageUrl);
      resetControls();
    }
  }, [initialImageUrl, isOpen]);

  const resetControls = () => {
    setZoom(1);
    setRotation(0);
    setOffsetX(0);
    setOffsetY(0);
    setFlipH(false);
    setFlipV(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setGrayscale(0);
    setSepia(0);
    setBlur(0);
  };

  // Process and draw image to canvas in real-time
  useEffect(() => {
    if (!imageSrc) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      draw();
    };
    img.src = imageSrc;
  }, [imageSrc, zoom, rotation, offsetX, offsetY, flipH, flipV, brightness, contrast, saturation, grayscale, sepia, blur]);

  const draw = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !canvas.getContext) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // 1. Position canvas origin to center
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.translate(cx + offsetX, cy + offsetY);

    // 2. Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // 3. Apply flips & zoom (scale)
    const scaleX = (flipH ? -1 : 1) * zoom;
    const scaleY = (flipV ? -1 : 1) * zoom;
    ctx.scale(scaleX, scaleY);

    // 4. Apply Filters (supported in most canvas engines)
    ctx.filter = `
      brightness(${brightness}%)
      contrast(${contrast}%)
      saturate(${saturation}%)
      grayscale(${grayscale}%)
      sepia(${sepia}%)
      blur(${blur}px)
    `;

    // 5. Draw image centered
    const w = img.width;
    const h = img.height;
    // Fit image inside preview by default
    const ratio = Math.min(canvas.width / w, canvas.height / h) * 0.8;
    const dw = w * ratio;
    const dh = h * ratio;

    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);

    ctx.restore();
  };

  // Handle Dragging within Canvas for Positioning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageSrc) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragOffsetStart.current = { x: offsetX, y: offsetY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffsetX(dragOffsetStart.current.x + dx);
    setOffsetY(dragOffsetStart.current.y + dy);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch Support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!imageSrc || e.touches.length === 0) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    dragOffsetStart.current = { x: offsetX, y: offsetY };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length === 0) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;
    setOffsetX(dragOffsetStart.current.x + dx);
    setOffsetY(dragOffsetStart.current.y + dy);
  };

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageSrc(reader.result);
          resetControls();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle Drag & Drop upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageSrc(reader.result);
          resetControls();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save changes by outputting compiled Data URL
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;

    // We can directly export the canvas contents as a high-quality dataURL
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#121214] border border-[#242427] w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Left Side: Editor Area & Upload */}
        <div className="flex-1 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#242427] min-h-0 bg-[#0A0A0B]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-500" />
              {title}
            </h3>
            {imageSrc && (
              <button
                onClick={resetControls}
                className="text-[10px] uppercase font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition"
                title="Resetar todos os ajustes"
              >
                <RefreshCw className="w-3 h-3" />
                Resetar Ajustes
              </button>
            )}
          </div>

          {/* Canvas Wrapper */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex-1 min-h-[250px] md:min-h-[350px] relative rounded-xl border border-[#242427] bg-[#141416] flex items-center justify-center overflow-hidden group select-none cursor-move"
          >
            {imageSrc ? (
              <>
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={400}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleMouseUpOrLeave}
                  className="max-w-full max-h-full object-contain"
                />

                {/* Aspect Ratio Framing Guide Overlays */}
                {aspectRatio === 'circle' && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[240px] h-[240px] rounded-full border-2 border-dashed border-blue-500/60 bg-black/10 ring-[9999px] ring-black/40 shadow-inner" />
                  </div>
                )}
                {aspectRatio === 'square' && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[240px] h-[240px] border-2 border-dashed border-blue-500/60 bg-black/10 ring-[9999px] ring-black/40 shadow-inner" />
                  </div>
                )}
                {aspectRatio === 'wide' && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[85%] aspect-[16/9] border-2 border-dashed border-blue-500/60 bg-black/10 ring-[9999px] ring-black/40 shadow-inner" />
                  </div>
                )}

                {/* Mouse interaction indicator */}
                <div className="absolute bottom-3 left-3 bg-black/75 px-2.5 py-1 rounded-lg border border-[#242427] text-[10px] text-[#919196] flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition duration-150">
                  <Move className="w-3.5 h-3.5 text-blue-400" />
                  Arraste para mover a imagem
                </div>
              </>
            ) : (
              <div className="text-center p-8 flex flex-col items-center">
                <Upload className="w-10 h-10 text-[#444446] mb-3 animate-bounce" />
                <p className="text-xs font-semibold text-[#E2E2E2]">Arraste uma imagem aqui</p>
                <p className="text-[10px] text-[#919196] mt-1 mb-4">Ou clique para navegar nos seus arquivos</p>
                <button
                  onClick={triggerFileSelect}
                  className="px-4 py-2 bg-[#242427] hover:bg-[#2A2A2D] text-white text-xs font-semibold rounded-xl border border-[#2E2E32] transition cursor-pointer"
                >
                  Selecionar Arquivo
                </button>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={triggerFileSelect}
              className="px-4 py-2 bg-[#1C1C1F] hover:bg-[#242427] text-[#E2E2E2] text-xs font-semibold rounded-xl border border-[#242427] flex items-center gap-1.5 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              Trocar Imagem
            </button>
          </div>
        </div>

        {/* Right Side: Tool Panel & Adjustments */}
        <div className="w-full md:w-80 p-6 flex flex-col justify-between bg-[#121214] overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#242427]">
              <span className="text-xs font-bold text-[#E2E2E2] uppercase tracking-wider">Ajustes & Filtros</span>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-[#919196] hover:bg-[#1C1C1F] hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Position Controls */}
            {imageSrc && (
              <div className="space-y-4">
                {/* Scale (Zoom) Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-[#E2E2E2] mb-1.5">
                    <span className="flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5 text-blue-400" /> Zoom ({zoom.toFixed(1)}x)
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setZoom(Math.max(0.2, zoom - 0.1))}
                        className="p-1 bg-[#1C1C1F] rounded hover:bg-[#242427]"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setZoom(Math.min(5, zoom + 0.1))}
                        className="p-1 bg-[#1C1C1F] rounded hover:bg-[#242427]"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="5"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 bg-[#1C1C1F] h-1 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Rotation Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-[#E2E2E2] mb-1.5">
                    <span className="flex items-center gap-1">
                      <RotateCw className="w-3.5 h-3.5 text-blue-400" /> Rotação ({rotation}°)
                    </span>
                    <button
                      onClick={() => setRotation((prev) => (prev + 90) % 360)}
                      className="p-1 bg-[#1C1C1F] rounded hover:bg-[#242427] text-[10px] font-bold text-[#E2E2E2]"
                      title="Girar 90 graus"
                    >
                      +90°
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full accent-blue-500 bg-[#1C1C1F] h-1 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Flips / Mirroring */}
                <div>
                  <span className="block text-[11px] font-bold text-[#919196] uppercase mb-2">Espelhamento</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFlipH(!flipH)}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        flipH
                          ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                          : 'bg-[#1C1C1F] border-[#242427] text-[#919196] hover:text-white'
                      }`}
                    >
                      <FlipHorizontal className="w-4 h-4" /> Horizontal
                    </button>
                    <button
                      onClick={() => setFlipV(!flipV)}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        flipV
                          ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                          : 'bg-[#1C1C1F] border-[#242427] text-[#919196] hover:text-white'
                      }`}
                    >
                      <FlipVertical className="w-4 h-4" /> Vertical
                    </button>
                  </div>
                </div>

                {/* Color Filters section */}
                <div className="pt-4 border-t border-[#242427] space-y-4">
                  <span className="block text-[11px] font-bold text-[#919196] uppercase flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-400" /> Filtros de Imagem
                  </span>

                  {/* Brightness slider */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#E2E2E2] mb-1 font-medium">
                      <span>Brilho</span>
                      <span>{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="200"
                      value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      className="w-full accent-blue-500 bg-[#1C1C1F] h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Contrast slider */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#E2E2E2] mb-1 font-medium">
                      <span>Contraste</span>
                      <span>{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="200"
                      value={contrast}
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                      className="w-full accent-blue-500 bg-[#1C1C1F] h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Saturation slider */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#E2E2E2] mb-1 font-medium">
                      <span>Saturação</span>
                      <span>{saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(parseInt(e.target.value))}
                      className="w-full accent-blue-500 bg-[#1C1C1F] h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Grayscale slider */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#E2E2E2] mb-1 font-medium">
                      <span>Preto & Branco (Grayscale)</span>
                      <span>{grayscale}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={grayscale}
                      onChange={(e) => setGrayscale(parseInt(e.target.value))}
                      className="w-full accent-blue-500 bg-[#1C1C1F] h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Sepia slider */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#E2E2E2] mb-1 font-medium">
                      <span>Filtro Sepia</span>
                      <span>{sepia}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sepia}
                      onChange={(e) => setSepia(parseInt(e.target.value))}
                      className="w-full accent-blue-500 bg-[#1C1C1F] h-1 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 pt-4 border-t border-[#242427] flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-[#1C1C1F] hover:bg-[#242427] text-[#919196] hover:text-white text-xs font-semibold rounded-xl border border-[#242427] transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!imageSrc}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-[#1C1C1F] disabled:text-[#444446] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Aplicar e Salvar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
