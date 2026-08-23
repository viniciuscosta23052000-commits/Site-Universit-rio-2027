import React, { useState, useEffect, useRef } from 'react';
import { Lesson, Notebook, Discipline, CanvasElement, DrawingStroke } from '../../types';
import { StorageService } from '../../lib/storage';
import { exportLessonToDocx } from '../../lib/docxExport';
import { exportToPdf } from '../../lib/pdfExport';
import { UniversalImageEditor, ImageEditParams } from './UniversalImageEditor';
import {
  ArrowLeft,
  Save,
  Download,
  Printer,
  Sparkles,
  Camera,
  Layers,
  History,
  FileText,
  Type,
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
  CheckSquare,
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
  RotateCcw,
  BookOpen,
  Calendar,
  User,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ClassroomAudioSection } from './ClassroomAudioSection';
import { Mic } from 'lucide-react';

interface AcademicEditorProps {
  lessonId: string;
  onBack: () => void;
  onNavigateToFlashcards?: (deckId: string) => void;
  onNavigateToMindmaps?: (mapId: string) => void;
}

const MATH_SYMBOLS = ['α', 'β', 'γ', 'δ', 'θ', 'λ', 'μ', 'π', 'σ', 'Δ', 'Ω', '→', '⇄', '±', '≤', '≥', '≠', '≈', '∞', '√', '∫', '∑', '²', '³', '℃', 'pH', 'CO₂', 'O₂', 'Ca²⁺', 'Na⁺', 'K⁺'];

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
  const [viewMode, setViewMode] = useState<'page' | 'continuous' | 'canva'>('page');

  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingTool, setDrawingTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [drawColor, setDrawColor] = useState('#EF4444');
  const [drawWidth, setDrawWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Freeform Canvas Elements (Sticky notes, floating cards)
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>(initialLesson?.canvasElements || []);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // AI states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAction, setAiAction] = useState<string>('summarize');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiResultText, setAiResultText] = useState('');

  // OCR modal
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [ocrImagePreview, setOcrImagePreview] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Version history modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [symbolPickerOpen, setSymbolPickerOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [pageAppearance, setPageAppearance] = useState<'white' | 'dark' | 'auto'>(() => {
    return (localStorage.getItem('academic_page_appearance') as 'white' | 'dark' | 'auto') || 'auto';
  });

  const [showAudioSidebar, setShowAudioSidebar] = useState(false);

  useEffect(() => {
    const unsubscribe = StorageService.subscribe((newDb) => {
      const freshL = newDb.lessons.find((l) => l.id === lessonId);
      if (freshL) {
        setLesson(freshL);
      }
    });
    return unsubscribe;
  }, [lessonId]);

  const handleInsertNotesFromAudio = (html: string) => {
    if (editorContentRef.current) {
      editorContentRef.current.innerHTML += `<div class="ai-generated-study-notes border-t-2 border-dashed border-purple-500/30 pt-6 mt-8">${html}</div>`;
      handleSave(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });
    }
  };

  // Doc Image Editor states
  const [editingDocImage, setEditingDocImage] = useState<HTMLImageElement | null>(null);
  const [newImageOriginalSrc, setNewImageOriginalSrc] = useState<string | null>(null);
  const [isNewImageEditorOpen, setIsNewImageEditorOpen] = useState(false);

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
    
    if (editorContentRef.current) {
      editorContentRef.current.focus();
    }
    
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
    if (target.tagName === 'IMG' && target.classList.contains('note-editable-image')) {
      setEditingDocImage(target as HTMLImageElement);
    }
  };

  const editorContentRef = useRef<HTMLDivElement | null>(null);

  // Initialize content on load
  useEffect(() => {
    if (editorContentRef.current && initialLesson) {
      editorContentRef.current.innerHTML = initialLesson.contentHtml || '<p>Comece a escrever sua aula aqui...</p>';
    }
  }, [lessonId]);

  // Redraw strokes
  useEffect(() => {
    if (!canvasRef.current || !lesson) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw saved strokes
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

  // Autosave helper
  const handleSave = (silent = false) => {
    if (!lesson) return;
    setSaveStatus('saving');

    const contentHtml = editorContentRef.current ? editorContentRef.current.innerHTML : lesson.contentHtml;

    const updated: Lesson = {
      ...lesson,
      title,
      lessonNumber,
      professor,
      date,
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
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.9 } });
    }
  };

  // Execute formatting command
  const formatDoc = (cmd: string, value: string | undefined = undefined) => {
    document.execCommand(cmd, false, value);
    if (editorContentRef.current) {
      editorContentRef.current.focus();
    }
  };

  // Insert Academic Callout
  const insertCallout = (type: 'highlight' | 'definition' | 'warning' | 'example' | 'obs' | 'formula') => {
    let calloutHtml = '';
    switch (type) {
      case 'highlight':
        calloutHtml = `<div class="academic-callout highlight" style="background-color: #fef9e7; border-left: 4px solid #d97706; padding: 14px 18px; margin: 14px 0; border-radius: 8px;"><strong>💡 Ponto de Destaque:</strong><p>Digite a informação chave aqui...</p></div><p></p>`;
        break;
      case 'definition':
        calloutHtml = `<div class="academic-callout definition" style="background-color: #f0f7f3; border-left: 4px solid #4A6B53; padding: 14px 18px; margin: 14px 0; border-radius: 8px;"><strong>📖 Definição Conceitual:</strong><p>Digite o conceito formal ou terminologia aqui...</p></div><p></p>`;
        break;
      case 'warning':
        calloutHtml = `<div class="academic-callout warning" style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 14px 18px; margin: 14px 0; border-radius: 8px;"><strong>⚠️ Atenção / Cai em Prova:</strong><p>Detalhe crucial para não confundir...</p></div><p></p>`;
        break;
      case 'example':
        calloutHtml = `<div class="academic-callout example" style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 14px 18px; margin: 14px 0; border-radius: 8px;"><strong>🔬 Exemplo Prático / Caso Clínico:</strong><p>Descrição do exemplo contextualizado...</p></div><p></p>`;
        break;
      case 'formula':
        calloutHtml = `<div class="academic-callout formula" style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #475569; padding: 14px 18px; margin: 14px 0; border-radius: 8px; font-family: monospace;"><strong>📐 Equação / Relação:</strong><p>$$\\Delta H = m \\cdot c \\cdot \\Delta T$$</p></div><p></p>`;
        break;
      case 'obs':
        calloutHtml = `<div class="academic-callout obs" style="background-color: #f5f3ff; border-left: 4px solid #7c3aed; padding: 14px 18px; margin: 14px 0; border-radius: 8px;"><strong>✍️ Observação do Professor:</strong><p>Comentário feito em sala de aula...</p></div><p></p>`;
        break;
    }
    formatDoc('insertHTML', calloutHtml);
  };

  // Insert Table
  const insertTable = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="background-color: #e9eee8; text-align: left;">
            <th style="padding: 8px 12px; border: 1px solid #ccd5cb;">Item / Conceito</th>
            <th style="padding: 8px 12px; border: 1px solid #ccd5cb;">Descrição</th>
            <th style="padding: 8px 12px; border: 1px solid #ccd5cb;">Observações</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #ccd5cb;">Exemplo 1</td>
            <td style="padding: 8px 12px; border: 1px solid #ccd5cb;">Explicação detalhada...</td>
            <td style="padding: 8px 12px; border: 1px solid #ccd5cb;">Nota...</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #ccd5cb;">Exemplo 2</td>
            <td style="padding: 8px 12px; border: 1px solid #ccd5cb;">Explicação detalhada...</td>
            <td style="padding: 8px 12px; border: 1px solid #ccd5cb;">Nota...</td>
          </tr>
        </tbody>
      </table>
      <p></p>
    `;
    formatDoc('insertHTML', tableHtml);
  };

  // Add floating sticky note or card on Canva layer
  const addCanvasElement = (type: 'callout' | 'text' | 'shape') => {
    const newEl: CanvasElement = {
      id: `el-${Date.now()}`,
      type,
      x: 60 + Math.random() * 40,
      y: 100 + Math.random() * 50,
      width: 220,
      height: 100,
      zIndex: canvasElements.length + 1,
      content: type === 'callout' ? '📌 Lembrete importante' : 'Nova anotação flutuante...',
      style: {
        backgroundColor: '#FEF3C7',
        borderColor: '#F59E0B',
        borderRadius: 8,
        fontSize: 13,
      },
    };
    setCanvasElements([...canvasElements, newEl]);
  };

  // Export to Word (.docx)
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
      console.error('Erro ao gerar DOCX:', e);
      alert('Erro ao exportar documento para DOCX.');
    }
  };

  // Export to PDF (.pdf)
  const handleExportPdf = () => {
    if (!lesson) return;
    try {
      const htmlContent = editorContentRef.current?.innerHTML || lesson.contentHtml;
      exportToPdf(
        title,
        lessonNumber || 'Aula',
        htmlContent,
        {
          studentName: db.profile?.name || 'Estudante',
          courseName: db.profile?.course || 'Curso',
          institution: db.profile?.institution || db.profile?.university || 'Universidade',
          professor: professor || discipline?.professor || 'Não informado',
          date: date || 'Não informada',
        }
      );
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.9 } });
    } catch (e) {
      console.error('Erro ao gerar PDF:', e);
      alert('Erro ao exportar documento para PDF.');
    }
  };

  // Handle OCR Photo Upload
  const handleOcrFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setOcrImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRunOcr = async () => {
    if (!ocrImagePreview) return;
    setOcrLoading(true);

    try {
      const response = await fetch('/api/ai/transcribe-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: ocrImagePreview,
        }),
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
      console.error(e);
      alert('Erro ao conectar com serviço de IA: ' + e.message);
    } finally {
      setOcrLoading(false);
    }
  };

  // Handle AI Study Assistant
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

  // Auto-generate Flashcards from note
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

  // Auto-generate Mind Map from note
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
            const angle = (idx / ((rawMap.nodes?.length || 1))) * 2 * Math.PI;
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

  // Drawing mouse handlers
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

  return (
    <div className="flex flex-col h-full bg-[#0A0A0B] text-[#EDEDED] overflow-hidden">
      {/* Top Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#121214] border-b border-[#242427] z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-[#919196] hover:text-white hover:bg-[#1C1C1F] transition cursor-pointer"
            title="Voltar ao Caderno"
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
                className="px-1.5 py-0.5 text-xs font-semibold rounded bg-transparent border-b border-transparent hover:border-[#242427] focus:border-blue-500 focus:outline-hidden w-20 text-[#EDEDED]"
                placeholder="Aula 01"
              />
              <span className="text-xs text-[#636366]">•</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs text-[#919196] bg-transparent border-none focus:outline-hidden"
              />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base font-bold bg-transparent border-b border-transparent hover:border-[#242427] focus:border-blue-500 focus:outline-hidden text-white w-72 sm:w-96 placeholder-[#636366]"
              placeholder="Título da Aula..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* AI Tools Dropdown / Quick buttons */}
          <div className="flex items-center bg-[#1C1C1F] border border-[#242427] rounded-xl p-1 gap-1">
            <button
              onClick={() => {
                setAiAction('summarize');
                setAiModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-[#242427] rounded-lg transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              IA Assistente
            </button>
            <button
              onClick={() => setShowAudioSidebar(!showAudioSidebar)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                showAudioSidebar
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 font-bold'
                  : 'text-red-400 hover:bg-[#242427]'
              }`}
              title="Abre o painel lateral de gravação e transcrição de áudios de aulas"
            >
              <Mic className="w-3.5 h-3.5" />
              Áudio da Aula
            </button>
            <button
              onClick={() => setOcrModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#919196] hover:text-white hover:bg-[#242427] rounded-lg transition cursor-pointer"
              title="Transcrever anotação manuscrita ou foto do quadro com OCR"
            >
              <Camera className="w-3.5 h-3.5" />
              OCR Foto
            </button>
            <button
              onClick={handleGenerateFlashcards}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#919196] hover:text-white hover:bg-[#242427] rounded-lg transition cursor-pointer"
              title="Gerar baralho de flashcards a partir desta aula"
            >
              <Brain className="w-3.5 h-3.5" />
              Flashcards
            </button>
            <button
              onClick={handleGenerateMindmap}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#919196] hover:text-white hover:bg-[#242427] rounded-lg transition cursor-pointer"
              title="Gerar mapa mental conceitual"
            >
              <Network className="w-3.5 h-3.5" />
              Mapa Mental
            </button>
          </div>

          {/* Export & Save */}
          <div className="flex items-center gap-1.5 border-l border-[#242427] pl-2">
            <button
              onClick={handleExportDocx}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#1C1C1F] hover:bg-[#242427] border border-[#242427] text-[#EDEDED] hover:text-white text-xs font-medium rounded-xl transition cursor-pointer"
              title="Baixar como arquivo Word (.docx) formatado"
            >
              <Download className="w-3.5 h-3.5" />
              Word (.docx)
            </button>

            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#1C1C1F] hover:bg-[#242427] border border-[#242427] text-[#EDEDED] hover:text-white text-xs font-medium rounded-xl transition cursor-pointer"
              title="Baixar como arquivo PDF (.pdf) formatado"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF (.pdf)
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 text-[#919196] hover:text-white hover:bg-[#1C1C1F] rounded-xl transition cursor-pointer"
              title="Imprimir ou Salvar em PDF"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleSave(false)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {saveStatus === 'saving' ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </header>

      {/* Formatting & Canvas Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#161618] border-b border-[#242427] text-xs z-10 no-print">
        {/* Text styling group */}
        <div className="flex items-center flex-wrap gap-1">
          {/* Headings */}
          <select
            onChange={(e) => formatDoc('formatBlock', e.target.value)}
            className="px-2 py-1 rounded-lg border border-[#242427] bg-[#1C1C1F] text-white text-xs font-medium focus:outline-none"
            defaultValue="p"
          >
            <option value="p">Parágrafo</option>
            <option value="h1">Título Principal (H1)</option>
            <option value="h2">Subtítulo (H2)</option>
            <option value="h3">Tópico (H3)</option>
          </select>

          {/* Font Family */}
          <select
            onChange={(e) => formatDoc('fontName', e.target.value)}
            className="px-2 py-1 rounded-lg border border-[#242427] bg-[#1C1C1F] text-white text-xs focus:outline-none"
            defaultValue="Plus Jakarta Sans"
          >
            <option value="Plus Jakarta Sans">Modern Sans</option>
            <option value="Playfair Display">Academic Serif</option>
            <option value="Cinzel">Editorial Cinzel</option>
            <option value="Caveat">Manuscrito (Handwriting)</option>
            <option value="JetBrains Mono">Código / Equação</option>
          </select>

          <div className="h-4 w-px bg-[#242427] mx-1" />

          {/* Bold, Italic, Underline, Strikethrough */}
          <button
            onClick={() => formatDoc('bold')}
            className="p-1.5 rounded-lg hover:bg-[#242427] font-bold text-[#EDEDED] transition cursor-pointer"
            title="Negrito (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => formatDoc('italic')}
            className="p-1.5 rounded-lg hover:bg-[#242427] italic text-[#EDEDED] transition cursor-pointer"
            title="Itálico (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => formatDoc('underline')}
            className="p-1.5 rounded-lg hover:bg-[#242427] underline text-[#EDEDED] transition cursor-pointer"
            title="Sublinhado (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => formatDoc('strikeThrough')}
            className="p-1.5 rounded-lg hover:bg-[#242427] line-through text-[#EDEDED] transition cursor-pointer"
            title="Tachado"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-[#242427] mx-1" />

          {/* Color & Highlight */}
          <div className="flex items-center gap-1">
            <input
              type="color"
              defaultValue="#EDEDED"
              onChange={(e) => formatDoc('foreColor', e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
              title="Cor do Texto"
            />
            <button
              onClick={() => formatDoc('hiliteColor', '#854d0e')}
              className="w-5 h-5 rounded bg-yellow-900 border border-yellow-600 hover:scale-110 transition cursor-pointer"
              title="Marca-texto Amarelo"
            />
            <button
              onClick={() => formatDoc('hiliteColor', '#14532d')}
              className="w-5 h-5 rounded bg-green-950 border border-green-600 hover:scale-110 transition cursor-pointer"
              title="Marca-texto Verde"
            />
            <button
              onClick={() => formatDoc('hiliteColor', '#1e3a5f')}
              className="w-5 h-5 rounded bg-sky-950 border border-sky-600 hover:scale-110 transition cursor-pointer"
              title="Marca-texto Azul"
            />
          </div>

          <div className="h-4 w-px bg-[#242427] mx-1" />

          {/* Alignments */}
          <button
            onClick={() => formatDoc('justifyLeft')}
            className="p-1.5 rounded-lg hover:bg-[#242427] text-[#EDEDED] transition cursor-pointer"
            title="Alinhar à Esquerda"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => formatDoc('justifyCenter')}
            className="p-1.5 rounded-lg hover:bg-[#242427] text-[#EDEDED] transition cursor-pointer"
            title="Centralizar"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => formatDoc('justifyRight')}
            className="p-1.5 rounded-lg hover:bg-[#242427] text-[#EDEDED] transition cursor-pointer"
            title="Alinhar à Direita"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => formatDoc('justifyFull')}
            className="p-1.5 rounded-lg hover:bg-[#242427] text-[#EDEDED] transition cursor-pointer"
            title="Justificar"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-[#242427] mx-1" />

          {/* Lists & Table */}
          <button
            onClick={() => formatDoc('insertUnorderedList')}
            className="p-1.5 rounded-lg hover:bg-[#242427] text-[#EDEDED] transition cursor-pointer"
            title="Lista com Marcadores"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => formatDoc('insertOrderedList')}
            className="p-1.5 rounded-lg hover:bg-[#242427] text-[#EDEDED] transition cursor-pointer"
            title="Lista Numerada"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={insertTable}
            className="p-1.5 rounded-lg hover:bg-[#242427] text-[#EDEDED] transition cursor-pointer"
            title="Inserir Tabela Acadêmica"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>

          {/* Math Symbols dropdown button */}
          <div className="relative">
            <button
              onClick={() => setSymbolPickerOpen(!symbolPickerOpen)}
              className="px-2 py-1 bg-[#1C1C1F] border border-[#242427] rounded-lg text-xs font-mono text-[#EDEDED] hover:bg-[#242427] transition cursor-pointer"
              title="Símbolos Matemáticos e Científicos"
            >
              ∑ π α
            </button>
            {symbolPickerOpen && (
              <div className="absolute top-full mt-1 left-0 bg-[#121214] border border-[#242427] rounded-xl shadow-xl p-2 z-50 grid grid-cols-6 gap-1 w-64">
                {MATH_SYMBOLS.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => {
                      formatDoc('insertText', sym);
                      setSymbolPickerOpen(false);
                    }}
                    className="p-1 text-center font-mono text-[#EDEDED] hover:bg-[#1C1C1F] rounded-md text-xs cursor-pointer"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Academic Callout quick inserts & Canva layers */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#919196] font-medium mr-1">Blocos:</span>
          <button
            onClick={() => insertCallout('highlight')}
            className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg font-medium text-[11px] hover:bg-amber-500/20 transition cursor-pointer"
          >
            💡 Destaque
          </button>
          <button
            onClick={() => insertCallout('definition')}
            className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-medium text-[11px] hover:bg-emerald-500/20 transition cursor-pointer"
          >
            📖 Definição
          </button>
          <button
            onClick={() => insertCallout('warning')}
            className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg font-medium text-[11px] hover:bg-red-500/20 transition cursor-pointer"
          >
            ⚠️ Prova
          </button>
          <button
            onClick={() => insertCallout('example')}
            className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg font-medium text-[11px] hover:bg-blue-500/20 transition cursor-pointer"
          >
            🔬 Exemplo
          </button>

          <div className="h-4 w-px bg-[#242427] mx-1" />

          {/* Floating Element / Canva Post-it */}
          <button
            onClick={() => addCanvasElement('callout')}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-medium hover:bg-amber-500/30 transition cursor-pointer"
            title="Adicionar post-it flutuante estilo Canva"
          >
            <StickyNote className="w-3 h-3" />
            + Post-it
          </button>

          {/* Insert Image Button */}
          <input
            type="file"
            id="note-image-upload-input"
            accept="image/*"
            onChange={handleNewImageSelect}
            className="hidden"
          />
          <button
            onClick={() => {
              const el = document.getElementById('note-image-upload-input');
              if (el) el.click();
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-medium hover:bg-blue-500/30 transition cursor-pointer"
            title="Inserir e editar uma imagem no texto"
          >
            <ImageIcon className="w-3 h-3 text-blue-400" />
            + Imagem
          </button>

          {/* Pen / Drawing Mode Toggle */}
          <button
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
              isDrawingMode
                ? 'bg-blue-600 text-white'
                : 'bg-[#1C1C1F] border border-[#242427] text-[#EDEDED] hover:bg-[#242427]'
            }`}
          >
            <PenTool className="w-3 h-3" />
            {isDrawingMode ? 'Caneta Ativa' : 'Desenhar'}
          </button>

          {isDrawingMode && (
            <div className="flex items-center gap-1 pl-1">
              <input
                type="color"
                value={drawColor}
                onChange={(e) => setDrawColor(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer"
              />
              <button
                onClick={clearDrawings}
                className="p-1 text-red-400 hover:bg-red-500/10 rounded cursor-pointer"
                title="Limpar desenhos"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="h-4 w-px bg-[#242427] mx-1" />

          {/* Page Appearance Selector */}
          <div className="flex items-center gap-1.5 bg-[#1C1C1F] border border-[#242427] rounded-lg p-0.5">
            <span className="text-[10px] text-[#919196] font-medium px-1.5">Página:</span>
            <button
              onClick={() => {
                setPageAppearance('white');
                localStorage.setItem('academic_page_appearance', 'white');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                pageAppearance === 'white'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#919196] hover:text-white'
              }`}
              title="Folha sempre Branca (Estilo Word)"
            >
              Branca
            </button>
            <button
              onClick={() => {
                setPageAppearance('dark');
                localStorage.setItem('academic_page_appearance', 'dark');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                pageAppearance === 'dark'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#919196] hover:text-white'
              }`}
              title="Folha sempre Escura"
            >
              Escura
            </button>
            <button
              onClick={() => {
                setPageAppearance('auto');
                localStorage.setItem('academic_page_appearance', 'auto');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                pageAppearance === 'auto'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#919196] hover:text-white'
              }`}
              title="Folha acompanha o tema global do app"
            >
              Auto
            </button>
          </div>
        </div>
      </div>

      {/* Main Document Workspace */}
      {(() => {
        const isAppDark = document.documentElement.classList.contains('dark');
        const isSheetWhite = pageAppearance === 'white' || (pageAppearance === 'auto' && !isAppDark);
        
        const sheetStyle = isSheetWhite ? {
          bg: 'bg-white',
          text: 'text-zinc-800',
          border: 'border-zinc-200',
          title: 'text-zinc-900',
          secText: 'text-zinc-500',
          headerBorder: 'border-zinc-200',
          isWhite: true
        } : {
          bg: 'bg-[#121214]',
          text: 'text-[#EDEDED]',
          border: 'border-[#242427]',
          title: 'text-white',
          secText: 'text-[#919196]',
          headerBorder: 'border-[#242427]',
          isWhite: false
        };

        return (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Left/Main Document Sheet Panel */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start relative border-r border-[#242427]/50">
              {/* Realistic A4 Document Sheet */}
              <div
                className={`relative ${sheetStyle.bg} ${sheetStyle.text} border ${sheetStyle.border} shadow-2xl rounded-2xl transition-all duration-200 print-page ${
                  pageFormat === 'a4'
                    ? 'w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-14'
                    : pageFormat === 'a5'
                    ? 'w-full max-w-[148mm] min-h-[210mm] p-6 sm:p-10'
                    : 'w-full max-w-[215mm] min-h-[279mm] p-8 sm:p-12'
                }`}
              >
                {/* Academic Header */}
                <div className={`border-b ${sheetStyle.headerBorder} pb-4 mb-6 flex items-start justify-between`}>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-blue-400">
                      {discipline?.name || 'CENTRAL ACADÊMICA UNIVERSITÁRIA'}
                    </p>
                    <h1 className={`text-2xl sm:text-3xl font-bold mt-1 ${sheetStyle.title}`}>
                      {title}
                    </h1>
                    <p className={`text-xs ${sheetStyle.secText} mt-1`}>
                      {lessonNumber} • Professor(a): {professor || 'Não informado'} • Data: {date}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-mono ${sheetStyle.secText} bg-[#1C1C1F] dark:bg-[#1C1C1F]/40 px-2 py-1 rounded-md border ${sheetStyle.border}`}>
                      Pág. 01 / 01
                    </span>
                  </div>
                </div>

                {/* Drawing Canvas Overlay Layer */}
                {isDrawingMode && (
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={1100}
                    onMouseDown={startDrawing}
                    onMouseMove={drawMove}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                    className="absolute inset-0 z-30 cursor-crosshair w-full h-full pointer-events-auto"
                  />
                )}

                {/* Floating Canva Elements (Sticky notes, stamps) */}
                {canvasElements.map((el) => (
                  <div
                    key={el.id}
                    className="absolute p-3 rounded-xl shadow-lg border border-[#3A3215] bg-[#1E1B13] cursor-move z-20 group transition-shadow"
                    style={{
                      top: `${el.y}px`,
                      left: `${el.x}px`,
                      width: `${el.width}px`,
                    }}
                    draggable
                    onDragEnd={(e) => {
                      const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                      if (!rect) return;
                      const newX = e.clientX - rect.left - el.width / 2;
                      const newY = e.clientY - rect.top - el.height / 2;
                      setCanvasElements(
                        canvasElements.map((item) =>
                          item.id === el.id ? { ...item, x: Math.max(10, newX), y: Math.max(10, newY) } : item
                        )
                      );
                    }}
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-amber-500/20 mb-1">
                      <span className="text-[10px] font-bold text-amber-400 uppercase">Post-it</span>
                      <button
                        onClick={() => setCanvasElements(canvasElements.filter((item) => item.id !== el.id))}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <textarea
                      value={el.content}
                      onChange={(e) =>
                        setCanvasElements(
                          canvasElements.map((item) => (item.id === el.id ? { ...item, content: e.target.value } : item))
                        )
                      }
                      className="w-full bg-transparent text-xs text-amber-200/90 resize-none focus:outline-hidden leading-tight"
                      rows={3}
                    />
                  </div>
                ))}

                {/* Main Rich Text Content Area */}
                <div
                  ref={editorContentRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={() => handleSave(true)}
                  onClick={handleEditorClick}
                  className={`academic-editor-content focus:outline-hidden min-h-[400px] leading-relaxed text-sm sm:text-base space-y-4 ${sheetStyle.isWhite ? 'text-zinc-800' : 'text-[#EDEDED]'}`}
                />

                {/* Academic Footer */}
                <div className={`border-t ${sheetStyle.headerBorder} pt-4 mt-12 flex items-center justify-between text-[11px] ${sheetStyle.secText}`}>
                  <span>{db.profile.institution || 'Universidade'} • {db.profile.course || 'Graduação'}</span>
                  <span>Caderno Digital Universitário</span>
                </div>
              </div>
            </div>

            {/* Split Screen Classroom Audio Section */}
            {showAudioSidebar && (
              <div className="w-full lg:w-[45%] xl:w-[40%] border-t lg:border-t-0 lg:border-l border-[#242427] h-full flex flex-col shrink-0 no-print bg-[#121214]">
                <ClassroomAudioSection
                  lessonId={lessonId}
                  onInsertNotes={handleInsertNotesFromAudio}
                />
              </div>
            )}
          </div>
        );
      })()}

      {/* AI Assistant Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#242427] bg-[#161618]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Assistente de Estudos IA
                  </h3>
                  <p className="text-xs text-[#919196]">
                    Analisa o conteúdo desta aula e potencializa seus estudos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAiModalOpen(false)}
                className="p-1 rounded-lg text-[#919196] hover:text-white hover:bg-[#1C1C1F] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                  Escolha o tipo de ajuda:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAiAction('summarize')}
                    className={`p-2.5 text-left rounded-xl border text-xs font-medium transition cursor-pointer ${
                      aiAction === 'summarize'
                        ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 font-bold'
                        : 'border-[#242427] bg-[#1C1C1F] text-[#919196] hover:text-white hover:bg-[#242427]'
                    }`}
                  >
                    📌 Resumo Executivo
                    <p className="text-[10px] text-[#636366] mt-0.5">Ideia central e tópicos chave</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiAction('explain')}
                    className={`p-2.5 text-left rounded-xl border text-xs font-medium transition cursor-pointer ${
                      aiAction === 'explain'
                        ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 font-bold'
                        : 'border-[#242427] bg-[#1C1C1F] text-[#919196] hover:text-white hover:bg-[#242427]'
                    }`}
                  >
                    💡 Explicar com Analogias
                    <p className="text-[10px] text-[#636366] mt-0.5">Explicação intuitiva e simples</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiAction('quiz')}
                    className={`p-2.5 text-left rounded-xl border text-xs font-medium transition cursor-pointer ${
                      aiAction === 'quiz'
                        ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 font-bold'
                        : 'border-[#242427] bg-[#1C1C1F] text-[#919196] hover:text-white hover:bg-[#242427]'
                    }`}
                  >
                    📝 5 Perguntas de Prova
                    <p className="text-[10px] text-[#636366] mt-0.5">Simulado com gabarito comentado</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiAction('cornell_summary')}
                    className={`p-2.5 text-left rounded-xl border text-xs font-medium transition cursor-pointer ${
                      aiAction === 'cornell_summary'
                        ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 font-bold'
                        : 'border-[#242427] bg-[#1C1C1F] text-[#919196] hover:text-white hover:bg-[#242427]'
                    }`}
                  >
                    📑 Método Cornell
                    <p className="text-[10px] text-[#636366] mt-0.5">Pistas + Síntese + Resumo</p>
                  </button>
                </div>
              </div>

              {aiAction === 'explain' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1">
                    Dúvida específica (Opcional):
                  </label>
                  <input
                    type="text"
                    value={aiCustomPrompt}
                    onChange={(e) => setAiCustomPrompt(e.target.value)}
                    placeholder="Ex: Como funciona o atraso no nó AV?"
                    className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white placeholder-[#636366] focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <button
                onClick={handleRunAiStudy}
                disabled={isAiLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {isAiLoading ? 'Processando com Gemini...' : 'Gerar Análise Acadêmica'}
              </button>

              {aiResultText && (
                <div className="p-4 rounded-xl bg-[#161618] border border-[#242427] text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-400">Resultado:</span>
                    <button
                      onClick={() => {
                        formatDoc('insertHTML', `<div class="academic-callout ai-box" style="background-color: #1C1C1F; border: 1px solid #242427; border-left: 4px solid #3b82f6; color: #EDEDED; padding: 14px; margin: 12px 0; border-radius: 8px;"><strong>🤖 Estudo IA:</strong><br/>${aiResultText.replace(/\n/g, '<br/>')}</div>`);
                        setAiModalOpen(false);
                      }}
                      className="text-[11px] font-bold text-blue-400 hover:underline cursor-pointer"
                    >
                      + Inserir no Documento
                    </button>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto text-[#EDEDED]">
                    {aiResultText}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OCR Modal */}
      {ocrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[#242427] bg-[#161618]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Transcrição OCR de Foto / Caderno
                  </h3>
                  <p className="text-xs text-[#919196]">
                    Envie uma foto da lousa ou do seu caderno manuscrito
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOcrModalOpen(false)}
                className="p-1 rounded-lg text-[#919196] hover:text-white hover:bg-[#1C1C1F] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleOcrFileSelect}
                className="hidden"
              />

              {!ocrImagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#242427] rounded-2xl p-8 text-center cursor-pointer hover:bg-[#1C1C1F] transition flex flex-col items-center justify-center gap-2"
                >
                  <Camera className="w-10 h-10 text-[#919196]" />
                  <p className="text-xs font-semibold text-white">
                    Clique para selecionar uma foto da anotação
                  </p>
                  <p className="text-[11px] text-[#919196]">
                    Suporta PNG, JPG, fotos tiradas pelo celular ou tablet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="max-h-56 overflow-hidden rounded-xl border border-[#242427]">
                    <img src={ocrImagePreview} alt="Preview OCR" className="w-full object-contain" />
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-blue-400 hover:underline cursor-pointer"
                  >
                    Trocar foto
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#242427]">
                <button
                  onClick={() => setOcrModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#919196] hover:text-white hover:bg-[#1C1C1F] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRunOcr}
                  disabled={!ocrImagePreview || ocrLoading}
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  {ocrLoading ? 'Transcrevendo...' : 'Transcrever e Inserir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Image Editor for Inserting New Image */}
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

      {/* Universal Image Editor for Editing Existing Image */}
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
    </div>
  );
};
