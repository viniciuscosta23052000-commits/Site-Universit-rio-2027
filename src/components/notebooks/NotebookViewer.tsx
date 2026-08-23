import React, { useState } from 'react';
import { Notebook, Chapter, Lesson, Discipline } from '../../types';
import { StorageService } from '../../lib/storage';
import { exportNotebookToDocx } from '../../lib/docxExport';
import { exportNotebookToPdf } from '../../lib/pdfExport';
import {
  ArrowLeft,
  Plus,
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Calendar,
  Layers,
  Trash2,
  Edit,
  Download,
  Printer,
  Sparkles,
  Search,
  LayoutGrid,
  List as ListIcon,
  Clock,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface NotebookViewerProps {
  notebookId: string;
  onBack: () => void;
  onOpenLesson: (lessonId: string) => void;
}

export const NotebookViewer: React.FC<NotebookViewerProps> = ({
  notebookId,
  onBack,
  onOpenLesson,
}) => {
  const db = StorageService.getDatabase();
  const notebook = db.notebooks.find((n) => n.id === notebookId);
  const discipline = db.disciplines.find((d) => d.id === notebook?.disciplineId);
  const chapters = db.chapters.filter((c) => c.notebookId === notebookId).sort((a, b) => a.order - b.order);
  const allLessons = db.lessons.filter((l) => l.notebookId === notebookId);

  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    chapters.forEach((c) => {
      initial[c.id] = true;
    });
    return initial;
  });

  const [viewType, setViewType] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // New Chapter modal state
  const [newChapterModalOpen, setNewChapterModalOpen] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');
  const [newChapterDesc, setNewChapterDesc] = useState('');

  if (!notebook) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-[#919196]">Caderno não encontrado.</p>
        <button onClick={onBack} className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer">
          Voltar
        </button>
      </div>
    );
  }

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const handleCreateNewLesson = (chapterId?: string) => {
    const targetChapterId = chapterId || chapters[0]?.id;
    if (!targetChapterId) {
      alert('Crie primeiro um capítulo para adicionar aulas.');
      return;
    }

    const lessonNumberCount = allLessons.length + 1;
    const newLessonId = `lesson-${Date.now()}`;
    const newLesson: Lesson = {
      id: newLessonId,
      chapterId: targetChapterId,
      notebookId: notebook.id,
      semesterId: notebook.semesterId,
      disciplineId: notebook.disciplineId,
      title: `Aula ${lessonNumberCount < 10 ? '0' + lessonNumberCount : lessonNumberCount} — Novo Conteúdo`,
      lessonNumber: `Aula ${lessonNumberCount < 10 ? '0' + lessonNumberCount : lessonNumberCount}`,
      professor: discipline?.professor || '',
      date: new Date().toISOString().split('T')[0],
      contentHtml: `
<h2>1. Objetivos da Aula</h2>
<p>Descreva os principais tópicos e conceitos abordados na aula de hoje.</p>

<div class="academic-callout highlight" style="background-color: #fef9e7; border-left: 4px solid #d97706; padding: 14px 18px; margin: 14px 0; border-radius: 8px;">
  <strong>💡 Conceito Chave:</strong>
  <p>Anote aqui a definição principal apresentada pelo professor.</p>
</div>

<h2>2. Anotações Detalhadas</h2>
<p>Comece a redigir o conteúdo, criar tabelas, adicionar imagens ou usar o OCR para transcrever fotos do quadro.</p>
      `,
      pageFormat: 'a4',
      pageOrientation: 'portrait',
      templateType: 'traditional',
      canvasElements: [],
      drawings: [],
      attachments: [],
      tags: [discipline?.name?.toLowerCase() || 'geral'],
      versions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.update((draft) => {
      draft.lessons.push(newLesson);
      const nb = draft.notebooks.find((n) => n.id === notebook.id);
      if (nb) nb.updatedAt = new Date().toISOString();
    });

    onOpenLesson(newLessonId);
  };

  const handleCreateChapter = () => {
    if (!newChapterName.trim()) return;

    StorageService.update((draft) => {
      draft.chapters.push({
        id: `chap-${Date.now()}`,
        notebookId: notebook.id,
        name: newChapterName.trim(),
        description: newChapterDesc.trim(),
        order: chapters.length + 1,
        color: notebook.color,
        createdAt: new Date().toISOString(),
      });
    });

    setNewChapterName('');
    setNewChapterDesc('');
    setNewChapterModalOpen(false);
  };

  const handleDeleteLesson = (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Excluir esta aula permanentemente?')) {
      StorageService.update((draft) => {
        draft.lessons = draft.lessons.filter((l) => l.id !== lessonId);
      });
    }
  };

  const handleExportDocx = async () => {
    try {
      setIsExporting(true);
      const blob = await exportNotebookToDocx(notebook, allLessons, discipline?.name || 'Geral');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${notebook.name.replace(/[^a-zA-Z0-9]/g, '_')}_Completo.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      confetti({ particleCount: 50, spread: 60 });
    } catch (e) {
      console.error(e);
      alert('Erro ao exportar caderno para Word.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = () => {
    try {
      setIsExportingPdf(true);
      const studentName = db.profile.name || 'Estudante';
      const courseName = db.profile.course || 'Graduação';
      const institutionName = db.profile.institution || db.profile.university || 'Universidade';
      
      exportNotebookToPdf(
        notebook,
        allLessons,
        discipline,
        studentName,
        courseName,
        institutionName
      );
      confetti({ particleCount: 40, spread: 55 });
    } catch (e) {
      console.error(e);
      alert('Erro ao exportar caderno para PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Cover */}
      <div className="relative rounded-2xl overflow-hidden shadow-md border border-[#242427] bg-[#121214]">
        <div className="h-44 sm:h-56 w-full relative overflow-hidden bg-gradient-to-r from-blue-950 via-indigo-950 to-[#121214]">
          {notebook.coverImage ? (
            <img src={notebook.coverImage} alt={notebook.name} className="w-full h-full object-cover opacity-40 mix-blend-overlay" />
          ) : (
            <div className="w-full h-full opacity-20" style={{ backgroundColor: notebook.color }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-black/40 to-black/20" />
        </div>

        {/* Back and actions over cover */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 text-[#E2E2E2] backdrop-blur-xs text-xs font-medium hover:bg-black/80 hover:text-white transition cursor-pointer border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Todos os Cadernos
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf || allLessons.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white backdrop-blur-xs text-xs font-medium transition disabled:opacity-50 cursor-pointer"
              title="Exportar todo o caderno em PDF estruturado"
            >
              <FileText className="w-3.5 h-3.5" />
              {isExportingPdf ? 'Exportando...' : 'Exportar (.pdf)'}
            </button>

            <button
              onClick={handleExportDocx}
              disabled={isExporting || allLessons.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white backdrop-blur-xs text-xs font-medium transition disabled:opacity-50 cursor-pointer"
              title="Baixar todo o caderno em formato DOCX"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Exportando...' : 'Exportar (.docx)'}
            </button>
          </div>
        </div>

        {/* Banner Details */}
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:bottom-6 text-white space-y-2">
          {discipline && (
            <span
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider shadow-xs"
              style={{ backgroundColor: discipline.color }}
            >
              {discipline.name} • {discipline.code || 'Graduação'}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-xs">
            {notebook.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#919196] max-w-2xl line-clamp-2">
            {notebook.description || 'Caderno Digital Universitário com todas as anotações, capítulos e revisões.'}
          </p>

          <div className="flex items-center gap-4 text-xs text-[#919196] pt-1 font-medium">
            <span>📚 {chapters.length} capítulos</span>
            <span>📝 {allLessons.length} aulas cadastradas</span>
            {discipline?.professor && <span>👨‍🏫 Prof. {discipline.professor}</span>}
          </div>
        </div>
      </div>

      {/* Control bar: Add lesson, add chapter, search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121214] p-3 rounded-2xl border border-[#242427] shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCreateNewLesson()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Aula
          </button>
          <button
            onClick={() => setNewChapterModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1C1C1F] text-[#E2E2E2] border border-[#242427] text-xs font-semibold rounded-xl hover:border-blue-500/50 hover:text-white transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            Novo Capítulo
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#636366]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar nesta matéria..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-xs text-[#E2E2E2] placeholder-[#636366] focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center bg-[#1C1C1F] p-1 rounded-xl border border-[#242427]">
            <button
              onClick={() => setViewType('list')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewType === 'list' ? 'bg-[#2A2A2D] text-white shadow-xs' : 'text-[#919196] hover:text-white'
              }`}
              title="Visualização em Lista"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewType('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewType === 'grid' ? 'bg-[#2A2A2D] text-white shadow-xs' : 'text-[#919196] hover:text-white'
              }`}
              title="Visualização em Grade de Cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chapters and Lessons Hierarchy */}
      <div className="space-y-5">
        {chapters.length === 0 ? (
          <div className="text-center py-12 bg-[#121214] rounded-2xl border border-dashed border-[#242427] p-8">
            <Layers className="w-10 h-10 text-[#636366] mx-auto mb-2" />
            <h3 className="text-base font-semibold text-white">
              Nenhum capítulo cadastrado
            </h3>
            <p className="text-xs text-[#919196] mt-1 mb-4">
              Crie o primeiro capítulo para organizar as aulas do seu caderno.
            </p>
            <button
              onClick={() => setNewChapterModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              + Criar Capítulo
            </button>
          </div>
        ) : (
          chapters.map((chapter) => {
            const chapterLessons = allLessons.filter((l) => l.chapterId === chapter.id).filter((l) => {
              if (!searchQuery.trim()) return true;
              return (
                l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.contentHtml.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.lessonNumber?.toLowerCase().includes(searchQuery.toLowerCase())
              );
            });

            const isExpanded = expandedChapters[chapter.id] !== false;

            return (
              <div
                key={chapter.id}
                className="bg-[#121214] rounded-2xl border border-[#242427] shadow-xs overflow-hidden"
              >
                {/* Chapter Header */}
                <div
                  onClick={() => toggleChapter(chapter.id)}
                  className="flex items-center justify-between p-4 bg-[#1C1C1F] cursor-pointer hover:bg-[#242427] transition"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-[#919196] hover:text-white">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: notebook.color }} />
                        <h2 className="text-base font-semibold text-white">
                          {chapter.name}
                        </h2>
                      </div>
                      {chapter.description && (
                        <p className="text-xs text-[#919196] pl-4 mt-0.5">
                          {chapter.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#919196] bg-[#121214] px-2.5 py-1 rounded-lg border border-[#242427]">
                      {chapterLessons.length} {chapterLessons.length === 1 ? 'aula' : 'aulas'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateNewLesson(chapter.id);
                      }}
                      className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition cursor-pointer"
                      title="Adicionar aula neste capítulo"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Lessons inside Chapter */}
                {isExpanded && (
                  <div className="p-4 border-t border-[#242427]">
                    {chapterLessons.length === 0 ? (
                      <div className="text-center py-6 text-xs text-[#919196]">
                        Nenhuma aula neste capítulo.{' '}
                        <button
                          onClick={() => handleCreateNewLesson(chapter.id)}
                          className="font-semibold text-blue-400 hover:underline cursor-pointer"
                        >
                          + Adicionar primeira aula
                        </button>
                      </div>
                    ) : viewType === 'list' ? (
                      <div className="divide-y divide-[#242427]">
                        {chapterLessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            onClick={() => onOpenLesson(lesson.id)}
                            className="py-3 px-3 flex items-center justify-between hover:bg-[#1C1C1F] rounded-xl transition cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-blue-400 uppercase">
                                    {lesson.lessonNumber || 'Aula'}
                                  </span>
                                  <h3 className="font-semibold text-xs sm:text-sm text-[#E2E2E2] group-hover:text-white transition">
                                    {lesson.title}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-[#919196] mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {lesson.date}
                                  </span>
                                  {lesson.professor && <span>Prof. {lesson.professor}</span>}
                                  {lesson.summary && (
                                    <span className="hidden sm:inline-block italic line-clamp-1 max-w-md">
                                      — {lesson.summary}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => handleDeleteLesson(lesson.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                                title="Excluir aula"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <ExternalLink className="w-4 h-4 text-[#636366] group-hover:text-white transition" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {chapterLessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            onClick={() => onOpenLesson(lesson.id)}
                            className="p-4 rounded-xl border border-[#242427] bg-[#1C1C1F] hover:border-blue-500/50 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3 group"
                          >
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-[#919196] mb-1">
                                <span className="font-bold text-blue-400">{lesson.lessonNumber || 'Aula'}</span>
                                <span>{lesson.date}</span>
                              </div>
                              <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition line-clamp-2">
                                {lesson.title}
                              </h3>
                              <p className="text-xs text-[#919196] line-clamp-2 mt-1.5">
                                {lesson.summary || 'Anotações da aula...'}
                              </p>
                            </div>
                            <div className="pt-2 border-t border-[#242427] flex items-center justify-between text-[10px] text-[#919196]">
                              <span>Prof: {lesson.professor || 'N/A'}</span>
                              <span className="text-blue-400 font-semibold group-hover:underline">Abrir Aula →</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Chapter Modal */}
      {newChapterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-white">
              Novo Capítulo no Caderno
            </h3>
            <div>
              <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                Nome do Capítulo *
              </label>
              <input
                type="text"
                value={newChapterName}
                onChange={(e) => setNewChapterName(e.target.value)}
                placeholder="Ex: Capítulo 02 — Fisiologia Renal"
                className="w-full px-3.5 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                Descrição (Opcional)
              </label>
              <input
                type="text"
                value={newChapterDesc}
                onChange={(e) => setNewChapterDesc(e.target.value)}
                placeholder="Ex: Tópicos da 2ª Prova Bimestral"
                className="w-full px-3.5 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setNewChapterModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#919196] hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateChapter}
                disabled={!newChapterName.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
              >
                Criar Capítulo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
