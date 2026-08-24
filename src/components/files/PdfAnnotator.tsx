import React, { useState, useEffect, useRef } from 'react';
import { AcademicFile } from '../../types';
import { StorageService } from '../../lib/storage';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Pencil,
  Highlighter,
  Type,
  Eraser,
  Square,
  Circle,
  ArrowUpRight,
  Minus,
  StickyNote,
  CornerUpLeft,
  CornerUpRight,
  Download,
  Save,
  CheckCircle,
  RefreshCw,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Strikethrough,
  Plus,
} from 'lucide-react';
import jsPDF from 'jspdf';

interface PdfAnnotatorProps {
  file: AcademicFile;
  onClose: () => void;
}

// earth and pastel highlighter colors
const HIGHLIGHTER_COLORS = [
  { name: 'Bege', color: '#F5F2EB', rgba: 'rgba(245, 242, 235, 0.45)' },
  { name: 'Areia', color: '#E6DFD3', rgba: 'rgba(230, 223, 211, 0.45)' },
  { name: 'Terracota', color: '#D3A393', rgba: 'rgba(211, 163, 147, 0.45)' },
  { name: 'Marrom claro', color: '#CBBBA9', rgba: 'rgba(203, 187, 169, 0.45)' },
  { name: 'Caramelo', color: '#E5C09B', rgba: 'rgba(229, 192, 155, 0.45)' },
  { name: 'Rosé', color: '#EAD5D3', rgba: 'rgba(234, 213, 211, 0.45)' },
  { name: 'Rosa pastel', color: '#F3D1D9', rgba: 'rgba(243, 209, 217, 0.45)' },
  { name: 'Pêssego', color: '#F7D6C8', rgba: 'rgba(247, 214, 200, 0.45)' },
  { name: 'Amarelo pastel', color: '#FDF3C7', rgba: 'rgba(253, 243, 199, 0.45)' },
  { name: 'Verde sálvia', color: '#D6E4DB', rgba: 'rgba(214, 228, 219, 0.45)' },
  { name: 'Verde oliva claro', color: '#E4E7C8', rgba: 'rgba(228, 231, 200, 0.45)' },
  { name: 'Azul pastel', color: '#D5E4EB', rgba: 'rgba(213, 228, 235, 0.45)' },
  { name: 'Lavanda', color: '#E4DBEC', rgba: 'rgba(228, 219, 236, 0.45)' },
];

// text and drawing standard colors
const DRAWING_COLORS = [
  { name: 'Preto', color: '#0A0A0B' },
  { name: 'Branco', color: '#FFFFFF' },
  { name: 'Vermelho', color: '#EF4444' },
  { name: 'Laranja', color: '#F97316' },
  { name: 'Amarelo', color: '#EAB308' },
  { name: 'Verde', color: '#22C55E' },
  { name: 'Azul', color: '#3B82F6' },
  { name: 'Roxo', color: '#A855F7' },
  { name: 'Rosa', color: '#EC4899' },
  { name: 'Terracota', color: '#C08A7C' },
  { name: 'Verde sálvia', color: '#8FBC8F' },
];

const FONTS = [
  { name: 'Plus Jakarta', value: 'Plus Jakarta Sans' },
  { name: 'Serif Display', value: 'Playfair Display' },
  { name: 'Handwriting', value: 'Caveat' },
  { name: 'Mono Code', value: 'JetBrains Mono' },
  { name: 'Montserrat', value: 'Montserrat' },
  { name: 'Amatic', value: 'Amatic SC' },
];

export interface PdfAnnotation {
  id: string;
  page: number;
  type: 'drawing' | 'highlight' | 'text' | 'shape' | 'note';
  points?: { x: number; y: number }[];
  color?: string;
  width?: number;
  opacity?: number;
  x?: number;
  y?: number;
  widthBox?: number;
  heightBox?: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  align?: 'left' | 'center' | 'right';
  shapeType?: 'line' | 'arrow' | 'rect' | 'circle' | 'underline' | 'strikeout';
  endX?: number;
  endY?: number;
}

export const PdfAnnotator: React.FC<PdfAnnotatorProps> = ({ file, onClose }) => {
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.25);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Annotation states
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([]);
  const [history, setHistory] = useState<PdfAnnotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedAnnoId, setSelectedAnnoId] = useState<string | null>(null);

  // Active styles
  const [activeTool, setActiveTool] = useState<
    'select' | 'text' | 'pencil' | 'highlighter' | 'eraser' | 'shape' | 'note'
  >('select');
  const [drawingColor, setDrawingColor] = useState('#EF4444');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [highlighterColorRgba, setHighlighterColorRgba] = useState('rgba(253, 243, 199, 0.45)');
  const [highlighterWidth, setHighlighterWidth] = useState(20);
  const [activeShapeType, setActiveShapeType] = useState<'line' | 'arrow' | 'rect' | 'circle' | 'underline' | 'strikeout'>('rect');

  // Active text properties
  const [textFont, setTextFont] = useState('Plus Jakarta Sans');
  const [textSize, setTextSize] = useState(16);
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);
  const [textStrike, setTextStrike] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Drawing mouse track states
  const [activeDrawingPoints, setActiveDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [activeDrawingStroke, setActiveDrawingStroke] = useState<PdfAnnotation | null>(null);
  const [tempShape, setTempShape] = useState<PdfAnnotation | null>(null);

  // Dragging and resizing HTML annotations
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, annoX: 0, annoY: 0 });
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, annoW: 0, annoH: 0 });

  const convertDataURIToBinary = (dataURI: string) => {
    try {
      const base64Index = dataURI.indexOf(';base64,');
      if (base64Index === -1) return null;
      const base64 = dataURI.substring(base64Index + ';base64,'.length);
      const raw = window.atob(base64);
      const rawLength = raw.length;
      const array = new Uint8Array(new ArrayBuffer(rawLength));
      for (let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
      }
      return array;
    } catch (e) {
      console.error('Failed to parse data URI to binary:', e);
      return null;
    }
  };

  // Load PDF.js from CDN dynamically
  useEffect(() => {
    let isMounted = true;
    const loadPdf = async () => {
      try {
        setLoading(true);
        setErrorMsg('');

        // 1. Get window.pdfjsLib
        const pdfjsLib = await loadPdfJsScript();
        if (!isMounted) return;

        // 2. Load pdf document
        let documentLoadingTask;
        if (file.url.startsWith('data:')) {
          const binaryData = convertDataURIToBinary(file.url);
          if (binaryData) {
            documentLoadingTask = pdfjsLib.getDocument({ data: binaryData });
          } else {
            documentLoadingTask = pdfjsLib.getDocument(file.url);
          }
        } else {
          documentLoadingTask = pdfjsLib.getDocument(file.url);
        }

        const doc = await documentLoadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to load PDF file:', err);
        if (isMounted) {
          setErrorMsg('Erro ao renderizar o PDF. Verifique se o arquivo está acessível ou se o formato é válido.');
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [file.id, file.url]);

  // Load saved annotations from file model
  useEffect(() => {
    if (file && file.annotations) {
      try {
        const parsed = JSON.parse(file.annotations);
        if (Array.isArray(parsed)) {
          setAnnotations(parsed);
          setHistory([parsed]);
          setHistoryIndex(0);
        }
      } catch (e) {
        console.warn('Failed to parse saved annotations:', e);
      }
    } else {
      setAnnotations([]);
      setHistory([[]]);
      setHistoryIndex(0);
    }
    setCurrentPage(1);
  }, [file.id]);

  // Render page when currentPage or zoom changes
  useEffect(() => {
    if (pdfDoc && !loading) {
      renderPdfPage();
    }
  }, [pdfDoc, currentPage, zoom, loading, annotations]);

  // Handle PDF.js loading
  const loadPdfJsScript = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjsLib);
      };
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  };

  const renderPdfPage = async () => {
    try {
      if (!pdfDoc) return;

      // Cancel any ongoing rendering tasks first to prevent canvas multi-render collisions
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // Ignore cancellation errors
        }
        renderTaskRef.current = null;
      }

      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoom });

      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render original PDF page onto canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      try {
        await renderTask.promise;
      } catch (err: any) {
        if (err && (err.name === 'HeadingStatus' || err.name === 'RenderingCancelledException' || err.message?.includes('cancelled'))) {
          // Ignore cancellation errors
          return;
        }
        throw err;
      } finally {
        if (renderTaskRef.current === renderTask) {
          renderTaskRef.current = null;
        }
      }

      // Sync and render overlay drawings canvas
      const annoCanvas = annotationCanvasRef.current;
      if (annoCanvas) {
        annoCanvas.width = viewport.width;
        annoCanvas.height = viewport.height;
        drawOverlayAnnotations(annoCanvas, currentPage, zoom);
      }
    } catch (err) {
      console.error('Error rendering PDF page:', err);
    }
  };

  const drawOverlayAnnotations = (canvas: HTMLCanvasElement, pageNum: number, scale: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pageAnnos = annotations.filter((a) => a.page === pageNum);

    pageAnnos.forEach((anno) => {
      if (anno.type === 'drawing' || anno.type === 'highlight') {
        if (!anno.points || anno.points.length === 0) return;
        ctx.save();
        if (anno.type === 'highlight') {
          ctx.globalCompositeOperation = 'multiply';
        }
        ctx.beginPath();
        ctx.strokeStyle = anno.color || '#EF4444';
        ctx.lineWidth = (anno.width || 3) * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const firstPoint = anno.points[0];
        ctx.moveTo(firstPoint.x * scale, firstPoint.y * scale);
        for (let i = 1; i < anno.points.length; i++) {
          ctx.lineTo(anno.points[i].x * scale, anno.points[i].y * scale);
        }
        ctx.stroke();
        ctx.restore();
      } else if (anno.type === 'shape') {
        ctx.beginPath();
        ctx.strokeStyle = anno.color || '#EF4444';
        ctx.lineWidth = (anno.width || 3) * scale;
        ctx.lineCap = 'round';

        const startX = anno.x! * scale;
        const startY = anno.y! * scale;
        const endX = anno.endX! * scale;
        const endY = anno.endY! * scale;

        if (anno.shapeType === 'line') {
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        } else if (anno.shapeType === 'rect') {
          ctx.strokeRect(startX, startY, endX - startX, endY - startY);
        } else if (anno.shapeType === 'circle') {
          const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
          ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (anno.shapeType === 'arrow') {
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // draw arrowhead
          const angle = Math.atan2(endY - startY, endX - startX);
          const arrowLength = 15 * scale;
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowLength * Math.cos(angle - Math.PI / 6),
            endY - arrowLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            endX - arrowLength * Math.cos(angle + Math.PI / 6),
            endY - arrowLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = anno.color || '#EF4444';
          ctx.fill();
        } else if (anno.shapeType === 'underline' || anno.shapeType === 'strikeout') {
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, startY);
          ctx.stroke();
        }
      }
    });
  };

  // Auto-saves state in storage database
  const autoSaveAnnotations = (currentAnnos: PdfAnnotation[]) => {
    setSavingStatus('saving');
    try {
      StorageService.update((draft) => {
        const targetFile = draft.files.find((f) => f.id === file.id);
        if (targetFile) {
          targetFile.annotations = JSON.stringify(currentAnnos);
          targetFile.updatedAt = new Date().toISOString();
        }
      });
      setTimeout(() => {
        setSavingStatus('saved');
      }, 500);
    } catch (err) {
      console.error('Error saving annotations automatically:', err);
      setSavingStatus('error');
    }
  };

  // History operations (Undo/Redo)
  const pushToHistory = (newAnnos: PdfAnnotation[]) => {
    const trimmedHistory = history.slice(0, historyIndex + 1);
    trimmedHistory.push(newAnnos);
    setHistory(trimmedHistory);
    setHistoryIndex(trimmedHistory.length - 1);
    autoSaveAnnotations(newAnnos);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      setHistoryIndex(targetIndex);
      const targetAnnos = history[targetIndex];
      setAnnotations(targetAnnos);
      autoSaveAnnotations(targetAnnos);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      setHistoryIndex(targetIndex);
      const targetAnnos = history[targetIndex];
      setAnnotations(targetAnnos);
      autoSaveAnnotations(targetAnnos);
    }
  };

  const handleClearAllPageAnnotations = () => {
    if (confirm('Deseja apagar todas as anotações e desenhos desta página?')) {
      const remaining = annotations.filter((a) => a.page !== currentPage);
      setAnnotations(remaining);
      pushToHistory(remaining);
    }
  };

  // Drawing events mapping
  const handleCanvasPointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;

    if (activeTool === 'pencil' || activeTool === 'highlighter') {
      const isHigh = activeTool === 'highlighter';
      const initialPoints = [{ x: mouseX, y: mouseY }];
      setActiveDrawingPoints(initialPoints);

      const strokeId = `stroke-${Date.now()}`;
      setActiveDrawingStroke({
        id: strokeId,
        page: currentPage,
        type: isHigh ? 'highlight' : 'drawing',
        points: initialPoints,
        color: isHigh ? highlighterColorRgba : drawingColor,
        width: isHigh ? highlighterWidth : strokeWidth,
      });
    } else if (activeTool === 'shape') {
      setTempShape({
        id: `shape-${Date.now()}`,
        page: currentPage,
        type: 'shape',
        shapeType: activeShapeType,
        x: mouseX,
        y: mouseY,
        endX: mouseX,
        endY: mouseY,
        color: drawingColor,
        width: strokeWidth,
      });
    } else if (activeTool === 'eraser') {
      deleteClosestAnnotation(mouseX, mouseY);
    } else if (activeTool === 'text') {
      // Add text at click position
      const textId = `text-${Date.now()}`;
      const newTextAnno: PdfAnnotation = {
        id: textId,
        page: currentPage,
        type: 'text',
        x: mouseX,
        y: mouseY,
        widthBox: 220,
        heightBox: 80,
        text: 'Dê dois cliques para digitar...',
        color: drawingColor,
        fontFamily: textFont,
        fontSize: textSize,
        fontWeight: textBold ? 'bold' : 'normal',
        fontStyle: textItalic ? 'italic' : 'normal',
        textDecoration: textUnderline ? 'underline' : textStrike ? 'line-through' : 'none',
        align: textAlign,
      };

      const nextAnnos = [...annotations, newTextAnno];
      setAnnotations(nextAnnos);
      setSelectedAnnoId(textId);
      pushToHistory(nextAnnos);
      setActiveTool('select');
    } else if (activeTool === 'note') {
      // Add yellow comment bubble/note
      const noteId = `note-${Date.now()}`;
      const newNoteAnno: PdfAnnotation = {
        id: noteId,
        page: currentPage,
        type: 'note',
        x: mouseX,
        y: mouseY,
        text: 'Minha anotação: escreva algo aqui...',
        color: '#FEF08A', // Tailwind yellow-200 post-it tone
      };

      const nextAnnos = [...annotations, newNoteAnno];
      setAnnotations(nextAnnos);
      setSelectedAnnoId(noteId);
      pushToHistory(nextAnnos);
      setActiveTool('select');
    }
  };

  const handleCanvasPointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;

    if (activeDrawingStroke && activeTool !== 'select') {
      const nextPoints = [...activeDrawingPoints, { x: mouseX, y: mouseY }];
      setActiveDrawingPoints(nextPoints);
      setActiveDrawingStroke({
        ...activeDrawingStroke,
        points: nextPoints,
      });

      // Quick screen update
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawOverlayAnnotations(canvas, currentPage, zoom);

        ctx.save();
        if (activeDrawingStroke.type === 'highlight') {
          ctx.globalCompositeOperation = 'multiply';
        }
        ctx.beginPath();
        ctx.strokeStyle = activeDrawingStroke.color || '#EF4444';
        ctx.lineWidth = (activeDrawingStroke.width || 3) * zoom;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(nextPoints[0].x * zoom, nextPoints[0].y * zoom);
        for (let i = 1; i < nextPoints.length; i++) {
          ctx.lineTo(nextPoints[i].x * zoom, nextPoints[i].y * zoom);
        }
        ctx.stroke();
        ctx.restore();
      }
    } else if (tempShape && activeTool === 'shape') {
      const updatedShape = {
        ...tempShape,
        endX: mouseX,
        endY: mouseY,
      };
      setTempShape(updatedShape);

      // Draw in real-time
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawOverlayAnnotations(canvas, currentPage, zoom);

        ctx.beginPath();
        ctx.strokeStyle = updatedShape.color || '#EF4444';
        ctx.lineWidth = (updatedShape.width || 3) * zoom;
        ctx.lineCap = 'round';

        const sX = updatedShape.x! * zoom;
        const sY = updatedShape.y! * zoom;
        const eX = mouseX * zoom;
        const eY = mouseY * zoom;

        if (updatedShape.shapeType === 'line') {
          ctx.moveTo(sX, sY);
          ctx.lineTo(eX, eY);
          ctx.stroke();
        } else if (updatedShape.shapeType === 'rect') {
          ctx.strokeRect(sX, sY, eX - sX, eY - sY);
        } else if (updatedShape.shapeType === 'circle') {
          const radius = Math.sqrt(Math.pow(eX - sX, 2) + Math.pow(eY - sY, 2));
          ctx.arc(sX, sY, radius, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (updatedShape.shapeType === 'arrow') {
          ctx.moveTo(sX, sY);
          ctx.lineTo(eX, eY);
          ctx.stroke();

          const angle = Math.atan2(eY - sY, eX - sX);
          const arrowLength = 15 * zoom;
          ctx.beginPath();
          ctx.moveTo(eX, eY);
          ctx.lineTo(
            eX - arrowLength * Math.cos(angle - Math.PI / 6),
            eY - arrowLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            eX - arrowLength * Math.cos(angle + Math.PI / 6),
            eY - arrowLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = updatedShape.color || '#EF4444';
          ctx.fill();
        } else if (updatedShape.shapeType === 'underline' || updatedShape.shapeType === 'strikeout') {
          ctx.moveTo(sX, sY);
          ctx.lineTo(eX, sY);
          ctx.stroke();
        }
      }
    }
  };

  const handleCanvasPointerUp = () => {
    if (activeDrawingStroke) {
      const nextAnnos = [...annotations, activeDrawingStroke];
      setAnnotations(nextAnnos);
      setActiveDrawingStroke(null);
      setActiveDrawingPoints([]);
      pushToHistory(nextAnnos);
    } else if (tempShape) {
      const nextAnnos = [...annotations, tempShape];
      setAnnotations(nextAnnos);
      setTempShape(null);
      pushToHistory(nextAnnos);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select') return; // Allow page scrolling
    e.preventDefault();
    const touch = e.touches[0];
    const pseudoEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
    } as React.MouseEvent<HTMLCanvasElement>;
    handleCanvasPointerDown(pseudoEvent);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select') return;
    e.preventDefault();
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const pseudoEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
    } as React.MouseEvent<HTMLCanvasElement>;
    handleCanvasPointerMove(pseudoEvent);
  };

  const handleTouchEnd = () => {
    if (activeTool === 'select') return;
    handleCanvasPointerUp();
  };

  // Smart Eraser algorithm to clear clicked annotation
  const deleteClosestAnnotation = (mx: number, my: number) => {
    const THRESHOLD = 16; // tolerance radius

    const match = annotations.find((anno) => {
      if (anno.page !== currentPage) return false;

      if (anno.type === 'drawing' || anno.type === 'highlight') {
        return anno.points?.some((p) => {
          const d = Math.sqrt(Math.pow(p.x - mx, 2) + Math.pow(p.y - my, 2));
          return d < THRESHOLD;
        });
      } else if (anno.type === 'text') {
        const w = anno.widthBox || 220;
        const h = anno.heightBox || 80;
        return mx >= anno.x! && mx <= anno.x! + w && my >= anno.y! && my <= anno.y! + h;
      } else if (anno.type === 'note') {
        return mx >= anno.x! && mx <= anno.x! + 40 && my >= anno.y! && my <= anno.y! + 40;
      } else if (anno.type === 'shape') {
        const dStart = Math.sqrt(Math.pow(anno.x! - mx, 2) + Math.pow(anno.y! - my, 2));
        const dEnd = Math.sqrt(Math.pow(anno.endX! - mx, 2) + Math.pow(anno.endY! - my, 2));
        const midX = (anno.x! + anno.endX!) / 2;
        const midY = (anno.y! + anno.endY!) / 2;
        const dMid = Math.sqrt(Math.pow(midX - mx, 2) + Math.pow(midY - my, 2));
        return dStart < THRESHOLD || dEnd < THRESHOLD || dMid < THRESHOLD;
      }
      return false;
    });

    if (match) {
      const filtered = annotations.filter((a) => a.id !== match.id);
      setAnnotations(filtered);
      pushToHistory(filtered);
      if (selectedAnnoId === match.id) setSelectedAnnoId(null);
    }
  };

  // Draggable Text and Note Annotations Events
  const handleTextDragStart = (e: React.MouseEvent, id: string, curX: number, curY: number) => {
    e.stopPropagation();
    setSelectedAnnoId(id);
    setDraggingId(id);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      annoX: curX,
      annoY: curY,
    });
  };

  const handleTextDragMove = (e: React.MouseEvent) => {
    if (draggingId) {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;

      setAnnotations((prev) =>
        prev.map((anno) => {
          if (anno.id === draggingId) {
            return {
              ...anno,
              x: dragStart.annoX + dx,
              y: dragStart.annoY + dy,
            };
          }
          return anno;
        })
      );
    } else if (resizingId) {
      const dx = (e.clientX - resizeStart.x) / zoom;
      const dy = (e.clientY - resizeStart.y) / zoom;

      setAnnotations((prev) =>
        prev.map((anno) => {
          if (anno.id === resizingId) {
            return {
              ...anno,
              widthBox: Math.max(80, resizeStart.annoW + dx),
              heightBox: Math.max(40, resizeStart.annoH + dy),
            };
          }
          return anno;
        })
      );
    }
  };

  const handleTextDragEnd = () => {
    if (draggingId || resizingId) {
      setDraggingId(null);
      setResizingId(null);
      pushToHistory(annotations);
    }
  };

  // Handle Touch equivalent dragging for mobile
  const handleTextTouchStart = (e: React.TouchEvent, id: string, curX: number, curY: number) => {
    e.stopPropagation();
    setSelectedAnnoId(id);
    setDraggingId(id);
    const touch = e.touches[0];
    setDragStart({
      x: touch.clientX,
      y: touch.clientY,
      annoX: curX,
      annoY: curY,
    });
  };

  const handleTextTouchMove = (e: React.TouchEvent) => {
    if (!draggingId) return;
    const touch = e.touches[0];
    const dx = (touch.clientX - dragStart.x) / zoom;
    const dy = (touch.clientY - dragStart.y) / zoom;

    setAnnotations((prev) =>
      prev.map((anno) => {
        if (anno.id === draggingId) {
          return {
            ...anno,
            x: dragStart.annoX + dx,
            y: dragStart.annoY + dy,
          };
        }
        return anno;
      })
    );
  };

  const updateAnnotationText = (id: string, text: string) => {
    const updated = annotations.map((anno) => {
      if (anno.id === id) {
        return { ...anno, text };
      }
      return anno;
    });
    setAnnotations(updated);
    // Silent autosave on input changes, then push history on blur
  };

  const handleAnnotationBlur = () => {
    pushToHistory(annotations);
  };

  const handleDeleteAnnotation = (id: string) => {
    const filtered = annotations.filter((a) => a.id !== id);
    setAnnotations(filtered);
    setSelectedAnnoId(null);
    pushToHistory(filtered);
  };

  // Multi-page high fidelity canvas compiler & PDF Exporter
  const handleExportAnnotatedPdf = async () => {
    if (!pdfDoc) return;
    setSavingStatus('saving');

    try {
      const pdfjsLib = await loadPdfJsScript();
      const exportScale = 2.0; // Ultra high crisp resolution for print-quality exports
      let docPdf: jsPDF | null = null;

      // Loop through each original page
      for (let pNum = 1; pNum <= numPages; pNum++) {
        const page = await pdfDoc.getPage(pNum);
        const viewport = page.getViewport({ scale: exportScale });

        // Create virtual compiler canvas
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = viewport.width;
        exportCanvas.height = viewport.height;
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) continue;

        // 1. Draw PDF original onto virtual canvas
        await page.render({
          canvasContext: ctx,
          viewport: viewport,
        }).promise;

        // 2. Draw drawings and shapes onto compiler canvas
        const pageAnnos = annotations.filter((a) => a.page === pNum);
        pageAnnos.forEach((anno) => {
          if (anno.type === 'drawing' || anno.type === 'highlight') {
            if (!anno.points || anno.points.length === 0) return;
            ctx.save();
            if (anno.type === 'highlight') {
              ctx.globalCompositeOperation = 'multiply';
            }
            ctx.beginPath();
            ctx.strokeStyle = anno.color || '#EF4444';
            ctx.lineWidth = (anno.width || 3) * exportScale;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.moveTo(anno.points[0].x * exportScale, anno.points[0].y * exportScale);
            for (let i = 1; i < anno.points.length; i++) {
              ctx.lineTo(anno.points[i].x * exportScale, anno.points[i].y * exportScale);
            }
            ctx.stroke();
            ctx.restore();
          } else if (anno.type === 'shape') {
            ctx.beginPath();
            ctx.strokeStyle = anno.color || '#EF4444';
            ctx.lineWidth = (anno.width || 3) * exportScale;
            ctx.lineCap = 'round';

            const startX = anno.x! * exportScale;
            const startY = anno.y! * exportScale;
            const endX = anno.endX! * exportScale;
            const endY = anno.endY! * exportScale;

            if (anno.shapeType === 'line') {
              ctx.moveTo(startX, startY);
              ctx.lineTo(endX, endY);
              ctx.stroke();
            } else if (anno.shapeType === 'rect') {
              ctx.strokeRect(startX, startY, endX - startX, endY - startY);
            } else if (anno.shapeType === 'circle') {
              const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
              ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
              ctx.stroke();
            } else if (anno.shapeType === 'arrow') {
              ctx.moveTo(startX, startY);
              ctx.lineTo(endX, endY);
              ctx.stroke();

              const angle = Math.atan2(endY - startY, endX - startX);
              const arrowLength = 15 * exportScale;
              ctx.beginPath();
              ctx.moveTo(endX, endY);
              ctx.lineTo(
                endX - arrowLength * Math.cos(angle - Math.PI / 6),
                endY - arrowLength * Math.sin(angle - Math.PI / 6)
              );
              ctx.lineTo(
                endX - arrowLength * Math.cos(angle + Math.PI / 6),
                endY - arrowLength * Math.sin(angle + Math.PI / 6)
              );
              ctx.closePath();
              ctx.fillStyle = anno.color || '#EF4444';
              ctx.fill();
            } else if (anno.shapeType === 'underline' || anno.shapeType === 'strikeout') {
              ctx.moveTo(startX, startY);
              ctx.lineTo(endX, startY);
              ctx.stroke();
            }
          } else if (anno.type === 'text') {
            // Render text overlays cleanly onto canvas
            ctx.save();
            ctx.beginPath();

            const fSize = (anno.fontSize || 16) * exportScale;
            const fWeight = anno.fontWeight || 'normal';
            const fStyle = anno.fontStyle || 'normal';
            const fFamily = anno.fontFamily || 'Plus Jakarta Sans';

            ctx.font = `${fStyle} ${fWeight} ${fSize}px "${fFamily}"`;
            ctx.fillStyle = anno.color || '#EF4444';
            ctx.textBaseline = 'top';

            const startX = anno.x! * exportScale;
            const startY = anno.y! * exportScale;
            const maxW = (anno.widthBox || 220) * exportScale;

            // Multiline wrapping
            const words = (anno.text || '').split(' ');
            let line = '';
            const lines = [];

            for (let n = 0; n < words.length; n++) {
              const testLine = line + words[n] + ' ';
              const metrics = ctx.measureText(testLine);
              const testWidth = metrics.width;
              if (testWidth > maxW && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
              } else {
                line = testLine;
              }
            }
            lines.push(line);

            const lineHeight = fSize * 1.3;
            lines.forEach((lineText, idx) => {
              let printX = startX;
              const lineW = ctx.measureText(lineText.trim()).width;

              if (anno.align === 'center') {
                printX = startX + (maxW - lineW) / 2;
              } else if (anno.align === 'right') {
                printX = startX + maxW - lineW;
              }

              ctx.fillText(lineText.trim(), printX, startY + idx * lineHeight);

              if (anno.textDecoration === 'underline') {
                ctx.beginPath();
                ctx.strokeStyle = anno.color || '#EF4444';
                ctx.lineWidth = Math.max(1, exportScale);
                ctx.moveTo(printX, startY + idx * lineHeight + fSize + 2);
                ctx.lineTo(printX + lineW, startY + idx * lineHeight + fSize + 2);
                ctx.stroke();
              } else if (anno.textDecoration === 'line-through') {
                ctx.beginPath();
                ctx.strokeStyle = anno.color || '#EF4444';
                ctx.lineWidth = Math.max(1, exportScale);
                ctx.moveTo(printX, startY + idx * lineHeight + fSize / 2 + 1);
                ctx.lineTo(printX + lineW, startY + idx * lineHeight + fSize / 2 + 1);
                ctx.stroke();
              }
            });

            ctx.restore();
          } else if (anno.type === 'note') {
            // Sticky Note bubble icon representation
            ctx.save();
            const startX = anno.x! * exportScale;
            const startY = anno.y! * exportScale;
            const noteSize = 24 * exportScale;

            ctx.fillStyle = '#FEF08A'; // Yellow post-it base
            ctx.strokeStyle = '#CA8A04'; // yellow-600 border
            ctx.lineWidth = 1 * exportScale;

            // Draw sticky note card
            ctx.fillRect(startX, startY, noteSize, noteSize);
            ctx.strokeRect(startX, startY, noteSize, noteSize);

            // Small dog-ear folding corner
            ctx.fillStyle = '#FDE047';
            ctx.beginPath();
            ctx.moveTo(startX + noteSize - 5 * exportScale, startY + noteSize);
            ctx.lineTo(startX + noteSize, startY + noteSize - 5 * exportScale);
            ctx.lineTo(startX + noteSize, startY + noteSize);
            ctx.closePath();
            ctx.fill();

            // Text content snippet
            ctx.font = `600 ${8 * exportScale}px sans-serif`;
            ctx.fillStyle = '#854D0E';
            ctx.fillText('NOTE', startX + 3 * exportScale, startY + 4 * exportScale);

            ctx.restore();
          }
        });

        // Convert the rendered page canvas to Jpeg
        const pageDataUrl = exportCanvas.toDataURL('image/jpeg', 0.95);

        // Append to jsPDF document page
        const pWidth = viewport.width / exportScale;
        const pHeight = viewport.height / exportScale;
        const pOrientation = pWidth > pHeight ? 'l' : 'p';

        if (pNum === 1) {
          docPdf = new jsPDF({
            orientation: pOrientation,
            unit: 'px',
            format: [pWidth, pHeight],
          });
        } else if (docPdf) {
          docPdf.addPage([pWidth, pHeight], pOrientation);
        }

        if (docPdf) {
          docPdf.addImage(pageDataUrl, 'JPEG', 0, 0, pWidth, pHeight);
        }
      }

      if (docPdf) {
        const cleanName = file.name.endsWith('.pdf') ? file.name.slice(0, -4) : file.name;
        docPdf.save(`${cleanName}_anotado.pdf`);
      }
      setSavingStatus('saved');
    } catch (err) {
      console.error('Failed to compile and export PDF:', err);
      setSavingStatus('error');
    }
  };

  // Helpers to customize current selected annotations properties
  const updateSelectedAnnoStyle = (props: Partial<PdfAnnotation>) => {
    if (!selectedAnnoId) return;
    const next = annotations.map((anno) => {
      if (anno.id === selectedAnnoId) {
        return { ...anno, ...props };
      }
      return anno;
    });
    setAnnotations(next);
    pushToHistory(next);
  };

  const getSelectedAnnotation = () => {
    return annotations.find((a) => a.id === selectedAnnoId);
  };

  const selectedAnno = getSelectedAnnotation();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0A0A0B] text-[#EDEDED] select-none" onMouseMove={handleTextDragMove} onMouseUp={handleTextDragEnd}>
      {/* 1. Header and Meta Info */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#121214] border-b border-[#242427] z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 shrink-0">
            <CheckCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white truncate">{file.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-[#919196]">Anotando página {currentPage} de {numPages || '...'}</span>
              <span className="text-[#242427] text-xs">•</span>
              {savingStatus === 'saving' && (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  Salvando...
                </span>
              )}
              {savingStatus === 'saved' && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Salvo
                </span>
              )}
              {savingStatus === 'error' && (
                <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-medium">
                  Erro ao salvar
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-[#1C1C1F] border border-[#242427] rounded-xl p-0.5 gap-0.5">
            <button
              onClick={() => setZoom(Math.max(0.75, zoom - 0.25))}
              className="p-1.5 hover:bg-[#242427] rounded-lg text-[#919196] hover:text-white transition cursor-pointer"
              title="Afastar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold px-1.5 text-white min-w-[40px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(3.0, zoom + 0.25))}
              className="p-1.5 hover:bg-[#242427] rounded-lg text-[#919196] hover:text-white transition cursor-pointer"
              title="Aproximar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleExportAnnotatedPdf}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            title="Exportar PDF com as anotações"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar PDF</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-[#919196] hover:text-white hover:bg-[#1C1C1F] rounded-xl transition cursor-pointer"
            title="Fechar Editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Tools & Styles Toolbar Dock */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-[#161618] border-b border-[#242427] gap-3 z-10 shrink-0">
        <div className="flex items-center flex-wrap gap-1.5">
          {/* Active Tool selection */}
          <button
            onClick={() => {
              setActiveTool('select');
              setSelectedAnnoId(null);
            }}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              activeTool === 'select'
                ? 'bg-blue-600 text-white border-blue-600 font-bold'
                : 'bg-[#1C1C1F] border-[#242427] text-[#919196] hover:text-white hover:bg-[#242427]'
            }`}
            title="Selecionar / Mover"
          >
            <span className="text-xs font-bold px-1 block">Mover</span>
          </button>

          <div className="w-[1px] h-6 bg-[#242427] mx-1"></div>

          {/* Texts and Notes Category */}
          <button
            onClick={() => {
              setActiveTool('text');
              setSelectedAnnoId(null);
            }}
            className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
              activeTool === 'text'
                ? 'bg-blue-600 text-white border-blue-600 font-bold'
                : 'bg-[#1C1C1F] border-[#242427] text-[#919196] hover:text-white hover:bg-[#242427]'
            }`}
            title="Adicionar Caixa de Texto"
          >
            <Type className="w-4 h-4" />
            <span className="text-xs font-semibold hidden md:inline">Texto</span>
          </button>

          <button
            onClick={() => {
              setActiveTool('note');
              setSelectedAnnoId(null);
            }}
            className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
              activeTool === 'note'
                ? 'bg-blue-600 text-white border-blue-600 font-bold'
                : 'bg-[#1C1C1F] border-[#242427] text-[#919196] hover:text-white hover:bg-[#242427]'
            }`}
            title="Adicionar Adesivo de Anotação"
          >
            <StickyNote className="w-4 h-4" />
            <span className="text-xs font-semibold hidden md:inline">Adesivo</span>
          </button>

          <div className="w-[1px] h-6 bg-[#242427] mx-1"></div>

          {/* Drawing and Marker Category */}
          <button
            onClick={() => {
              setActiveTool('pencil');
              setSelectedAnnoId(null);
            }}
            className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
              activeTool === 'pencil'
                ? 'bg-blue-600 text-white border-blue-600 font-bold'
                : 'bg-[#1C1C1F] border-[#242427] text-[#919196] hover:text-white hover:bg-[#242427]'
            }`}
            title="Lápis / Desenho livre"
          >
            <Pencil className="w-4 h-4" />
            <span className="text-xs font-semibold hidden md:inline">Lápis</span>
          </button>

          <button
            onClick={() => {
              setActiveTool('highlighter');
              setSelectedAnnoId(null);
            }}
            className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
              activeTool === 'highlighter'
                ? 'bg-blue-600 text-white border-blue-600 font-bold'
                : 'bg-[#1C1C1F] border-[#242427] text-[#919196] hover:text-white hover:bg-[#242427]'
            }`}
            title="Marca-texto"
          >
            <Highlighter className="w-4 h-4" />
            <span className="text-xs font-semibold hidden md:inline">Marca-Texto</span>
          </button>

          <button
            onClick={() => {
              setActiveTool('eraser');
              setSelectedAnnoId(null);
            }}
            className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
              activeTool === 'eraser'
                ? 'bg-red-600/20 text-red-400 border-red-500/30 font-bold'
                : 'bg-[#1C1C1F] border-[#242427] text-[#919196] hover:text-white hover:bg-[#242427]'
            }`}
            title="Borracha (apaga o item clicado)"
          >
            <Eraser className="w-4 h-4" />
            <span className="text-xs font-semibold hidden md:inline">Borracha</span>
          </button>

          <div className="w-[1px] h-6 bg-[#242427] mx-1"></div>

          {/* Shapes Category */}
          <div className="flex items-center bg-[#1C1C1F] border border-[#242427] rounded-xl p-0.5">
            <button
              onClick={() => {
                setActiveTool('shape');
                setActiveShapeType('rect');
              }}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                activeTool === 'shape' && activeShapeType === 'rect' ? 'bg-[#242427] text-white' : 'text-[#919196] hover:text-white'
              }`}
              title="Retângulo"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setActiveTool('shape');
                setActiveShapeType('circle');
              }}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                activeTool === 'shape' && activeShapeType === 'circle' ? 'bg-[#242427] text-white' : 'text-[#919196] hover:text-white'
              }`}
              title="Círculo"
            >
              <Circle className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setActiveTool('shape');
                setActiveShapeType('arrow');
              }}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                activeTool === 'shape' && activeShapeType === 'arrow' ? 'bg-[#242427] text-white' : 'text-[#919196] hover:text-white'
              }`}
              title="Seta"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setActiveTool('shape');
                setActiveShapeType('line');
              }}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                activeTool === 'shape' && activeShapeType === 'line' ? 'bg-[#242427] text-white' : 'text-[#919196] hover:text-white'
              }`}
              title="Linha Reta"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Undo Redo and Utilities */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="p-2 bg-[#1C1C1F] border border-[#242427] text-[#919196] hover:text-white rounded-xl disabled:opacity-30 cursor-pointer transition"
            title="Desfazer"
          >
            <CornerUpLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 bg-[#1C1C1F] border border-[#242427] text-[#919196] hover:text-white rounded-xl disabled:opacity-30 cursor-pointer transition"
            title="Refazer"
          >
            <CornerUpRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearAllPageAnnotations}
            className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/10 rounded-xl transition cursor-pointer text-xs font-semibold"
            title="Limpar página"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* 3. Sub-toolbar for Tool Styling Properties */}
      <div className="flex flex-wrap items-center px-4 py-2 bg-[#121214] border-b border-[#242427] gap-4 z-10 shrink-0 text-xs">
        {/* Pencil & Shapes style controls */}
        {(activeTool === 'pencil' || activeTool === 'shape') && (
          <div className="flex items-center flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[#919196] font-medium">Cor do Traço:</span>
              <div className="flex items-center gap-1">
                {DRAWING_COLORS.slice(0, 7).map((c) => (
                  <button
                    key={c.color}
                    onClick={() => setDrawingColor(c.color)}
                    className={`w-4 h-4 rounded-full border border-black/40 cursor-pointer transition relative ${
                      drawingColor === c.color ? 'scale-120 ring-1 ring-blue-500 ring-offset-1 ring-offset-[#121214]' : ''
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  />
                ))}
                {/* Custom Color selection picker */}
                <input
                  type="color"
                  value={drawingColor}
                  onChange={(e) => setDrawingColor(e.target.value)}
                  className="w-4 h-4 rounded-full border border-black/40 cursor-pointer outline-none bg-transparent"
                  title="Cor personalizada"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#919196] font-medium">Espessura:</span>
              <input
                type="range"
                min="1"
                max="15"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-24 accent-blue-600 cursor-pointer"
              />
              <span className="font-bold text-white min-w-[12px]">{strokeWidth}px</span>
            </div>
          </div>
        )}

        {/* Highlighter pastel/earth controls */}
        {activeTool === 'highlighter' && (
          <div className="flex items-center flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[#919196] font-medium">Tons Pastéis & Terrosos:</span>
              <div className="flex items-center flex-wrap gap-1 max-w-xs sm:max-w-md md:max-w-none">
                {HIGHLIGHTER_COLORS.map((hc) => (
                  <button
                    key={hc.name}
                    onClick={() => setHighlighterColorRgba(hc.rgba)}
                    className={`w-5 h-5 rounded-md border border-white/5 cursor-pointer transition relative ${
                      highlighterColorRgba === hc.rgba ? 'scale-115 ring-2 ring-blue-500' : ''
                    }`}
                    style={{ backgroundColor: hc.color }}
                    title={hc.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#919196] font-medium">Largura:</span>
              <input
                type="range"
                min="8"
                max="50"
                value={highlighterWidth}
                onChange={(e) => setHighlighterWidth(Number(e.target.value))}
                className="w-20 accent-blue-600 cursor-pointer"
              />
              <span className="font-bold text-white min-w-[12px]">{highlighterWidth}px</span>
            </div>
          </div>
        )}

        {/* Text and Selected Annotation Controls */}
        {(activeTool === 'text' || selectedAnno?.type === 'text') && (
          <div className="flex flex-wrap items-center gap-4 py-0.5">
            {/* Font family */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#919196] font-medium hidden sm:inline">Fonte:</span>
              <select
                value={selectedAnno ? selectedAnno.fontFamily : textFont}
                onChange={(e) => {
                  if (selectedAnno) {
                    updateSelectedAnnoStyle({ fontFamily: e.target.value });
                  } else {
                    setTextFont(e.target.value);
                  }
                }}
                className="px-2 py-1 bg-[#1C1C1F] border border-[#242427] rounded-lg text-white font-semibold focus:outline-none"
              >
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Font size */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#919196] font-medium hidden sm:inline">Tam:</span>
              <select
                value={selectedAnno ? selectedAnno.fontSize : textSize}
                onChange={(e) => {
                  const size = Number(e.target.value);
                  if (selectedAnno) {
                    updateSelectedAnnoStyle({ fontSize: size });
                  } else {
                    setTextSize(size);
                  }
                }}
                className="px-2 py-1 bg-[#1C1C1F] border border-[#242427] rounded-lg text-white font-semibold focus:outline-none"
              >
                {[12, 14, 16, 18, 20, 24, 28, 32, 40, 48].map((s) => (
                  <option key={s} value={s}>
                    {s}px
                  </option>
                ))}
              </select>
            </div>

            {/* Text styling triggers */}
            <div className="flex items-center bg-[#1C1C1F] border border-[#242427] rounded-lg p-0.5">
              <button
                onClick={() => {
                  if (selectedAnno) {
                    updateSelectedAnnoStyle({ fontWeight: selectedAnno.fontWeight === 'bold' ? 'normal' : 'bold' });
                  } else {
                    setTextBold(!textBold);
                  }
                }}
                className={`p-1 rounded-md transition cursor-pointer ${
                  (selectedAnno ? selectedAnno.fontWeight === 'bold' : textBold) ? 'bg-[#242427] text-white font-bold' : 'text-[#919196] hover:text-white'
                }`}
                title="Negrito"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (selectedAnno) {
                    updateSelectedAnnoStyle({ fontStyle: selectedAnno.fontStyle === 'italic' ? 'normal' : 'italic' });
                  } else {
                    setTextItalic(!textItalic);
                  }
                }}
                className={`p-1 rounded-md transition cursor-pointer ${
                  (selectedAnno ? selectedAnno.fontStyle === 'italic' : textItalic) ? 'bg-[#242427] text-white font-bold' : 'text-[#919196] hover:text-white'
                }`}
                title="Itálico"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (selectedAnno) {
                    const isUnder = selectedAnno.textDecoration === 'underline';
                    updateSelectedAnnoStyle({ textDecoration: isUnder ? 'none' : 'underline' });
                  } else {
                    setTextUnderline(!textUnderline);
                    setTextStrike(false);
                  }
                }}
                className={`p-1 rounded-md transition cursor-pointer ${
                  (selectedAnno ? selectedAnno.textDecoration === 'underline' : textUnderline) ? 'bg-[#242427] text-white font-bold' : 'text-[#919196] hover:text-white'
                }`}
                title="Sublinhado"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (selectedAnno) {
                    const isStrike = selectedAnno.textDecoration === 'line-through';
                    updateSelectedAnnoStyle({ textDecoration: isStrike ? 'none' : 'line-through' });
                  } else {
                    setTextStrike(!textStrike);
                    setTextUnderline(false);
                  }
                }}
                className={`p-1 rounded-md transition cursor-pointer ${
                  (selectedAnno ? selectedAnno.textDecoration === 'line-through' : textStrike) ? 'bg-[#242427] text-white font-bold' : 'text-[#919196] hover:text-white'
                }`}
                title="Riscado"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Alignments */}
            <div className="flex items-center bg-[#1C1C1F] border border-[#242427] rounded-lg p-0.5">
              <button
                onClick={() => {
                  if (selectedAnno) {
                    updateSelectedAnnoStyle({ align: 'left' });
                  } else {
                    setTextAlign('left');
                  }
                }}
                className={`p-1 rounded-md transition cursor-pointer ${
                  (selectedAnno ? selectedAnno.align === 'left' : textAlign === 'left') ? 'bg-[#242427] text-white' : 'text-[#919196] hover:text-white'
                }`}
                title="Alinhar à esquerda"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (selectedAnno) {
                    updateSelectedAnnoStyle({ align: 'center' });
                  } else {
                    setTextAlign('center');
                  }
                }}
                className={`p-1 rounded-md transition cursor-pointer ${
                  (selectedAnno ? selectedAnno.align === 'center' : textAlign === 'center') ? 'bg-[#242427] text-white' : 'text-[#919196] hover:text-white'
                }`}
                title="Alinhar ao centro"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (selectedAnno) {
                    updateSelectedAnnoStyle({ align: 'right' });
                  } else {
                    setTextAlign('right');
                  }
                }}
                className={`p-1 rounded-md transition cursor-pointer ${
                  (selectedAnno ? selectedAnno.align === 'right' : textAlign === 'right') ? 'bg-[#242427] text-white' : 'text-[#919196] hover:text-white'
                }`}
                title="Alinhar à direita"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Font Color */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#919196] font-medium hidden sm:inline">Cor:</span>
              <div className="flex items-center gap-0.5">
                {DRAWING_COLORS.slice(0, 6).map((c) => (
                  <button
                    key={c.color}
                    onClick={() => {
                      if (selectedAnno) {
                        updateSelectedAnnoStyle({ color: c.color });
                      } else {
                        setDrawingColor(c.color);
                      }
                    }}
                    className={`w-3.5 h-3.5 rounded-full border border-black/40 cursor-pointer ${
                      (selectedAnno ? selectedAnno.color === c.color : drawingColor === c.color) ? 'scale-115 ring-1 ring-blue-500' : ''
                    }`}
                    style={{ backgroundColor: c.color }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Canvas Viewport Area */}
      <div className="flex-1 overflow-auto bg-[#0E0E10] flex items-start justify-center p-6 relative" ref={containerRef}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0B]/90 z-20">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <p className="text-xs text-[#919196] font-medium">Renderizando páginas do PDF...</p>
          </div>
        )}

        {errorMsg && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0B]/95 z-20 p-6 text-center">
            <X className="w-12 h-12 text-red-500 mb-3" />
            <p className="text-sm font-bold text-white max-w-md">{errorMsg}</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition">
              Voltar aos Arquivos
            </button>
          </div>
        )}

        {/* Dynamic Canvas Container Stack */}
        <div className="relative shadow-2xl border border-[#242427] bg-white transition-all select-none" style={{ width: canvasRef.current?.width || 'auto', height: canvasRef.current?.height || 'auto' }}>
          {/* Base PDF Render Layer */}
          <canvas ref={canvasRef} className="block pointer-events-none" />

          {/* Drawings Overlay Layer */}
          <canvas
            ref={annotationCanvasRef}
            className={`absolute inset-0 block z-1 ${
              activeTool === 'select' ? 'cursor-default' : 'cursor-crosshair'
            }`}
            style={{ mixBlendMode: 'multiply' }}
            onMouseDown={handleCanvasPointerDown}
            onMouseMove={handleCanvasPointerMove}
            onMouseUp={handleCanvasPointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          {/* Draggable Texts & Notes HTML Overlay Layer */}
          <div
            className="absolute inset-0 z-2 pointer-events-none select-none overflow-hidden"
            style={{
              width: canvasRef.current?.width || '100%',
              height: canvasRef.current?.height || '100%',
            }}
          >
            {annotations
              .filter((anno) => anno.page === currentPage)
              .map((anno) => {
                if (anno.type === 'text') {
                  const isSelected = selectedAnnoId === anno.id;
                  const boxW = (anno.widthBox || 220) * zoom;
                  const boxH = (anno.heightBox || 80) * zoom;

                  return (
                    <div
                      key={anno.id}
                      className={`absolute pointer-events-auto rounded p-1 flex flex-col select-none ${
                        isSelected
                          ? 'border-2 border-blue-500 bg-[#161618]/90 shadow-xl'
                          : 'border border-transparent hover:border-white/20'
                      }`}
                      style={{
                        left: anno.x! * zoom,
                        top: anno.y! * zoom,
                        width: boxW,
                        height: boxH,
                      }}
                    >
                      {/* Drag Handle Bar inside Text Box */}
                      <div
                        className="h-4 w-full cursor-move bg-blue-600/10 hover:bg-blue-600/30 shrink-0 flex items-center justify-between px-1"
                        onMouseDown={(e) => handleTextDragStart(e, anno.id, anno.x!, anno.y!)}
                        onTouchStart={(e) => handleTextTouchStart(e, anno.id, anno.x!, anno.y!)}
                      >
                        <span className="text-[8px] font-bold text-blue-400">Arraste aqui</span>
                        {isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAnnotation(anno.id);
                            }}
                            className="text-red-400 hover:text-red-300 rounded"
                            title="Excluir"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>

                      {/* Content Editable Area */}
                      <textarea
                        value={anno.text}
                        onChange={(e) => updateAnnotationText(anno.id, e.target.value)}
                        onBlur={handleAnnotationBlur}
                        onFocus={() => setSelectedAnnoId(anno.id)}
                        className="flex-1 w-full h-full bg-transparent border-none outline-none resize-none overflow-auto text-xs text-left"
                        style={{
                          fontFamily: anno.fontFamily || textFont,
                          fontSize: (anno.fontSize || 14) * zoom,
                          color: anno.color || '#000000',
                          fontWeight: anno.fontWeight || 'normal',
                          fontStyle: anno.fontStyle || 'normal',
                          textDecoration: anno.textDecoration || 'none',
                          textAlign: anno.align || 'left',
                        }}
                        placeholder="Digite seu texto..."
                      />

                      {/* Resize handle in bottom right */}
                      {isSelected && (
                        <div
                          className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize rounded-tl shrink-0"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setResizingId(anno.id);
                            setResizeStart({
                              x: e.clientX,
                              y: e.clientY,
                              annoW: anno.widthBox || 220,
                              annoH: anno.heightBox || 80,
                            });
                          }}
                        />
                      )}
                    </div>
                  );
                } else if (anno.type === 'note') {
                  const isSelected = selectedAnnoId === anno.id;
                  const size = 38 * zoom;

                  return (
                    <div
                      key={anno.id}
                      className="absolute pointer-events-auto flex items-center justify-center cursor-pointer select-none group"
                      style={{
                        left: anno.x! * zoom,
                        top: anno.y! * zoom,
                        width: size,
                        height: size,
                      }}
                      onMouseDown={(e) => handleTextDragStart(e, anno.id, anno.x!, anno.y!)}
                      onTouchStart={(e) => handleTextTouchStart(e, anno.id, anno.x!, anno.y!)}
                    >
                      {/* Sticky note card bubble visual */}
                      <div
                        className={`w-full h-full flex flex-col justify-between p-1 rounded bg-[#FEF08A] text-[#854D0E] shadow-md border relative transition ${
                          isSelected ? 'ring-2 ring-blue-500' : 'hover:scale-105'
                        }`}
                      >
                        <span className="text-[7px] font-bold select-none uppercase tracking-wide">Anota</span>
                        <StickyNote className="w-3.5 h-3.5 mx-auto text-amber-700" />
                        <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-bl" />
                      </div>

                      {/* Sticky note text editor popover */}
                      {isSelected && (
                        <div
                          className="absolute top-full left-0 mt-1.5 w-48 bg-[#1C1C1F] border border-[#242427] rounded-xl p-2 z-20 pointer-events-auto flex flex-col gap-1.5 shadow-2xl"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <textarea
                            value={anno.text}
                            onChange={(e) => updateAnnotationText(anno.id, e.target.value)}
                            onBlur={handleAnnotationBlur}
                            className="w-full h-24 bg-[#121214] border border-[#242427] p-1.5 rounded-lg text-[11px] text-white outline-none resize-none"
                            placeholder="Escreva sua anotação..."
                          />
                          <div className="flex justify-between items-center text-[10px]">
                            <button
                              onClick={() => handleDeleteAnnotation(anno.id)}
                              className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Excluir
                            </button>
                            <button
                              onClick={() => setSelectedAnnoId(null)}
                              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded"
                            >
                              Ok
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })}
          </div>
        </div>
      </div>

      {/* 5. Footer Page Nav controls */}
      <div className="px-4 py-2.5 bg-[#121214] border-t border-[#242427] flex items-center justify-between shrink-0 z-10 select-none">
        <span className="text-xs text-[#919196] font-medium">
          Apostila Digital Universitária • {file.size}
        </span>

        {/* Page Navigators */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 bg-[#1C1C1F] hover:bg-[#242427] border border-[#242427] rounded-xl text-[#919196] hover:text-white disabled:opacity-30 cursor-pointer transition flex items-center justify-center"
            title="Página Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-xs font-bold text-white tracking-wide">
            Pág. {currentPage} de {numPages || '...'}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
            disabled={currentPage === numPages}
            className="p-1.5 bg-[#1C1C1F] hover:bg-[#242427] border border-[#242427] rounded-xl text-[#919196] hover:text-white disabled:opacity-30 cursor-pointer transition flex items-center justify-center"
            title="Próxima Página"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <span className="text-[10px] text-amber-500/80 font-semibold uppercase tracking-wider hidden sm:block">
          Original Preservado
        </span>
      </div>
    </div>
  );
};
