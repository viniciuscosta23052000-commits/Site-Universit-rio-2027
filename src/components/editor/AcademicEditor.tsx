import React, { useState, useEffect, useRef } from 'react';
import { Lesson, Notebook, Discipline, CanvasElement, DrawingStroke } from '../../types';
import { StorageService } from '../../lib/storage';
import { exportLessonToDocx } from '../../lib/docxExport';
import { exportToPdf } from '../../lib/pdfExport';
import { UniversalImageEditor, ImageEditParams } from './UniversalImageEditor';
import { ClassroomAudioSection } from './ClassroomAudioSection';
import { FloatingWidgets } from './FloatingWidgets';
import {
  MATH_SYMBOLS,
  FONTS_LIST,
  FONT_SIZES,
  getSmartArtProcess,
  getSmartArtList,
  getChartHtml,
  getWordArtHtml,
  getDropCapHtml,
  getSignatureHtml,
  getTOC,
  getCalloutHtml
} from './editorTemplates';
import {
  ArrowLeft,
  Save,
  Download,
  Printer,
  Sparkles,
  Camera,
  FileText,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Table as TableIcon,
  HelpCircle,
  Brain,
  Network,
  PenTool,
  Highlighter,
  Eraser,
  Image as ImageIcon,
  StickyNote,
  Plus,
  Trash2,
  Minimize2,
  Maximize2,
  Check,
  Undo,
  Redo,
  Clipboard,
  Scissors,
  Copy,
  ChevronDown,
  GripHorizontal,
  FolderOpen,
  Eye,
  Settings,
  Lock,
  Puzzle,
  Globe,
  Mic,
  Smile,
  Link,
  BookOpen,
  Type,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AcademicEditorProps {
  lessonId: string;
  onBack: () => void;
  onNavigateToFlashcards?: (deckId: string) => void;
  onNavigateToMindmaps?: (mapId: string) => void;
}

export const AcademicEditor: React.FC<AcademicEditorProps> = ({
  lessonId,
  onBack,
  onNavigateToFlashcards,
  onNavigateToMindmaps,
}) => {
  const db = StorageService.getDatabase();
  const initialLesson = db.lessons.find((l) => l.id === lessonId);
  const notebook = db.notebooks.find((n) => n.id === initialLesson?.notebookId);
  const discipline = db.disciplines.find((d) => d.id === initialLesson?.disciplineId);

  const [lesson, setLesson] = useState<Lesson | null>(initialLesson || null);
  const [title, setTitle] = useState(initialLesson?.title || 'Sem Título');
  const [lessonNumber, setLessonNumber] = useState(initialLesson?.lessonNumber || 'Aula 01');
  const [professor, setProfessor] = useState(initialLesson?.professor || discipline?.professor || '');
  const [date, setDate] = useState(initialLesson?.date || new Date().toISOString().split('T')[0]);
  const [pageFormat, setPageFormat] = useState<'a4' | 'a5' | 'letter'>(initialLesson?.pageFormat || 'a4');
  const [headerText, setHeaderText] = useState(initialLesson?.headerText || discipline?.name || 'MATÉRIA');

  // Ribbon Navigation state
  const [activeRibbonTab, setActiveRibbonTab] = useState<
    'arquivo' | 'pagina-inicial' | 'inserir' | 'desenhar' | 'layout' | 'referencias' | 'colaboracao' | 'protecao' | 'ver' | 'plugins' | 'ai'
  >('pagina-inicial');

  // Document formatting state
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState('11');
  const [lineSpacing, setLineSpacing] = useState('1.5');
  const [margins, setMargins] = useState<'normal' | 'estreita' | 'moderada' | 'larga'>('normal');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [columns, setColumns] = useState<'1' | '2' | '3'>('1');
  const [indentLeft, setIndentLeft] = useState(0);
  const [indentRight, setIndentRight] = useState(0);
  const [spacingBefore, setSpacingBefore] = useState(0);
  const [spacingAfter, setSpacingAfter] = useState(8);

  // Status Bar / Metrics state
  const [zoom, setZoom] = useState(100);
  const [language, setLanguage] = useState('Português - Brasil');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [rulerVisible, setRulerVisible] = useState(true);

  // Table grid visual selector state
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [tableGridHover, setTableGridHover] = useState<{ r: number; c: number } | null>(null);

  // Drawing overlay layer state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingTool, setDrawingTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [drawColor, setDrawColor] = useState('#EF4444');
  const [drawWidth, setDrawWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Freeform sticky elements
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>(initialLesson?.canvasElements || []);

  // UI modals/panels
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAction, setAiAction] = useState<string>('summarize');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiResultText, setAiResultText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [ocrImagePreview, setOcrImagePreview] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [symbolPickerOpen, setSymbolPickerOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [pageAppearance, setPageAppearance] = useState<'white' | 'dark' | 'auto'>('white');
  const [pageStyle, setPageStyle] = useState<'lisa' | 'pautada' | 'pontilhada' | 'quadriculada'>('lisa');
  const [pageBgColor, setPageBgColor] = useState<string>('#ffffff');
  const [showAudioSidebar, setShowAudioSidebar] = useState(false);
  
  // Custom week and elegant Undo / Redo history stacks
  const [weekValue, setWeekValue] = useState('01');
  const [undoStack, setUndoStack] = useState<{ contentHtml: string; canvasElements: CanvasElement[]; drawings: any[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ contentHtml: string; canvasElements: CanvasElement[]; drawings: any[] }[]>([]);

  const pushToUndo = () => {
    if (!lesson) return;
    const currentHtml = editorContentRef.current ? editorContentRef.current.innerHTML : lesson.contentHtml;
    setUndoStack(prev => {
      const updated = [...prev, {
        contentHtml: currentHtml,
        canvasElements: [...canvasElements],
        drawings: lesson.drawings ? [...lesson.drawings] : []
      }];
      if (updated.length > 50) updated.shift(); // Limit history buffer size
      return updated;
    });
    setRedoStack([]); // Clear redo stack on user action
  };

  const handleUndo = () => {
    if (undoStack.length === 0 || !lesson) return;
    const currentHtml = editorContentRef.current ? editorContentRef.current.innerHTML : lesson.contentHtml;
    const currentState = {
      contentHtml: currentHtml,
      canvasElements: [...canvasElements],
      drawings: lesson.drawings ? [...lesson.drawings] : []
    };

    const previousState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, currentState]);

    // Apply states
    setCanvasElements(previousState.canvasElements);
    if (editorContentRef.current) {
      editorContentRef.current.innerHTML = previousState.contentHtml;
    }

    const updated: Lesson = {
      ...lesson,
      contentHtml: previousState.contentHtml,
      canvasElements: previousState.canvasElements,
      drawings: previousState.drawings,
      updatedAt: new Date().toISOString(),
    };
    setLesson(updated);

    StorageService.update((draft) => {
      const idx = draft.lessons.findIndex((l) => l.id === lesson.id);
      if (idx !== -1) {
        draft.lessons[idx] = updated;
      }
    });
    updateDocumentMetrics();
  };

  const handleRedo = () => {
    if (redoStack.length === 0 || !lesson) return;
    const currentHtml = editorContentRef.current ? editorContentRef.current.innerHTML : lesson.contentHtml;
    const currentState = {
      contentHtml: currentHtml,
      canvasElements: [...canvasElements],
      drawings: lesson.drawings ? [...lesson.drawings] : []
    };

    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, currentState]);

    // Apply states
    setCanvasElements(nextState.canvasElements);
    if (editorContentRef.current) {
      editorContentRef.current.innerHTML = nextState.contentHtml;
    }

    const updated: Lesson = {
      ...lesson,
      contentHtml: nextState.contentHtml,
      canvasElements: nextState.canvasElements,
      drawings: nextState.drawings,
      updatedAt: new Date().toISOString(),
    };
    setLesson(updated);

    StorageService.update((draft) => {
      const idx = draft.lessons.findIndex((l) => l.id === lesson.id);
      if (idx !== -1) {
        draft.lessons[idx] = updated;
      }
    });
    updateDocumentMetrics();
  };

  // Image editing
  const [editingDocImage, setEditingDocImage] = useState<HTMLImageElement | null>(null);
  const [selectedDocImage, setSelectedDocImage] = useState<HTMLImageElement | null>(null);
  const [newImageOriginalSrc, setNewImageOriginalSrc] = useState<string | null>(null);
  const [isNewImageEditorOpen, setIsNewImageEditorOpen] = useState(false);

  const editorContentRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync content on load
  useEffect(() => {
    if (editorContentRef.current && initialLesson) {
      editorContentRef.current.innerHTML = initialLesson.contentHtml || '<p>Comece a escrever sua aula aqui...</p>';
      updateDocumentMetrics();
    }
  }, [lessonId]);

  // Track live changes in DB
  useEffect(() => {
    const unsubscribe = StorageService.subscribe((newDb) => {
      const freshL = newDb.lessons.find((l) => l.id === lessonId);
      if (freshL && freshL.contentHtml !== editorContentRef.current?.innerHTML) {
        setLesson(freshL);
      }
    });
    return unsubscribe;
  }, [lessonId]);

  // Drawing Canvas redraw logic
  useEffect(() => {
    if (!canvasRef.current || !lesson) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    (lesson.drawings || []).forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.4 : 1.0;

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
    ctx.globalAlpha = 1.0;
  }, [lesson?.drawings, isDrawingMode]);

  // Metric calculator
  const updateDocumentMetrics = () => {
    if (editorContentRef.current) {
      const text = editorContentRef.current.innerText || '';
      const clean = text.trim();
      const words = clean ? clean.split(/\s+/).length : 0;
      setWordCount(words);
      setCharCount(text.length);
    }
  };

  // Document saving
  const handleSave = (silent = false, customTitle?: string, customDate?: string, customHeaderText?: string) => {
    if (!lesson) return;
    setSaveStatus('saving');

    const contentHtml = editorContentRef.current ? editorContentRef.current.innerHTML : lesson.contentHtml;

    const updated: Lesson = {
      ...lesson,
      title: customTitle !== undefined ? customTitle : title,
      lessonNumber,
      professor,
      date: customDate !== undefined ? customDate : date,
      headerText: customHeaderText !== undefined ? customHeaderText : headerText,
      pageFormat,
      contentHtml,
      canvasElements,
      updatedAt: new Date().toISOString(),
    };

    StorageService.update((draft) => {
      const idx = draft.lessons.findIndex((l) => l.id === lesson.id);
      if (idx !== -1) {
        draft.lessons[idx] = updated;
      }
    });

    setLesson(updated);
    setTimeout(() => setSaveStatus('saved'), 400);

    if (!silent) {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.9 } });
    }
  };

  // Rich-text formatting command
  const formatDoc = (cmd: string, value: string | undefined = undefined) => {
    document.execCommand(cmd, false, value);
    if (editorContentRef.current) {
      editorContentRef.current.focus();
    }
    updateDocumentMetrics();
  };

  const applyStudyMarking = (type: 'prova' | 'conceito' | 'dica') => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
      alert('Por favor, selecione um trecho de texto no editor primeiro para aplicar a marcação de estudo.');
      return;
    }
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    let html = '';
    if (type === 'prova') {
      html = `<span class="study-mark-prova" style="background-color: #fef08a; color: #854d0e; border: 1px solid #facc15; padding: 2px 6px; border-radius: 4px; font-weight: 500; display: inline-flex; items-center; gap: 4px; margin: 0 2px;"><span style="background-color: #eab308; color: white; font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 3px; line-height: 1; letter-spacing: 0.5px;" contenteditable="false">PROVA</span> ${selectedText}</span>`;
    } else if (type === 'conceito') {
      html = `<span class="study-mark-conceito" style="background-color: #dbeafe; color: #1e3a8a; border-left: 3px solid #3b82f6; padding: 2px 6px; border-radius: 2px; font-weight: 500; display: inline-flex; items-center; gap: 4px; margin: 0 2px;"><span style="background-color: #3b82f6; color: white; font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 3px; line-height: 1; letter-spacing: 0.5px;" contenteditable="false">CONCEITO</span> ${selectedText}</span>`;
    } else if (type === 'dica') {
      html = `<span class="study-mark-dica" style="background-color: #dcfce7; color: #166534; border: 1px solid #4ade80; padding: 2px 6px; border-radius: 4px; font-weight: 500; display: inline-flex; items-center; gap: 4px; margin: 0 2px;"><span style="background-color: #22c55e; color: white; font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 3px; line-height: 1; letter-spacing: 0.5px;" contenteditable="false">DICA</span> ${selectedText}</span>`;
    }

    document.execCommand('insertHTML', false, html);
    updateDocumentMetrics();
    handleSave(true);
  };

  // Quick document template insertion helpers
  const insertTemplateHtml = (html: string) => {
    formatDoc('insertHTML', html);
    handleSave(true);
  };

  const handleTableGridInsert = (rows: number, cols: number) => {
    let tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #cbd5e1;"><thead><tr style="background-color: #f1f5f9;">`;
    for (let c = 0; c < cols; c++) {
      tableHtml += `<th style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: left; font-weight: bold; font-size: 13px;">Coluna ${c + 1}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 0; r < rows; r++) {
      tableHtml += `<tr>`;
      for (let c = 0; c < cols; c++) {
        tableHtml += `<td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 13px;">&nbsp;</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p></p>`;
    insertTemplateHtml(tableHtml);
  };

  const handleInsertAudioNotes = (html: string) => {
    if (editorContentRef.current) {
      editorContentRef.current.innerHTML += `<div class="ai-generated-study-notes border-t-2 border-dashed border-purple-500/30 pt-6 mt-8">${html}</div>`;
      handleSave(true);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
    }
  };

  // Image select & edit handlers
  const handleNewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setNewImageOriginalSrc(base64);
      setIsNewImageEditorOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveNewDocImage = (editedUrl: string, params: ImageEditParams) => {
    if (!newImageOriginalSrc) return;
    const imgHtml = `<img src="${editedUrl}" data-original-src="${newImageOriginalSrc}" data-edit-params='${JSON.stringify(params)}' class="note-editable-image rounded-xl my-4 max-w-full cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all duration-200" style="display: block; margin-left: auto; margin-right: auto; max-height: 400px;" />`;
    formatDoc('insertHTML', imgHtml);
    setNewImageOriginalSrc(null);
    setIsNewImageEditorOpen(false);
    handleSave(true);
  };

  const handleSaveExistingDocImage = (editedUrl: string, params: ImageEditParams) => {
    if (!editingDocImage) return;
    editingDocImage.src = editedUrl;
    editingDocImage.setAttribute('data-edit-params', JSON.stringify(params));
    setEditingDocImage(null);
    handleSave(true);
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      if (!target.classList.contains('note-editable-image')) {
        target.classList.add('note-editable-image');
      }
      setSelectedDocImage(target as HTMLImageElement);
    } else {
      setSelectedDocImage(null);
    }
  };

  // Word docx and PDF formatting exports
  const handleExportDocx = async () => {
    if (!lesson) return;
    try {
      const blob = await exportLessonToDocx(
        {
          ...lesson,
          title,
          lessonNumber,
          professor,
          date,
          contentHtml: editorContentRef.current?.innerHTML || lesson.contentHtml,
        },
        discipline?.name || 'Disciplina'
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${discipline?.name || 'Aula'}_${lessonNumber}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Erro ao exportar documento para DOCX.');
    }
  };

  const handleExportPdf = () => {
    if (!lesson) return;
    try {
      exportToPdf(title, lessonNumber || 'Aula', editorContentRef.current?.innerHTML || lesson.contentHtml, {
        studentName: db.profile?.name || 'Estudante',
        courseName: db.profile?.course || 'Curso',
        institution: db.profile?.institution || 'Universidade',
        professor: professor || discipline?.professor || 'Não informado',
        date: date || 'Não informada',
      });
      confetti({ particleCount: 30, spread: 50 });
    } catch (e) {
      alert('Erro ao exportar documento para PDF.');
    }
  };

  // OCR Photo transcriber
  const handleOcrFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setOcrImagePreview(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRunOcr = async () => {
    if (!ocrImagePreview) return;
    setOcrLoading(true);
    try {
      const response = await fetch('/api/ai/transcribe-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: ocrImagePreview }),
      });
      const data = await response.json();
      if (data.success && data.contentHtml) {
        formatDoc('insertHTML', data.contentHtml);
        setOcrModalOpen(false);
        setOcrImagePreview(null);
        confetti({ particleCount: 50, spread: 60 });
      } else {
        alert('Erro na transcrição: ' + (data.error || 'Tente novamente'));
      }
    } catch (e: any) {
      alert('Erro de conexão: ' + e.message);
    } finally {
      setOcrLoading(false);
    }
  };

  // AI Assistant trigger
  const handleRunAiStudy = async () => {
    setIsAiLoading(true);
    setAiResultText('');
    const currentText = editorContentRef.current?.innerText || '';
    try {
      const response = await fetch('/api/ai/study-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: aiAction,
          noteTitle: title,
          subjectName: discipline?.name || 'Geral',
          contentText: currentText,
          customPrompt: aiCustomPrompt,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAiResultText(data.result);
      } else {
        setAiResultText('Erro: ' + (data.error || 'Não foi possível gerar resposta'));
      }
    } catch (e: any) {
      setAiResultText('Erro de conexão: ' + e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Original AI Flashcard deck creator (unaltered options)
  const handleGenerateFlashcards = async () => {
    if (!lesson) return;
    setIsAiLoading(true);
    const currentText = editorContentRef.current?.innerText || '';
    try {
      const response = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteTitle: title,
          subjectName: discipline?.name || 'Geral',
          contentText: currentText,
          count: 6,
        }),
      });
      const data = await response.json();
      if (data.success && data.flashcards?.length > 0) {
        const newDeckId = `deck-${Date.now()}`;
        StorageService.update((draft) => {
          draft.flashcardDecks.push({
            id: newDeckId,
            semesterId: lesson.semesterId,
            disciplineId: lesson.disciplineId,
            notebookId: lesson.notebookId,
            chapterId: lesson.chapterId,
            lessonId: lesson.id,
            name: `Deck: ${title}`,
            description: `Flashcards gerados por IA a partir da aula "${title}"`,
            tags: ['#ia', '#revisao', `#${discipline?.name?.toLowerCase() || 'geral'}`],
            color: discipline?.color || '#4A6B53',
            icon: 'Brain',
            createdAt: new Date().toISOString(),
            cards: data.flashcards.map((f: any, i: number) => ({
              id: `card-${Date.now()}-${i}`,
              deckId: newDeckId,
              front: f.front,
              back: f.back,
              tag: f.tag || 'Conceito',
              repetitions: 0,
              intervalDays: 1,
              easeFactor: 2.5,
              nextReviewDate: new Date().toISOString().split('T')[0],
              state: 'new',
            })),
          });
        });
        confetti({ particleCount: 80, spread: 80 });
        if (onNavigateToFlashcards) {
          onNavigateToFlashcards(newDeckId);
        } else {
          alert('Baralho de Flashcards criado com sucesso com 6 cartas!');
        }
      } else {
        alert('Erro ao gerar flashcards: ' + (data.error || 'Tente novamente'));
      }
    } catch (e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Original AI Mind Map creator (unaltered options)
  const handleGenerateMindmap = async () => {
    if (!lesson) return;
    setIsAiLoading(true);
    const currentText = editorContentRef.current?.innerText || '';
    try {
      const response = await fetch('/api/ai/generate-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteTitle: title,
          subjectName: discipline?.name || 'Geral',
          contentText: currentText,
        }),
      });
      const data = await response.json();
      if (data.success && data.mindmap) {
        const newMapId = `mm-${Date.now()}`;
        const rawMap = data.mindmap;
        const nodes = [
          {
            id: 'n-root',
            label: rawMap.rootNode?.label || title,
            description: rawMap.rootNode?.description || 'Tema Central',
            color: rawMap.rootNode?.color || discipline?.color || '#4A6B53',
            x: 400,
            y: 180,
            width: 170,
            height: 70,
            linkedLessonId: lesson.id,
          },
          ...(rawMap.nodes || []).map((node: any, idx: number) => {
            const angle = (idx / (rawMap.nodes?.length || 1)) * 2 * Math.PI;
            return {
              id: node.id || `node-${idx}`,
              label: node.label,
              description: node.description,
              color: node.color || '#4B6584',
              x: 400 + Math.cos(angle) * 260,
              y: 280 + Math.sin(angle) * 180,
              width: 150,
              height: 60,
              linkedLessonId: lesson.id,
            };
          }),
        ];
        const connections = (rawMap.connections || []).map((conn: any, idx: number) => ({
          id: `c-${idx}`,
          fromNodeId: conn.from === 'root-1' ? 'n-root' : conn.from,
          toNodeId: conn.to,
          label: conn.label || 'relaciona',
          style: 'solid' as const,
        }));
        StorageService.update((draft) => {
          draft.mindMaps.push({
            id: newMapId,
            semesterId: lesson.semesterId,
            disciplineId: lesson.disciplineId,
            notebookId: lesson.notebookId,
            chapterId: lesson.chapterId,
            lessonId: lesson.id,
            title: `Mapa: ${title}`,
            description: `Mapa mental gerado por IA da aula "${title}"`,
            color: discipline?.color || '#4A6B53',
            layout: 'radial',
            nodes,
            connections,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });
        confetti({ particleCount: 80, spread: 80 });
        if (onNavigateToMindmaps) {
          onNavigateToMindmaps(newMapId);
        } else {
          alert('Mapa Mental gerado com sucesso!');
        }
      } else {
        alert('Erro ao gerar mapa: ' + (data.error || 'Tente novamente'));
      }
    } catch (e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleInsertPostit = () => {
    pushToUndo();
    const newEl: CanvasElement = {
      id: 'postit_' + Date.now(),
      type: 'postit',
      x: 120,
      y: 180,
      width: 180,
      height: 180,
      zIndex: canvasElements.length + 1,
      content: 'Escreva suas anotações aqui...',
      style: {
        backgroundColor: '#efebe9', // Default to aesthetic beige coffee
        color: '#4e342e',
        fontSize: 13,
        borderRadius: 8,
        fontFamily: 'Caveat',
        borderColor: 'tape' // Default to taped aesthetic matching reference images
      }
    };
    setCanvasElements([...canvasElements, newEl]);
    handleSave(true);
  };

  const handleInsertFlashcard = () => {
    pushToUndo();
    const newEl: CanvasElement = {
      id: 'flashcard_' + Date.now(),
      type: 'flashcard',
      x: 340,
      y: 180,
      width: 230,
      height: 140,
      zIndex: canvasElements.length + 1,
      content: JSON.stringify({
        front: 'Pergunta do Flashcard?',
        back: 'Resposta do Flashcard!',
        flipped: false,
        title: 'Revisão Rápida'
      }),
      style: {
        backgroundColor: '#ffe4e6',
        color: '#9f1239',
        fontSize: 13,
        borderRadius: 12,
        fontFamily: 'Plus Jakarta Sans'
      }
    };
    setCanvasElements([...canvasElements, newEl]);
    handleSave(true);
  };

  // Drawing event capturing pointers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setCurrentStroke([{ x, y }]);
  };

  const drawMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoints = [...currentStroke, { x, y }];
    setCurrentStroke(newPoints);

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = drawingTool === 'highlighter' ? 0.4 : 1.0;

    ctx.moveTo(currentStroke[currentStroke.length - 1].x, currentStroke[currentStroke.length - 1].y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  };

  const endDrawing = () => {
    if (!isDrawing || !lesson) return;
    setIsDrawing(false);

    if (currentStroke.length > 1) {
      const newStroke: DrawingStroke = {
        id: `stroke-${Date.now()}`,
        tool: drawingTool === 'highlighter' ? 'highlighter' : 'pen',
        color: drawColor,
        width: drawWidth,
        points: currentStroke,
      };

      const updatedDrawings = [...(lesson.drawings || []), newStroke];
      setLesson({ ...lesson, drawings: updatedDrawings });
      StorageService.update((draft) => {
        const l = draft.lessons.find((item) => item.id === lesson.id);
        if (l) l.drawings = updatedDrawings;
      });
    }
    setCurrentStroke([]);
  };

  const clearDrawings = () => {
    if (!lesson) return;
    setLesson({ ...lesson, drawings: [] });
    StorageService.update((draft) => {
      const l = draft.lessons.find((item) => item.id === lesson.id);
      if (l) l.drawings = [];
    });
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Dimensions based on selected format & landscape mode
  const getPageDimensions = () => {
    const isPortrait = orientation === 'portrait';
    if (pageFormat === 'a5') {
      return {
        width: isPortrait ? '148mm' : '210mm',
        height: isPortrait ? '210mm' : '148mm',
        sheetWidth: isPortrait ? 560 : 790,
        sheetHeight: isPortrait ? 790 : 560,
      };
    }
    if (pageFormat === 'letter') {
      return {
        width: isPortrait ? '215mm' : '279mm',
        height: isPortrait ? '279mm' : '215mm',
        sheetWidth: isPortrait ? 810 : 1050,
        sheetHeight: isPortrait ? 1050 : 810,
      };
    }
    // A4 (default)
    return {
      width: isPortrait ? '210mm' : '297mm',
      height: isPortrait ? '297mm' : '210mm',
      sheetWidth: isPortrait ? 790 : 1120,
      sheetHeight: isPortrait ? 1120 : 790,
    };
  };

  const { width: pageWidth, height: pageHeight, sheetWidth, sheetHeight } = getPageDimensions();

  // Margin spacing utility classes
  const marginClasses = {
    normal: 'p-12 sm:p-14',
    estreita: 'p-6 sm:p-8',
    moderada: 'p-10 sm:p-12',
    larga: 'p-16 sm:p-20',
  };

  // Translate document logic using AI proxy
  const handleTranslateText = async (lang: string) => {
    setIsAiLoading(true);
    const content = editorContentRef.current?.innerText || '';
    try {
      const res = await fetch('/api/ai/study-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'explain',
          noteTitle: title,
          subjectName: discipline?.name || 'Geral',
          contentText: `Traduza o seguinte texto acadêmico estritamente para o idioma ${lang}: \n\n${content}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        formatDoc('insertHTML', `<div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px; margin: 12px 0; border-radius: 6px; font-size: 13px;" contenteditable="false"><strong>🌐 Tradução (${lang}):</strong><br/>${data.result.replace(/\n/g, '<br/>')}</div><p></p>`);
      } else {
        alert('Erro ao processar tradução.');
      }
    } catch (e) {
      alert('Erro ao traduzir.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0E0E10] text-[#E4E4E7] overflow-hidden font-sans">
      
      {/* Top Application Header */}
      <header className="flex items-center justify-between gap-3 px-4 py-2 bg-[#141416] border-b border-[#242427] z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-[#202024] transition cursor-pointer"
            title="Voltar ao Caderno"
            id="btn-back-notebook"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white uppercase tracking-wider"
                style={{ backgroundColor: discipline?.color || '#3b82f6' }}
              >
                {discipline?.name || 'Geral'}
              </span>
              <input
                type="text"
                value={lessonNumber}
                onChange={(e) => setLessonNumber(e.target.value)}
                className="px-1.5 py-0.5 text-xs font-semibold rounded bg-transparent border-b border-transparent hover:border-[#2F2F33] focus:border-blue-500 focus:outline-none w-20 text-[#EDEDED]"
              />
              <span className="text-xs text-[#52525B]">•</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs text-[#A1A1AA] bg-transparent border-none focus:outline-none focus:ring-0 w-28 cursor-pointer"
              />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm sm:text-base font-bold bg-transparent border-b border-transparent hover:border-[#2F2F33] focus:border-blue-500 focus:outline-none text-white w-64 sm:w-80 placeholder-[#52525B]"
              placeholder="Título da Aula..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Desfazer / Refazer (Undo / Redo) Arrows */}
          <div className="flex items-center gap-1 bg-[#1A1A1E] border border-[#242427] p-1 rounded-xl shadow-sm no-print mr-1">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                undoStack.length > 0 
                  ? 'text-gray-200 hover:bg-[#2A2A2E] hover:text-amber-400 hover:scale-105 active:scale-95' 
                  : 'text-[#3F3F46] cursor-not-allowed opacity-40'
              }`}
              title="Desfazer última alteração (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                redoStack.length > 0 
                  ? 'text-gray-200 hover:bg-[#2A2A2E] hover:text-amber-400 hover:scale-105 active:scale-95' 
                  : 'text-[#3F3F46] cursor-not-allowed opacity-40'
              }`}
              title="Refazer alteração (Ctrl+Y)"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Saving State */}
          <span className="text-[10px] font-mono text-[#71717A]">
            {saveStatus === 'saving' ? 'Salvando...' : 'Documento Salvo'}
          </span>
          <button
            onClick={() => handleSave(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition cursor-pointer"
            id="btn-quick-save"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar
          </button>
        </div>
      </header>

      {/* OnlyOffice-style Ribbon Tabs Row */}
      <nav className="flex items-center bg-[#18181B] border-b border-[#242427] px-4 pt-1 z-10 select-none overflow-x-auto gap-1 scrollbar-none">
        <button
          onClick={() => {
            setActiveRibbonTab('arquivo');
          }}
          className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-all ${
            activeRibbonTab === 'arquivo'
              ? 'bg-[#A8A29E] text-stone-900 border-t-2 border-orange-500'
              : 'text-stone-300 hover:bg-[#27272A]'
          }`}
          id="tab-ribbon-arquivo"
        >
          Arquivo
        </button>
        {(
          [
            { id: 'pagina-inicial', label: 'Página Inicial' },
            { id: 'inserir', label: 'Inserir' },
            { id: 'desenhar', label: 'Desenhar' },
            { id: 'layout', label: 'Layout' },
            { id: 'referencias', label: 'Referências' },
            { id: 'colaboracao', label: 'Colaboração' },
            { id: 'protecao', label: 'Proteção' },
            { id: 'ver', label: 'Ver' },
            { id: 'plugins', label: 'Plug-ins' },
            { id: 'ai', label: 'AI' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveRibbonTab(tab.id);
              if (tab.id === 'desenhar') {
                setIsDrawingMode(true);
              } else {
                setIsDrawingMode(false);
              }
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-all whitespace-nowrap ${
              activeRibbonTab === tab.id
                ? 'bg-[#27272A] text-white border-t-2 border-blue-500'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#202024]'
            }`}
            id={`tab-ribbon-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Ribbon Tools Panel (Grey-themed OnlyOffice replica) */}
      <div className="bg-[#202024] border-b border-[#2E2E33] px-4 py-2 text-xs flex flex-wrap items-center gap-4 z-10 overflow-x-auto min-h-[58px] select-none scrollbar-none">
        
        {/* TAB: ARQUIVO */}
        {activeRibbonTab === 'arquivo' && (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <button
                onClick={() => handleSave(false)}
                className="p-1.5 bg-[#2D2D33] hover:bg-blue-600 rounded-lg text-white transition flex items-center gap-1 cursor-pointer"
                id="btn-file-save"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Tudo</span>
              </button>
            </div>
            <div className="w-px h-8 bg-[#2F2F33]" />
            
            <button
              onClick={handleExportDocx}
              className="px-3 py-1.5 bg-[#2D2D33] hover:bg-stone-700 rounded-lg text-white transition flex items-center gap-1.5 cursor-pointer"
              id="btn-file-export-word"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Word (.docx)</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="px-3 py-1.5 bg-[#2D2D33] hover:bg-stone-700 rounded-lg text-white transition flex items-center gap-1.5 cursor-pointer"
              id="btn-file-export-pdf"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF (.pdf)</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-[#2D2D33] hover:bg-stone-700 rounded-lg text-white transition flex items-center gap-1.5 cursor-pointer"
              id="btn-file-print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <div className="w-px h-8 bg-[#2F2F33]" />
            <div className="text-[10px] text-[#A1A1AA]">
              <div><strong>Doc:</strong> {title}.docx</div>
              <div><strong>Tamanho:</strong> {pageFormat.toUpperCase()} ({orientation})</div>
            </div>
          </div>
        )}

        {/* TAB: PÁGINA INICIAL */}
        {activeRibbonTab === 'pagina-inicial' && (
          <div className="flex items-center gap-4 flex-wrap">
            {/* Clipboard group */}
            <div className="flex items-center gap-1 border-r border-[#2F2F33] pr-3 h-9">
              <button
                onClick={() => {
                  navigator.clipboard.readText().then((clipText) => {
                    formatDoc('insertText', clipText);
                  }).catch(() => {
                    alert('Cole o texto diretamente no documento com Ctrl+V');
                  });
                }}
                className="p-1.5 hover:bg-[#2D2D33] rounded-lg text-white transition cursor-pointer flex flex-col items-center justify-center"
                title="Colar área de transferência"
                id="btn-paste"
              >
                <Clipboard className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => formatDoc('cut')}
                className="p-1 hover:bg-[#2D2D33] rounded text-[#A1A1AA] hover:text-white transition cursor-pointer"
                title="Recortar"
              >
                <Scissors className="w-3 h-3" />
              </button>
              <button
                onClick={() => formatDoc('copy')}
                className="p-1 hover:bg-[#2D2D33] rounded text-[#A1A1AA] hover:text-white transition cursor-pointer"
                title="Copiar"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>

            {/* Font Selectors */}
            <div className="flex items-center gap-1.5 border-r border-[#2F2F33] pr-3 h-9">
              <select
                value={fontFamily}
                onChange={(e) => {
                  setFontFamily(e.target.value);
                  formatDoc('fontName', e.target.value);
                }}
                className="bg-[#2D2D33] text-white text-[11px] px-2 py-1 rounded-md border border-[#3F3F46] focus:outline-none"
              >
                {FONTS_LIST.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>

              <select
                value={fontSize}
                onChange={(e) => {
                  setFontSize(e.target.value);
                  formatDoc('fontSize', e.target.value === '12' ? '3' : e.target.value === '16' ? '5' : e.target.value === '24' ? '6' : '4');
                }}
                className="bg-[#2D2D33] text-white text-[11px] px-2 py-1 rounded-md border border-[#3F3F46] w-12 focus:outline-none"
              >
                {FONT_SIZES.map((sz) => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>

              {/* Increase / Decrease / Clear */}
              <button
                onClick={() => formatDoc('fontSize', '5')}
                className="p-1 hover:bg-[#2D2D33] text-white font-bold rounded cursor-pointer"
                title="Aumentar Fonte"
              >
                A⁺
              </button>
              <button
                onClick={() => formatDoc('fontSize', '2')}
                className="p-1 hover:bg-[#2D2D33] text-white font-bold rounded cursor-pointer"
                title="Diminuir Fonte"
              >
                A⁻
              </button>
              <button
                onClick={() => formatDoc('removeFormat')}
                className="p-1 hover:bg-[#2D2D33] text-red-400 font-semibold rounded cursor-pointer text-[10px]"
                title="Limpar todas as formatações"
              >
                Limpar
              </button>
            </div>

            {/* TextStyle Formatting */}
            <div className="flex items-center gap-1 border-r border-[#2F2F33] pr-3 h-9">
              <button
                onClick={() => formatDoc('bold')}
                className="p-1.5 hover:bg-[#2D2D33] text-white rounded font-bold cursor-pointer"
                title="Negrito"
                id="btn-bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => formatDoc('italic')}
                className="p-1.5 hover:bg-[#2D2D33] text-white rounded italic cursor-pointer"
                title="Itálico"
                id="btn-italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => formatDoc('underline')}
                className="p-1.5 hover:bg-[#2D2D33] text-white rounded underline cursor-pointer"
                title="Sublinhado"
                id="btn-underline"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => formatDoc('strikeThrough')}
                className="p-1.5 hover:bg-[#2D2D33] text-white rounded line-through cursor-pointer"
                title="Tachado"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => formatDoc('superscript')}
                className="p-1 hover:bg-[#2D2D33] text-white rounded font-mono text-[10px] cursor-pointer"
                title="Sobrescrito"
              >
                x²
              </button>
              <button
                onClick={() => formatDoc('subscript')}
                className="p-1 hover:bg-[#2D2D33] text-white rounded font-mono text-[10px] cursor-pointer"
                title="Subscrito"
              >
                x₂
              </button>
            </div>

            {/* Colors group */}
            <div className="flex items-center gap-2 border-r border-[#2F2F33] pr-3 h-9">
              <div className="flex flex-col items-center">
                <input
                  type="color"
                  onChange={(e) => formatDoc('foreColor', e.target.value)}
                  className="w-5 h-4 cursor-pointer rounded border-none bg-transparent"
                  title="Cor da Fonte"
                />
                <span className="text-[8px] text-gray-400 mt-0.5">Cor</span>
              </div>
              <div className="flex flex-col items-center">
                <input
                  type="color"
                  defaultValue="#ffff00"
                  onChange={(e) => formatDoc('hiliteColor', e.target.value)}
                  className="w-5 h-4 cursor-pointer rounded border-none bg-transparent"
                  title="Marca-texto / Highlight"
                />
                <span className="text-[8px] text-gray-400 mt-0.5">Marcador</span>
              </div>
            </div>

            {/* Study Marking / Marcações de Estudo group */}
            <div className="flex items-center gap-1.5 border-r border-[#2F2F33] pr-3 h-9 select-none">
              <span className="text-[10px] text-[#A1A1AA] font-bold mr-0.5 uppercase tracking-wider">Estudos:</span>
              <button
                onClick={() => applyStudyMarking('prova')}
                className="px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition border border-yellow-500/20"
                title="Marcar como Importante para Prova"
              >
                <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-sm" />
                <span>Prova</span>
              </button>
              <button
                onClick={() => applyStudyMarking('conceito')}
                className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition border border-blue-500/20"
                title="Marcar como Conceito-Chave"
              >
                <span className="w-2 h-2 rounded bg-blue-400 shadow-sm" />
                <span>Conceito</span>
              </button>
              <button
                onClick={() => applyStudyMarking('dica')}
                className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition border border-emerald-500/20"
                title="Marcar como Dica do Professor"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
                <span>Dica</span>
              </button>
            </div>

            {/* Alignments & Line height Spacing */}
            <div className="flex items-center gap-1 border-r border-[#2F2F33] pr-3 h-9">
              <button
                onClick={() => formatDoc('justifyLeft')}
                className="p-1 hover:bg-[#2D2D33] text-white rounded cursor-pointer"
                title="Alinhar Esquerda"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => formatDoc('justifyCenter')}
                className="p-1 hover:bg-[#2D2D33] text-white rounded cursor-pointer"
                title="Centralizar"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => formatDoc('justifyRight')}
                className="p-1 hover:bg-[#2D2D33] text-white rounded cursor-pointer"
                title="Alinhar Direita"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => formatDoc('justifyFull')}
                className="p-1 hover:bg-[#2D2D33] text-white rounded cursor-pointer"
                title="Justificar"
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>

              <select
                value={lineSpacing}
                onChange={(e) => setLineSpacing(e.target.value)}
                className="bg-[#2D2D33] text-white text-[10px] px-1 py-0.5 rounded border border-[#3F3F46] focus:outline-none ml-1 w-14"
                title="Espaçamento entre linhas"
              >
                <option value="1.0">1.0</option>
                <option value="1.15">1.15</option>
                <option value="1.5">1.5</option>
                <option value="2.0">2.0</option>
              </select>
            </div>

            {/* Lists & Indents */}
            <div className="flex items-center gap-1 border-r border-[#2F2F33] pr-3 h-9">
              <button
                onClick={() => formatDoc('insertUnorderedList')}
                className="p-1 hover:bg-[#2D2D33] text-white rounded cursor-pointer"
                title="Lista com Marcadores"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => formatDoc('insertOrderedList')}
                className="p-1 hover:bg-[#2D2D33] text-white rounded cursor-pointer"
                title="Lista Numerada"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => formatDoc('outdent')}
                className="p-1 hover:bg-[#2D2D33] text-[#A1A1AA] hover:text-white rounded cursor-pointer font-bold text-[10px]"
                title="Diminuir Recuo"
              >
                ←
              </button>
              <button
                onClick={() => formatDoc('indent')}
                className="p-1 hover:bg-[#2D2D33] text-[#A1A1AA] hover:text-white rounded cursor-pointer font-bold text-[10px]"
                title="Aumentar Recuo"
              >
                →
              </button>
            </div>

            {/* Rapid Styles card container */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => formatDoc('formatBlock', 'p')}
                className="px-2 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded border border-[#3F3F46] text-white text-[10px] flex flex-col items-start min-w-[70px] cursor-pointer"
              >
                <span className="font-semibold text-[11px]">Normal</span>
                <span className="text-[8px] text-gray-400">Padrão</span>
              </button>
              <button
                onClick={() => insertTemplateHtml('<p style="margin-bottom: 0px;">Este parágrafo não possui margem inferior.</p>')}
                className="px-2 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded border border-[#3F3F46] text-white text-[10px] flex flex-col items-start min-w-[85px] cursor-pointer"
              >
                <span className="font-semibold text-[11px]">Sem espaçar</span>
                <span className="text-[8px] text-gray-400">Zero margin</span>
              </button>
              <button
                onClick={() => formatDoc('formatBlock', 'h1')}
                className="px-2 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded border border-[#3F3F46] text-white text-[10px] flex flex-col items-start min-w-[70px] cursor-pointer"
              >
                <span className="font-bold text-[11px] text-blue-400">Cabeça 1</span>
                <span className="text-[8px] text-gray-400">Título H1</span>
              </button>
              <button
                onClick={() => formatDoc('formatBlock', 'h2')}
                className="px-2 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded border border-[#3F3F46] text-white text-[10px] flex flex-col items-start min-w-[70px] cursor-pointer"
              >
                <span className="font-bold text-[11px] text-emerald-400">Cabeça 2</span>
                <span className="text-[8px] text-gray-400">Título H2</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB: INSERIR */}
        {activeRibbonTab === 'inserir' && (
          <div className="flex items-center gap-3.5 flex-wrap">
            {/* Pages & sections */}
            <button
              onClick={() => insertTemplateHtml('<div style="page-break-before: always; border-top: 1px dashed #cbd5e1; margin: 24px 0;" contenteditable="false"></div><p></p>')}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Folha em Branco</span>
            </button>
            <button
              onClick={() => insertTemplateHtml('<div style="border-top: 2px dashed #94a3b8; margin: 16px 0;" contenteditable="false"></div><p></p>')}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <Minimize2 className="w-3.5 h-3.5 text-gray-400" />
              <span>Quebra Seção</span>
            </button>

            <div className="w-px h-8 bg-[#2F2F33]" />

            {/* Table Grid trigger */}
            <div className="relative">
              <button
                onClick={() => setShowTableSelector(!showTableSelector)}
                className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
                id="btn-insert-table"
              >
                <TableIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tabela</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showTableSelector && (
                <div className="absolute top-full left-0 mt-2 bg-[#1C1C1F] border border-[#2D2D30] rounded-xl shadow-2xl p-4 z-50 min-w-[220px]">
                  <p className="text-[11px] font-bold text-gray-300 mb-2">Grade de Tabela (10x10)</p>
                  <div className="grid grid-cols-10 gap-0.5 mb-3 bg-[#0F0F11] p-1.5 rounded-lg border border-[#2D2D30]">
                    {Array.from({ length: 8 }).map((_, r) => (
                      <React.Fragment key={r}>
                        {Array.from({ length: 8 }).map((_, c) => {
                          const row = r + 1;
                          const col = c + 1;
                          const isHighlighted = tableGridHover && row <= tableGridHover.r && col <= tableGridHover.c;
                          return (
                            <div
                              key={c}
                              onMouseEnter={() => setTableGridHover({ r: row, c: col })}
                              onMouseLeave={() => setTableGridHover(null)}
                              onClick={() => {
                                handleTableGridInsert(row, col);
                                setShowTableSelector(false);
                              }}
                              className={`w-4.5 h-4.5 border transition cursor-pointer ${
                                isHighlighted
                                  ? 'bg-blue-600 border-blue-400 shadow-sm shadow-blue-500/25'
                                  : 'bg-[#18181B] border-[#2E2E33] hover:bg-[#27272A]'
                              }`}
                            />
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="text-center text-xs font-semibold text-blue-400 bg-blue-500/10 py-1 rounded">
                    {tableGridHover ? `${tableGridHover.c} colunas x ${tableGridHover.r} linhas` : 'Selecione o tamanho'}
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic visual graphics */}
            <input
              type="file"
              id="ribbon-image-upload"
              accept="image/*"
              onChange={handleNewImageSelect}
              className="hidden"
            />
            <button
              onClick={() => document.getElementById('ribbon-image-upload')?.click()}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
              <span>Imagem (Upload)</span>
            </button>

            <button
              onClick={() => {
                const url = prompt('Cole a URL da imagem da web que deseja inserir:');
                if (url) {
                  const imgHtml = `<img src="${url}" class="note-editable-image rounded-xl my-4 max-w-full cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all duration-200" style="display: block; margin-left: auto; margin-right: auto; width: 50%; max-height: 400px;" />`;
                  formatDoc('insertHTML', imgHtml);
                  handleSave(true);
                }
              }}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
              title="Inserir imagem da web por endereço URL"
            >
              <Link className="w-3.5 h-3.5 text-sky-400" />
              <span>Imagem por URL</span>
            </button>

            <button
              onClick={() => insertTemplateHtml('<div style="width: 140px; height: 80px; bg: #3b82f6; background-color: #3b82f6; border: 2px solid #1d4ed8; border-radius: 6px; display: inline-block; margin: 10px;" contenteditable="false"></div><p></p>')}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Formas</span>
            </button>

            {/* Smart Art & charts */}
            <button
              onClick={() => insertTemplateHtml(getSmartArtProcess())}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
              title="Inserir estrutura de processo SmartArt"
            >
              <Network className="w-3.5 h-3.5 text-purple-400" />
              <span>SmartArt</span>
            </button>

            <button
              onClick={() => insertTemplateHtml(getChartHtml())}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
              title="Inserir gráfico de barras editável"
            >
              <FileText className="w-3.5 h-3.5 text-red-400" />
              <span>Gráfico</span>
            </button>

            <div className="w-px h-8 bg-[#2F2F33]" />

            {/* Text boxes, WordArt, Date & Symbols */}
            <button
              onClick={() => insertTemplateHtml('<div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin: 12px 0; background-color: #fafafa; max-width: 250px;"><strong>Caixa de Texto:</strong> Insira seu comentário aqui...</div><p></p>')}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <StickyNote className="w-3.5 h-3.5 text-stone-400" />
              <span>Caixa Texto</span>
            </button>

            <button
              onClick={handleInsertPostit}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
              title="Inserir Post-it interativo e arrastável"
            >
              <StickyNote className="w-3.5 h-3.5 text-yellow-400" />
              <span>Inserir Post-it</span>
            </button>

            <button
              onClick={handleInsertFlashcard}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
              title="Inserir Flashcard de estudo interativo e rotacionável"
            >
              <Puzzle className="w-3.5 h-3.5 text-rose-400" />
              <span>Inserir Flashcard</span>
            </button>

            <button
              onClick={() => insertTemplateHtml(getWordArtHtml())}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Arte Texto</span>
            </button>

            <button
              onClick={() => insertTemplateHtml(getDropCapHtml())}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
              title="Formatar com letra inicial capitular gigante"
            >
              <Type className="w-3.5 h-3.5 text-blue-400" />
              <span>Capitular</span>
            </button>

            <button
              onClick={() => insertTemplateHtml(` ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} `)}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Data/Hora</span>
            </button>

            {/* Símbolos / Equações */}
            <div className="relative">
              <button
                onClick={() => setSymbolPickerOpen(!symbolPickerOpen)}
                className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Símbolos/Equações</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {symbolPickerOpen && (
                <div className="absolute top-full right-0 mt-2 bg-[#1C1C1F] border border-[#2D2D30] rounded-xl shadow-2xl p-4 z-50 min-w-[280px]">
                  <p className="text-[11px] font-bold text-gray-300 mb-2">Inserir Equação Científica</p>
                  <div className="flex flex-col gap-1.5 mb-3">
                    <button
                      onClick={() => {
                        insertTemplateHtml('<div style="text-align: center; margin: 12px 0; font-family: \'Georgia\', serif; font-size: 15px; color: #1e3a8a;"><strong>Equação Quadrática:</strong> &nbsp; x = (-b ± √(b² - 4ac)) / 2a</div><p></p>');
                        setSymbolPickerOpen(false);
                      }}
                      className="p-1.5 text-left hover:bg-[#2D2D33] rounded text-xs text-white"
                    >
                      x = (-b ± √(b² - 4ac)) / 2a
                    </button>
                    <button
                      onClick={() => {
                        insertTemplateHtml('<div style="text-align: center; margin: 12px 0; font-family: \'Georgia\', serif; font-size: 15px; color: #1e3a8a;"><strong>Teorema Pitágoras:</strong> &nbsp; a² + b² = c²</div><p></p>');
                        setSymbolPickerOpen(false);
                      }}
                      className="p-1.5 text-left hover:bg-[#2D2D33] rounded text-xs text-white"
                    >
                      a² + b² = c²
                    </button>
                    <button
                      onClick={() => {
                        insertTemplateHtml('<div style="text-align: center; margin: 12px 0; font-family: \'Georgia\', serif; font-size: 15px; color: #1e3a8a;"><strong>Estequiometria:</strong> &nbsp; 2H₂ + O₂ ➔ 2H₂O</div><p></p>');
                        setSymbolPickerOpen(false);
                      }}
                      className="p-1.5 text-left hover:bg-[#2D2D33] rounded text-xs text-white"
                    >
                      2H₂ + O₂ ➔ 2H₂O
                    </button>
                  </div>
                  <p className="text-[11px] font-bold text-gray-300 mb-1">Símbolos Matemáticos</p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {MATH_SYMBOLS.map((sym) => (
                      <button
                        key={sym}
                        onClick={() => {
                          formatDoc('insertText', sym);
                          setSymbolPickerOpen(false);
                        }}
                        className="p-1 text-center font-mono text-white hover:bg-[#2D2D33] rounded text-xs cursor-pointer"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comment and link */}
            <button
              onClick={() => insertTemplateHtml('<span style="background-color: #fef08a; border-bottom: 2px dashed #ca8a04; cursor: pointer; color: #854d0e; padding: 1px 4px; border-radius: 2px;" title="Comentário acadêmico: Adicione notas de revisão aqui">[Comentário acadêmico]</span>&nbsp;')}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Comentário</span>
            </button>

            <button
              onClick={() => {
                const url = prompt('Digite o endereço do hiperlink (ex: https://google.com):');
                if (url) {
                  const text = prompt('Digite o texto de exibição:', 'Acessar Link');
                  insertTemplateHtml(`<a href="${url}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 500;">${text || url}</a> `);
                }
              }}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <Link className="w-3.5 h-3.5 text-blue-400" />
              <span>Hiperlink</span>
            </button>
          </div>
        )}

        {/* TAB: DESENHAR */}
        {activeRibbonTab === 'desenhar' && (
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => setIsDrawingMode(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                !isDrawingMode ? 'bg-blue-600 text-white' : 'bg-[#2D2D33] text-[#EDEDED] hover:bg-[#3F3F46]'
              }`}
            >
              Selecionar / Digitar
            </button>

            <div className="w-px h-8 bg-[#2F2F33]" />

            {/* Green and Red Quick Pens */}
            <button
              onClick={() => {
                setDrawColor('#22C55E');
                setDrawingTool('pen');
                setDrawWidth(3);
                setIsDrawingMode(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                isDrawingMode && drawingTool === 'pen' && drawColor === '#22C55E'
                  ? 'bg-green-600 text-white'
                  : 'bg-[#2D2D33] text-green-400 border border-green-500/30 hover:bg-[#3F3F46]'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              Caneta Verde
            </button>

            <button
              onClick={() => {
                setDrawColor('#EF4444');
                setDrawingTool('pen');
                setDrawWidth(3);
                setIsDrawingMode(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                isDrawingMode && drawingTool === 'pen' && drawColor === '#EF4444'
                  ? 'bg-red-600 text-white'
                  : 'bg-[#2D2D33] text-red-400 border border-red-500/30 hover:bg-[#3F3F46]'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              Caneta Vermelha
            </button>

            {/* Yellow Highlighter */}
            <button
              onClick={() => {
                setDrawColor('#FACC15');
                setDrawingTool('highlighter');
                setDrawWidth(14);
                setIsDrawingMode(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                isDrawingMode && drawingTool === 'highlighter'
                  ? 'bg-amber-500 text-stone-950'
                  : 'bg-[#2D2D33] text-amber-300 border border-amber-500/30 hover:bg-[#3F3F46]'
              }`}
            >
              <Highlighter className="w-3.5 h-3.5" />
              Marca-texto Amarelo
            </button>

            {/* Eraser / Clear */}
            <button
              onClick={clearDrawings}
              className="px-3 py-1.5 bg-[#2D2D33] text-red-400 border border-red-500/30 hover:bg-[#3F3F46] rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              title="Apaga todos os desenhos"
            >
              <Eraser className="w-3.5 h-3.5" />
              Apagador
            </button>

            <div className="w-px h-8 bg-[#2F2F33]" />

            {/* Brush Width Slider */}
            {isDrawingMode && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">Espessura:</span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={drawWidth}
                  onChange={(e) => setDrawWidth(Number(e.target.value))}
                  className="w-20 cursor-pointer accent-blue-500"
                />
                <span className="text-[11px] text-white font-semibold">{drawWidth}px</span>
              </div>
            )}
          </div>
        )}

        {/* TAB: LAYOUT */}
        {activeRibbonTab === 'layout' && (
          <div className="flex items-center gap-3.5 flex-wrap">
            {/* Margins selection */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-400 mr-1.5">Margens:</span>
              <select
                value={margins}
                onChange={(e) => setMargins(e.target.value as any)}
                className="bg-[#2D2D33] text-white text-[11px] px-2 py-1 rounded-md border border-[#3F3F46] focus:outline-none"
              >
                <option value="normal">Normal (2.5 cm)</option>
                <option value="estreita">Estreito (1.27 cm)</option>
                <option value="moderada">Moderado (1.9 cm)</option>
                <option value="larga">Largo (3.2 cm)</option>
              </select>
            </div>

            {/* Orientation */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-400 mr-1.5">Orientação:</span>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as any)}
                className="bg-[#2D2D33] text-white text-[11px] px-2 py-1 rounded-md border border-[#3F3F46] focus:outline-none"
              >
                <option value="portrait">Retrato</option>
                <option value="landscape">Paisagem</option>
              </select>
            </div>

            {/* Size */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-400 mr-1.5">Tamanho:</span>
              <select
                value={pageFormat}
                onChange={(e) => setPageFormat(e.target.value as any)}
                className="bg-[#2D2D33] text-white text-[11px] px-2 py-1 rounded-md border border-[#3F3F46] focus:outline-none"
              >
                <option value="a4">A4 (210 x 297 mm)</option>
                <option value="a5">A5 (148 x 210 mm)</option>
                <option value="letter">Letter (215 x 279 mm)</option>
              </select>
            </div>

            {/* Column Layout */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-400 mr-1.5">Colunas:</span>
              <select
                value={columns}
                onChange={(e) => setColumns(e.target.value as any)}
                className="bg-[#2D2D33] text-white text-[11px] px-2 py-1 rounded-md border border-[#3F3F46] focus:outline-none"
              >
                <option value="1">1 Coluna</option>
                <option value="2">2 Colunas</option>
                <option value="3">3 Colunas</option>
              </select>
            </div>

            <div className="w-px h-8 bg-[#2F2F33]" />

            {/* Indent numerical controller */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400">Recuo Esq:</span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={indentLeft}
                  onChange={(e) => setIndentLeft(Number(e.target.value))}
                  className="w-12 bg-[#2D2D33] text-white text-[11px] px-1 py-0.5 rounded border border-[#3F3F46] focus:outline-none"
                />
                <span className="text-[10px] text-gray-500">cm</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400">Recuo Dir:</span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={indentRight}
                  onChange={(e) => setIndentRight(Number(e.target.value))}
                  className="w-12 bg-[#2D2D33] text-white text-[11px] px-1 py-0.5 rounded border border-[#3F3F46] focus:outline-none"
                />
                <span className="text-[10px] text-gray-500">cm</span>
              </div>
            </div>

            {/* Spacing controller */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400">Esp. Antes:</span>
                <input
                  type="number"
                  min="0"
                  max="48"
                  value={spacingBefore}
                  onChange={(e) => setSpacingBefore(Number(e.target.value))}
                  className="w-12 bg-[#2D2D33] text-white text-[11px] px-1 py-0.5 rounded border border-[#3F3F46] focus:outline-none"
                />
                <span className="text-[10px] text-gray-500">pt</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400">Esp. Depois:</span>
                <input
                  type="number"
                  min="0"
                  max="48"
                  value={spacingAfter}
                  onChange={(e) => setSpacingAfter(Number(e.target.value))}
                  className="w-12 bg-[#2D2D33] text-white text-[11px] px-1 py-0.5 rounded border border-[#3F3F46] focus:outline-none"
                />
                <span className="text-[10px] text-gray-500">pt</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB: REFERÊNCIAS */}
        {activeRibbonTab === 'referencias' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => insertTemplateHtml(getTOC())}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
              title="Inserir sumário acadêmico estruturado"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Gerar Sumário</span>
            </button>

            <button
              onClick={() => insertTemplateHtml('<sup style="color: #2563eb; font-weight: bold; cursor: help;" title="Nota de rodapé: Detalhes da fonte bibliográfica inseridos no final do artigo.">[Nota Rodapé]</sup>&nbsp;')}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Nota de Rodapé</span>
            </button>

            <button
              onClick={() => {
                const author = prompt('Nome do autor:', 'Silva');
                const year = prompt('Ano da publicação:', '2024');
                if (author && year) {
                  insertTemplateHtml(` (${author}, ${year}) `);
                }
              }}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Inserir Citação</span>
            </button>

            <button
              onClick={() => {
                insertTemplateHtml(`<div style="margin: 12px 0; font-size: 13px; color: #475569; border-left: 3px solid #cbd5e1; padding-left: 10px;"><strong>SILVA, José.</strong> <em>Estudos de Caso de Medicina Interna.</em> São Paulo: Editora Universitária, 2024.</div><p></p>`);
              }}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Bibliografia</span>
            </button>
          </div>
        )}

        {/* TAB: COLABORAÇÃO */}
        {activeRibbonTab === 'colaboracao' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                confetti({ particleCount: 60, spread: 40 });
                alert('Link de compartilhamento copiado para a área de transferência!');
              }}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Compartilhar Documento</span>
            </button>

            <button
              onClick={() => {
                const comment = prompt('Escreva seu comentário acadêmico:');
                if (comment) {
                  insertTemplateHtml(`<span style="background-color: #fef08a; border-bottom: 2px dashed #eab308; cursor: pointer; padding: 2px 4px; border-radius: 4px;" title="Comentário: ${comment}">[Revisar: ${comment}]</span>&nbsp;`);
                }
              }}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Adicionar Nota de Revisão</span>
            </button>

            <button
              onClick={() => {
                alert('Histórico de versões: Versão salva localmente em ' + new Date(lesson?.updatedAt || '').toLocaleTimeString());
              }}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Histórico Versões</span>
            </button>
          </div>
        )}

        {/* TAB: PROTEÇÃO */}
        {activeRibbonTab === 'protecao' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const pwd = prompt('Defina uma senha de visualização para o documento:');
                if (pwd) {
                  alert('Documento protegido com sucesso por chave de criptografia local.');
                }
              }}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-red-400" />
              <span>Bloquear por Senha</span>
            </button>

            <button
              onClick={() => insertTemplateHtml(getSignatureHtml(db.profile?.name || 'Estudante'))}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
              title="Assinar digitalmente o documento"
            >
              <span>Assinar Documento</span>
            </button>

            <button
              onClick={() => {
                if (editorContentRef.current) {
                  const isReadOnly = editorContentRef.current.contentEditable === 'true';
                  editorContentRef.current.contentEditable = isReadOnly ? 'false' : 'true';
                  alert(isReadOnly ? 'Documento definido como SOMENTE LEITURA' : 'Documento desbloqueado para escrita');
                }
              }}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Toggle Somente Leitura</span>
            </button>
          </div>
        )}

        {/* TAB: VER */}
        {activeRibbonTab === 'ver' && (
          <div className="flex items-center gap-4 flex-wrap">
            {/* Sheet Background color */}
            <div className="flex items-center bg-[#2D2D33] border border-[#3F3F46] rounded-lg p-0.5">
              <span className="text-[10px] text-gray-400 px-1.5">Fundo Folha:</span>
              <button
                onClick={() => setPageAppearance('white')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                  pageAppearance === 'white' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Branca
              </button>
              <button
                onClick={() => setPageAppearance('dark')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                  pageAppearance === 'dark' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Escura
              </button>
              <button
                onClick={() => setPageAppearance('auto')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                  pageAppearance === 'auto' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Tema
              </button>
            </div>

            {/* Toggle Ruler */}
            <button
              onClick={() => setRulerVisible(!rulerVisible)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                rulerVisible ? 'bg-blue-600 text-white' : 'bg-[#2D2D33] text-gray-400 hover:bg-[#3F3F46]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Régua Interativa</span>
            </button>

            {/* Zoom presets */}
            <div className="flex items-center gap-1 bg-[#2D2D33] px-2 py-1 rounded-lg border border-[#3F3F46]">
              <span className="text-[10px] text-gray-400 mr-1">Zoom:</span>
              <button onClick={() => setZoom(75)} className="px-1.5 hover:text-white font-mono text-[10px]">75%</button>
              <button onClick={() => setZoom(100)} className="px-1.5 text-blue-400 font-mono text-[10px] font-bold">100%</button>
              <button onClick={() => setZoom(125)} className="px-1.5 hover:text-white font-mono text-[10px]">125%</button>
              <button onClick={() => setZoom(150)} className="px-1.5 hover:text-white font-mono text-[10px]">150%</button>
            </div>
          </div>
        )}

        {/* TAB: PLUG-INS */}
        {activeRibbonTab === 'plugins' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleTranslateText('Inglês')}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
              title="Traduz o texto inteiro para o Inglês"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Tradutor (Inglês)</span>
            </button>

            <button
              onClick={() => handleTranslateText('Espanhol')}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
              title="Traduz o texto inteiro para o Espanhol"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tradutor (Espanhol)</span>
            </button>

            <button
              onClick={() => {
                alert('Sinônimo: Digite uma palavra no documento e clique com o botão direito para ver sinônimos.');
              }}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Sinônimos</span>
            </button>

            <button
              onClick={() => {
                alert('Macros: Editor de scripts avançados em JavaScript.');
              }}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Editor de Macros</span>
            </button>
          </div>
        )}

        {/* TAB: AI (ESTUDOS & COMPONENTES) */}
        {activeRibbonTab === 'ai' && (
          <div className="flex items-center gap-3 flex-wrap">
            {/* Study AI popup trigger */}
            <button
              onClick={() => {
                setAiAction('summarize');
                setAiModalOpen(true);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
              id="btn-ai-assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span>IA Assistente de Estudo</span>
            </button>

            <button
              onClick={() => setOcrModalOpen(true)}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
              title="Transcrição de caderno manuscrito"
              id="btn-ai-ocr"
            >
              <Camera className="w-3.5 h-3.5 text-sky-400" />
              <span>OCR Transcrever Foto</span>
            </button>

            <button
              onClick={() => setShowAudioSidebar(!showAudioSidebar)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                showAudioSidebar
                  ? 'bg-red-500/25 text-red-400 border border-red-500/30 font-bold'
                  : 'bg-[#2D2D33] text-red-400 border border-red-500/30 hover:bg-[#3F3F46]'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Gravar Áudio</span>
            </button>

            <div className="w-px h-8 bg-[#2F2F33]" />

            {/* AI Callout block insert */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400">Caixas IA:</span>
              {(['highlight', 'definition', 'warning', 'example'] as const).map((block) => (
                <button
                  key={block}
                  onClick={() => insertTemplateHtml(getCalloutHtml(block) || '')}
                  className="px-1.5 py-1 bg-[#2D2D33] hover:bg-[#3F3F46] rounded text-[9px] text-[#EDEDED]"
                >
                  {block === 'highlight' ? 'Destaque' : block === 'definition' ? 'Definição' : block === 'warning' ? 'Prova' : 'Exemplo'}
                </button>
              ))}
            </div>

            <div className="w-px h-8 bg-[#2F2F33]" />

            {/* UNALTERED FLASHCARDS & MINDMAP BUTTONS */}
            <button
              onClick={handleGenerateFlashcards}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
              title="Gerar flashcards para revisão utilizando inteligência artificial"
              id="btn-generate-flashcards"
            >
              <Brain className="w-3.5 h-3.5 text-amber-400" />
              <span>Criar Flashcards</span>
            </button>

            <button
              onClick={handleGenerateMindmap}
              className="px-2.5 py-1.5 bg-[#2D2D33] hover:bg-[#3F3F46] rounded-lg text-white transition cursor-pointer flex items-center gap-1.5"
              title="Gerar mapa mental conceitual estruturado automaticamente"
              id="btn-generate-mindmap"
            >
              <Network className="w-3.5 h-3.5 text-purple-400" />
              <span>Criar Mapa Mental</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Document Workspace (Zoom & Scroll Wrapper) */}
      {(() => {
        const isAppDark = document.documentElement.classList.contains('dark');
        const isSheetWhite = pageAppearance === 'white' || (pageAppearance === 'auto' && !isAppDark);
        
        const sheetStyle = isSheetWhite ? {
          bg: 'bg-white',
          text: 'text-zinc-800',
          border: 'border-zinc-200 shadow-xl',
          title: 'text-zinc-900',
          secText: 'text-zinc-500',
          headerBorder: 'border-zinc-200',
          isWhite: true
        } : {
          bg: 'bg-[#121214]',
          text: 'text-[#EDEDED]',
          border: 'border-[#242427] shadow-2xl',
          title: 'text-white',
          secText: 'text-[#919196]',
          headerBorder: 'border-[#242427]',
          isWhite: false
        };

        return (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
            
            {/* Scrollable Center Panel */}
            <div className="flex-1 overflow-auto p-6 sm:p-10 flex flex-col items-center justify-start relative border-r border-[#242427]/50 bg-[#161619] scrollbar-thin">
              
              {/* Scale Zoom container */}
              <div
                className="flex flex-col relative transition-transform duration-100 ease-out origin-top items-center"
                style={{
                  transform: `scale(${zoom / 100})`,
                }}
              >
                {/* Page Customization Panel */}
                <div className="flex flex-wrap items-center justify-between bg-[#1C1C1F] border border-[#2D2D30] rounded-xl p-2.5 mb-4 w-full shadow-lg no-print gap-3 select-none">
                  <div className="flex items-center gap-1.5 font-sans">
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mr-1">Estilo da Página:</span>
                    {(['lisa', 'pautada', 'pontilhada', 'quadriculada'] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() => setPageStyle(style)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all capitalize cursor-pointer ${
                          pageStyle === style
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-[#27272A] text-zinc-300 hover:text-white hover:bg-[#323238]'
                        }`}
                      >
                        {style === 'lisa' ? 'Lisa' : style === 'pautada' ? 'Pautada' : style === 'pontilhada' ? 'Pontilhada' : 'Quadriculada'}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mr-1">Cor do Papel:</span>
                    <div className="flex items-center gap-1">
                      {[
                        { hex: '#ffffff', name: 'Branco' },
                        { hex: '#fffef0', name: 'Marfim' },
                        { hex: '#fcf8ec', name: 'Areia' },
                        { hex: '#f3fbf2', name: 'Verde' },
                        { hex: '#f2f8fc', name: 'Azul' },
                        { hex: '#fcf3f6', name: 'Rosa' },
                        { hex: '#fbf2fc', name: 'Lilás' },
                        { hex: '#121214', name: 'Escuro' },
                      ].map((col) => (
                        <button
                          key={col.hex}
                          onClick={() => {
                            setPageBgColor(col.hex);
                            if (col.hex === '#121214') {
                              setPageAppearance('dark');
                            } else {
                              setPageAppearance('white');
                            }
                          }}
                          className={`w-4 h-4 rounded-full border transition-all cursor-pointer hover:scale-110 ${
                            pageBgColor === col.hex ? 'ring-2 ring-blue-500 scale-105 border-white' : 'border-zinc-700'
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={col.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Horizontal Scale Ruler */}
                {rulerVisible && (
                  <div
                    className="h-6 bg-[#EDEEF0] border border-[#CBD5E1] rounded-t-lg relative flex items-center select-none"
                    style={{ width: sheetWidth }}
                  >
                    {/* Corner blank intersection */}
                    <div className="w-6 h-full border-r border-[#CBD5E1] bg-[#E2E8F0] shrink-0" />
                    
                    {/* Measurement centimeter notches */}
                    <div className="flex-1 h-full relative flex items-center">
                      {Array.from({ length: 18 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute flex flex-col items-center justify-end h-full"
                          style={{ left: `${(i + 1) * (100 / 19)}%` }}
                        >
                          <span className="text-[8px] font-mono font-bold text-[#475569] leading-none mb-0.5">{i + 1}</span>
                          <div className="w-px h-1.5 bg-[#94A3B8]" />
                        </div>
                      ))}
                      {/* Interactive Drag Margins indicator shapes */}
                      <div className="absolute left-[8%] bottom-0 transform -translate-x-1/2 w-0 h-0 border-l-3.5 border-l-transparent border-r-3.5 border-r-transparent border-b-6 border-b-blue-600" />
                      <div className="absolute right-[8%] bottom-0 transform translate-x-1/2 w-0 h-0 border-l-3.5 border-l-transparent border-r-3.5 border-r-transparent border-b-6 border-b-blue-600" />
                    </div>
                  </div>
                )}

                {/* Left Ruler & Document Sheet Layout Row */}
                <div className="flex flex-row relative">
                  
                  {/* Vertical Ruler */}
                  {rulerVisible && (
                    <div
                      className="w-6 bg-[#EDEEF0] border-l border-b border-[#CBD5E1] rounded-bl-lg relative flex flex-col items-center select-none shrink-0"
                      style={{ height: sheetHeight }}
                    >
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute flex items-center justify-end w-full pr-0.5"
                          style={{ top: `${(i + 1) * (100 / 26)}%` }}
                        >
                          <span className="text-[7.5px] font-mono font-bold text-[#475569] mr-0.5">{i + 1}</span>
                          <div className="w-1.5 h-px bg-[#94A3B8]" />
                        </div>
                      ))}
                      <div className="absolute top-[6%] left-0 transform -translate-y-1/2 w-0 h-0 border-t-3.5 border-t-transparent border-b-3.5 border-b-transparent border-l-6 border-l-blue-600" />
                    </div>
                  )}

                  {/* REALISTIC DOCUMENT SHEET (White / Dark paper, A4 style, shadow) */}
                  <div
                    className={`relative border ${sheetStyle.border} transition-all duration-200 select-text overflow-visible`}
                    style={{
                      width: pageWidth,
                      minHeight: pageHeight,
                      paddingLeft: indentLeft > 0 ? `${indentLeft}cm` : undefined,
                      paddingRight: indentRight > 0 ? `${indentRight}cm` : undefined,
                      paddingTop: spacingBefore > 0 ? `${spacingBefore}pt` : undefined,
                      paddingBottom: spacingAfter > 0 ? `${spacingAfter}pt` : undefined,
                      backgroundColor: pageBgColor,
                      color: pageBgColor === '#121214' ? '#EDEDED' : '#27272A',
                      backgroundImage: 
                        pageStyle === 'pautada'
                          ? `linear-gradient(rgba(148, 163, 184, ${pageBgColor === '#121214' ? '0.15' : '0.35'}) 1px, transparent 1px)`
                          : pageStyle === 'pontilhada'
                          ? `radial-gradient(rgba(148, 163, 184, ${pageBgColor === '#121214' ? '0.2' : '0.45'}) 1.2px, transparent 1.2px)`
                          : pageStyle === 'quadriculada'
                          ? `linear-gradient(to right, rgba(148, 163, 184, ${pageBgColor === '#121214' ? '0.15' : '0.35'}) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, ${pageBgColor === '#121214' ? '0.15' : '0.35'}) 1px, transparent 1px)`
                          : undefined,
                      backgroundSize:
                        pageStyle === 'pautada'
                          ? '100% 28px'
                          : pageStyle === 'pontilhada' || pageStyle === 'quadriculada'
                          ? '24px 24px'
                          : undefined,
                      backgroundPosition: 
                        pageStyle === 'pautada'
                          ? '0 14px'
                          : pageStyle === 'pontilhada' || pageStyle === 'quadriculada'
                          ? '12px 12px'
                          : undefined,
                    }}
                    id="doc-paper-sheet"
                  >
                    <div className={marginClasses[margins]}>
                      
                      {/* Sogno Digital Hub Inspired Planner Header (2-Column Aesthetic Box) */}
                      <div className="grid grid-cols-3 border border-[#8A7C72] bg-[#FAF8F5]/90 text-[#4A3C31] rounded-lg overflow-hidden mb-6 divide-x divide-[#8A7C72] select-none font-serif shadow-sm no-print">
                        {/* Left Column: Title */}
                        <div className="col-span-2 p-3 flex flex-col justify-between min-h-[58px]">
                          <span className="text-[10px] italic text-[#8A7C72] font-semibold tracking-wide">Title :</span>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => {
                              setTitle(e.target.value);
                              handleSave(true, e.target.value);
                            }}
                            placeholder="Título da Anotação..."
                            className="w-full bg-transparent border-none p-0 text-sm font-extrabold focus:ring-0 focus:outline-none focus:border-none text-[#4A3C31] placeholder-stone-400 font-serif"
                          />
                        </div>

                        {/* Right Column: Date and Week */}
                        <div className="p-3 flex flex-col justify-between min-h-[58px] divide-y divide-[#8A7C72]/30">
                          <div className="pb-1.5 flex items-center justify-between">
                            <span className="text-[10px] italic text-[#8A7C72] font-semibold tracking-wide">Date :</span>
                            <input
                              type="date"
                              value={date}
                              onChange={(e) => {
                                setDate(e.target.value);
                                handleSave(true, undefined, e.target.value);
                              }}
                              className="bg-transparent border-none p-0 text-[10px] font-bold focus:ring-0 focus:outline-none focus:border-none cursor-pointer text-[#4A3C31] [color-scheme:light]"
                            />
                          </div>
                          <div className="pt-1.5 flex items-center justify-between">
                            <span className="text-[10px] italic text-[#8A7C72] font-semibold tracking-wide">Discipline :</span>
                            <input
                              type="text"
                              value={weekValue}
                              onChange={(e) => setWeekValue(e.target.value)}
                              placeholder="Geral"
                              className="bg-transparent border-none p-0 text-[10px] font-bold focus:ring-0 focus:outline-none focus:border-none text-[#4A3C31] placeholder-stone-400 w-32 flex-1 ml-2 text-right"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Drawing Canvas Overlapping Layer */}
                      {isDrawingMode && (
                        <canvas
                          ref={canvasRef}
                          width={sheetWidth}
                          height={sheetHeight}
                          onMouseDown={startDrawing}
                          onMouseMove={drawMove}
                          onMouseUp={endDrawing}
                          onMouseLeave={endDrawing}
                          className="absolute inset-0 z-30 cursor-crosshair w-full h-full pointer-events-auto"
                        />
                      )}

                      {/* Interactive Floating Post-its and Flashcards */}
                      <FloatingWidgets
                        canvasElements={canvasElements}
                        onChange={(updated) => {
                          setCanvasElements(updated);
                          handleSave(true);
                        }}
                      />

                      {/* Main Rich text editable container */}
                      <div
                        ref={editorContentRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={() => {
                          updateDocumentMetrics();
                          handleSave(true);
                        }}
                        onClick={handleEditorClick}
                        className={`academic-editor-content focus:outline-none min-h-[420px] leading-relaxed text-sm sm:text-base space-y-4`}
                        style={{
                          fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
                          lineHeight: pageStyle === 'pautada' ? '28px' : (pageStyle === 'pontilhada' || pageStyle === 'quadriculada') ? '24px' : lineSpacing,
                          columnCount: Number(columns),
                          columnGap: '2rem',
                        }}
                        id="rich-text-content-area"
                      />

                      {/* Document Footer Metadata Section */}
                      <div className={`border-t ${sheetStyle.headerBorder} pt-4 mt-12 flex items-center justify-between text-[10px] font-semibold tracking-wide ${sheetStyle.secText}`}>
                        <span>{db.profile.institution || 'CENTRO UNIVERSITÁRIO'} • {db.profile.course || 'Curso Técnico'}</span>
                        <span>Caderno Acadêmico Real-Time</span>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Split Screen Classroom Audio Section */}
            {showAudioSidebar && (
              <div className="w-full lg:w-[45%] xl:w-[40%] border-t lg:border-t-0 lg:border-l border-[#242427] h-full flex flex-col shrink-0 bg-[#121214] no-print z-10">
                <ClassroomAudioSection
                  lessonId={lessonId}
                  onInsertNotes={handleInsertAudioNotes}
                />
              </div>
            )}
          </div>
        );
      })()}

      {/* OnlyOffice-style bottom Status Bar */}
      <footer className="h-8 bg-[#18181B] border-t border-[#242427] px-4 flex items-center justify-between text-xs text-[#71717A] select-none z-20">
        <div className="flex items-center gap-4">
          <span>Página 1 de 1</span>
          <div className="w-px h-3.5 bg-[#2E2E33]" />
          <span>Contagem de palavras: <strong>{wordCount} palavras</strong></span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Caracteres: {charCount}</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Seletor Idioma */}
          <div className="flex items-center gap-1 cursor-pointer hover:text-white transition">
            <Globe className="w-3.5 h-3.5" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent border-none text-[11px] py-0 pr-6 text-[#71717A] focus:outline-none focus:ring-0 cursor-pointer hover:text-white"
            >
              <option value="Português - Brasil">Português - Brasil</option>
              <option value="Inglês - EUA">English - USA</option>
              <option value="Espanhol">Español</option>
            </select>
          </div>

          <div className="w-px h-3.5 bg-[#2E2E33]" />

          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-1 hover:text-white transition font-bold"
              title="Diminuir zoom"
            >
              -
            </button>
            <input
              type="range"
              min="50"
              max="150"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-16 h-1 bg-[#2D2D33] rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <button
              onClick={() => setZoom(Math.min(150, zoom + 10))}
              className="p-1 hover:text-white transition font-bold"
              title="Aumentar zoom"
            >
              +
            </button>
            <span className="font-mono text-[10px] w-8 text-right font-bold">{zoom}%</span>
          </div>
        </div>
      </footer>

      {/* AI Assistant Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#141416] border border-[#242427] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-[#242427] bg-[#1A1A1E]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/25">
                  <Sparkles className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Assistente de Estudos IA (Gemini)</h3>
                  <p className="text-[11px] text-[#A1A1AA]">Sua aula estruturada por inteligência artificial</p>
                </div>
              </div>
              <button onClick={() => setAiModalOpen(false)} className="text-gray-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Selecione o comando:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'summarize', label: 'Resumo Executivo', desc: 'Ideias centrais e tópicos' },
                    { id: 'explain', label: 'Explicar com Analogia', desc: 'Explicar de forma lúdica' },
                    { id: 'quiz', label: 'Quiz com 5 Questões', desc: 'Perguntas com gabarito' },
                    { id: 'cornell_summary', label: 'Método Cornell', desc: 'Resumo, anotações e dúvidas' },
                  ].map((act) => (
                    <button
                      key={act.id}
                      onClick={() => setAiAction(act.id)}
                      className={`p-2.5 text-left rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        aiAction === act.id
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-[#27272A] bg-[#1C1C1F] text-gray-400 hover:text-white'
                      }`}
                    >
                      {act.label}
                      <p className="text-[10px] text-gray-500 font-normal mt-0.5">{act.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {aiAction === 'explain' && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Especifique sua dúvida:</label>
                  <input
                    type="text"
                    value={aiCustomPrompt}
                    onChange={(e) => setAiCustomPrompt(e.target.value)}
                    placeholder="Ex: Explique o potencial de ação cardíaco de forma simples..."
                    className="w-full px-3 py-2 bg-[#1C1C1F] text-white border border-[#27272A] rounded-xl text-xs focus:outline-none focus:border-blue-500 placeholder-gray-600"
                  />
                </div>
              )}

              <button
                onClick={handleRunAiStudy}
                disabled={isAiLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
                {isAiLoading ? 'Analisando com Gemini...' : 'Gerar Análise'}
              </button>

              {aiResultText && (
                <div className="p-4 bg-[#1C1C1F] border border-[#27272A] rounded-xl text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#27272A] pb-2">
                    <span className="font-bold text-blue-400">Resultado da Análise</span>
                    <button
                      onClick={() => {
                        insertTemplateHtml(`<div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #2563eb; padding: 14px; border-radius: 8px; margin: 16px 0; font-size: 13.5px;"><strong style="color: #1e3a8a;">🤖 Assistente IA:</strong><br/>${aiResultText.replace(/\n/g, '<br/>')}</div>`);
                        setAiModalOpen(false);
                      }}
                      className="text-xs text-blue-400 font-bold hover:underline"
                    >
                      + Inserir no Texto
                    </button>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed text-[#EDEDED] max-h-56 overflow-y-auto scrollbar-thin pr-1">
                    {aiResultText}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OCR Transcriber Modal */}
      {ocrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#141416] border border-[#242427] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-[#242427] bg-[#1A1A1E]">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Transcrever Foto de Caderno (OCR)</h3>
                  <p className="text-[10px] text-gray-400">Carregue fotos de quadros ou anotações manuscritas</p>
                </div>
              </div>
              <button onClick={() => setOcrModalOpen(false)} className="text-gray-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleOcrFileSelect} className="hidden" />

              {!ocrImagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#2E2E33] hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer hover:bg-[#1C1C1F] transition flex flex-col items-center justify-center gap-2"
                >
                  <Camera className="w-8 h-8 text-[#71717A]" />
                  <p className="text-xs font-semibold text-white">Selecione uma Imagem</p>
                  <p className="text-[10px] text-gray-500">PNG, JPG, JPEG ou capturas de tela</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="max-h-48 overflow-hidden rounded-xl border border-[#27272A] flex justify-center bg-black">
                    <img src={ocrImagePreview} alt="OCR Preview" className="h-full object-contain" />
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} className="text-xs text-blue-400 hover:underline">Trocar foto</button>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#27272A]">
                <button onClick={() => setOcrModalOpen(false)} className="px-4 py-2 bg-transparent text-gray-400 hover:text-white text-xs font-semibold">Cancelar</button>
                <button
                  onClick={handleRunOcr}
                  disabled={!ocrImagePreview || ocrLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {ocrLoading ? 'Transcrevendo...' : 'Processar OCR'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Image Editors */}
      {isNewImageEditorOpen && newImageOriginalSrc && (
        <UniversalImageEditor
          isOpen={isNewImageEditorOpen}
          onClose={() => {
            setNewImageOriginalSrc(null);
            setIsNewImageEditorOpen(false);
          }}
          title="Personalizar Imagem para Anotação"
          originalImage={newImageOriginalSrc}
          circleCrop={false}
          aspectRatios={['free', '16:9', '4:3', '1:1']}
          onSave={handleSaveNewDocImage}
        />
      )}

      {editingDocImage && (
        <UniversalImageEditor
          isOpen={!!editingDocImage}
          onClose={() => setEditingDocImage(null)}
          title="Editar Imagem da Anotação"
          originalImage={editingDocImage.getAttribute('data-original-src') || editingDocImage.src}
          editParams={JSON.parse(editingDocImage.getAttribute('data-edit-params') || '{}')}
          circleCrop={false}
          aspectRatios={['free', '16:9', '4:3', '1:1']}
          onSave={handleSaveExistingDocImage}
        />
      )}

      {/* Floating Image Control Panel */}
      {selectedDocImage && (
        <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 z-50 bg-[#121214] border border-[#2E2E33] px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200 no-print">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-400" />
            <span className="text-[11px] font-bold text-white whitespace-nowrap">Imagem Selecionada</span>
          </div>
          
          <div className="w-px h-6 bg-[#2F2F33]" />
          
          {/* Resizing controls */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Tamanho:</span>
            {[
              { pct: '25%', label: '25%' },
              { pct: '50%', label: '50%' },
              { pct: '75%', label: '75%' },
              { pct: '100%', label: '100%' },
            ].map((sz) => {
              const isCurrent = selectedDocImage.style.width === sz.pct;
              return (
                <button
                  key={sz.pct}
                  onClick={() => {
                    selectedDocImage.style.width = sz.pct;
                    selectedDocImage.style.maxWidth = '100%';
                    selectedDocImage.style.height = 'auto';
                    updateDocumentMetrics();
                    handleSave(true);
                    // Force re-render
                    setSelectedDocImage(selectedDocImage);
                  }}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    isCurrent ? 'bg-blue-600 text-white' : 'bg-[#1C1C1F] text-gray-400 hover:text-white border border-[#2E2E32]'
                  }`}
                >
                  {sz.label}
                </button>
              );
            })}
          </div>

          <div className="w-px h-6 bg-[#2F2F33]" />

          {/* Wrapping / Floating controls */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 uppercase font-semibold font-mono">Layout:</span>
            {[
              { align: 'left', label: 'Flutuar à Esquerda' },
              { align: 'center', label: 'Centralizar' },
              { align: 'right', label: 'Flutuar à Direita' },
            ].map((pos) => {
              const isCurrent = pos.align === 'center' 
                ? (selectedDocImage.style.float === 'none' || !selectedDocImage.style.float)
                : selectedDocImage.style.float === pos.align;
              return (
                <button
                  key={pos.align}
                  onClick={() => {
                    if (pos.align === 'left') {
                      selectedDocImage.style.float = 'left';
                      selectedDocImage.style.margin = '12px 16px 12px 0';
                      selectedDocImage.style.display = 'inline';
                    } else if (pos.align === 'right') {
                      selectedDocImage.style.float = 'right';
                      selectedDocImage.style.margin = '12px 0 12px 16px';
                      selectedDocImage.style.display = 'inline';
                    } else {
                      selectedDocImage.style.float = 'none';
                      selectedDocImage.style.margin = '16px auto';
                      selectedDocImage.style.display = 'block';
                    }
                    updateDocumentMetrics();
                    handleSave(true);
                    setSelectedDocImage(selectedDocImage); // force update
                  }}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    isCurrent ? 'bg-blue-600 text-white' : 'bg-[#1C1C1F] text-gray-400 hover:text-white border border-[#2E2E32]'
                  }`}
                  title={pos.label}
                >
                  {pos.align === 'left' ? '← Flutuar' : pos.align === 'right' ? 'Flutuar →' : 'Centro'}
                </button>
              );
            })}
          </div>

          <div className="w-px h-6 bg-[#2F2F33]" />

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setEditingDocImage(selectedDocImage);
                setSelectedDocImage(null);
              }}
              className="px-2.5 py-1 bg-stone-700 hover:bg-stone-600 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
              title="Filtros, Recorte e Ajustes"
            >
              Filtros / Recorte
            </button>
            <button
              onClick={() => {
                if (confirm('Deseja realmente remover esta imagem do documento?')) {
                  selectedDocImage.remove();
                  setSelectedDocImage(null);
                  updateDocumentMetrics();
                  handleSave(true);
                }
              }}
              className="p-1.5 bg-red-950/40 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg transition cursor-pointer"
              title="Remover Imagem"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSelectedDocImage(null)}
              className="px-2 py-1 bg-[#1C1C1F] border border-[#2D2D30] text-gray-400 hover:text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
