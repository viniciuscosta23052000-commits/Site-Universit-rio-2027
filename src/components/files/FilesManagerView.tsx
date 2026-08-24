import React, { useState, useEffect } from 'react';
import { AcademicFile, Discipline } from '../../types';
import { StorageService } from '../../lib/storage';
import { PdfAnnotator } from './PdfAnnotator';
import {
  Folder,
  File,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Upload,
  Plus,
  Search,
  Trash2,
  Download,
  Eye,
  Sparkles,
  Layers,
  Calendar,
  X,
  Edit2,
  Copy,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FilesManagerViewProps {
  onOpenLessonWithOCR?: (text: string) => void;
}

export const FilesManagerView: React.FC<FilesManagerViewProps> = ({ onOpenLessonWithOCR }) => {
  const [db, setDb] = useState(() => StorageService.getDatabase());
  const currentSemesterId = db.profile.activeSemesterId;

  useEffect(() => {
    const unsubscribe = StorageService.subscribe((newDb) => {
      setDb(newDb);
    });
    return unsubscribe;
  }, []);

  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'image' | 'doc' | 'audio'>('all');
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Upload form state
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'image' | 'doc' | 'audio' | 'slides' | 'spreadsheet' | 'other'>('pdf');
  const [fileUrl, setFileUrl] = useState('');
  const [fileSize, setFileSize] = useState('1.5 MB');
  const [fileDisciplineId, setFileDisciplineId] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);

  // PDF Editor & Rename states
  const [activePdfFile, setActivePdfFile] = useState<AcademicFile | null>(null);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState('');

  const files = db.files.filter((f) => f.semesterId === currentSemesterId).filter((f) => {
    if (selectedDisciplineId && f.disciplineId !== selectedDisciplineId) return false;
    if (filterType !== 'all' && f.type !== filterType) return false;
    if (!searchQuery.trim()) return true;
    return f.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3.5 * 1024 * 1024) {
      alert('Para garantir alto desempenho e respeitar os limites de armazenamento (localStorage) do seu navegador, o tamanho máximo permitido por arquivo é de 3.5 MB. Por favor, otimize ou faça upload de um arquivo menor.');
      e.target.value = '';
      return;
    }

    setFileName(file.name);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    setFileSize(sizeInMb);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || file.type === 'application/pdf') {
      setFileType('pdf');
    } else if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      setFileType('image');
    } else if (file.type.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'ogg'].includes(ext || '')) {
      setFileType('audio');
    } else {
      setFileType('doc');
    }

    const reader = new FileReader();
    reader.onload = (loadEv) => {
      setFileUrl(loadEv.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFile = () => {
    if (!fileName.trim() || !fileUrl) return;

    const newFile: AcademicFile = {
      id: `file-${Date.now()}`,
      semesterId: currentSemesterId,
      disciplineId: fileDisciplineId || undefined,
      name: fileName.trim(),
      type: fileType,
      url: fileUrl,
      size: fileSize,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.update((draft) => {
      draft.files.push(newFile);
    });

    setFileName('');
    setFileUrl('');
    setUploadModalOpen(false);
    confetti({ particleCount: 40, spread: 50 });
  };

  const handleDeleteFile = (fileId: string) => {
    if (confirm('Excluir este arquivo?')) {
      StorageService.update((draft) => {
        draft.files = draft.files.filter((f) => f.id !== fileId);
      });
    }
  };

  const handleRenameFile = (fileId: string) => {
    if (!renamingName.trim()) return;
    StorageService.update((draft) => {
      const target = draft.files.find((f) => f.id === fileId);
      if (target) {
        target.name = renamingName.trim();
        target.updatedAt = new Date().toISOString();
      }
    });
    setRenamingFileId(null);
    setRenamingName('');
  };

  const handleDuplicateFile = (file: AcademicFile) => {
    const originalName = file.name;
    const extensionIndex = originalName.lastIndexOf('.');
    const baseName = extensionIndex !== -1 ? originalName.slice(0, extensionIndex) : originalName;
    const extension = extensionIndex !== -1 ? originalName.slice(extensionIndex) : '';

    const newFile: AcademicFile = {
      ...file,
      id: `file-dup-${Date.now()}`,
      name: `${baseName}_Copia${extension}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.update((draft) => {
      draft.files.push(newFile);
    });
    confetti({ particleCount: 30, spread: 40 });
  };

  const handleRunOCROnFile = async (file: AcademicFile) => {
    if (!file.url.startsWith('data:image')) {
      alert('O OCR com Inteligência Artificial funciona em imagens (JPG, PNG) e slides escaneados.');
      return;
    }

    setOcrLoading(true);
    try {
      const response = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: file.url,
          mode: 'handwritten',
        }),
      });

      const data = await response.json();
      if (data.success && data.transcription) {
        if (onOpenLessonWithOCR) {
          onOpenLessonWithOCR(data.transcription);
        } else {
          alert('Texto Extraído com IA:\n\n' + data.transcription);
        }
      } else {
        alert('Erro ao processar imagem: ' + (data.error || 'Tente novamente'));
      }
    } catch (e: any) {
      alert('Erro no OCR: ' + e.message);
    } finally {
      setOcrLoading(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-600" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-600" />;
      case 'audio':
        return <Music className="w-5 h-5 text-purple-600" />;
      case 'doc':
      case 'slides':
        return <File className="w-5 h-5 text-blue-600" />;
      default:
        return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Arquivos, Imagens & Documentos
          </h1>
          <p className="text-xs sm:text-sm text-[#919196] mt-1">
            Central de PDFs, apostilas, slides de aulas, fotos de lâminas e áudios de gravação
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          Fazer Upload
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121214] p-3 rounded-2xl border border-[#242427]">
        <div className="flex items-center flex-wrap gap-2">
          {/* Discipline filter */}
          <select
            value={selectedDisciplineId}
            onChange={(e) => setSelectedDisciplineId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-xs font-semibold focus:outline-none"
          >
            <option value="">Todas as Disciplinas</option>
            {db.disciplines.filter((d) => d.semesterId === currentSemesterId).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Type filters */}
          <div className="flex items-center bg-[#1C1C1F] p-1 rounded-xl gap-1 border border-[#242427]">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition cursor-pointer ${
                filterType === 'all' ? 'bg-[#242427] text-white font-bold' : 'text-[#919196] hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('pdf')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition cursor-pointer ${
                filterType === 'pdf' ? 'bg-[#242427] text-rose-400 font-bold' : 'text-[#919196] hover:text-rose-400'
              }`}
            >
              PDFs
            </button>
            <button
              onClick={() => setFilterType('image')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition cursor-pointer ${
                filterType === 'image' ? 'bg-[#242427] text-emerald-400 font-bold' : 'text-[#919196] hover:text-emerald-400'
              }`}
            >
              Imagens
            </button>
            <button
              onClick={() => setFilterType('doc')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition cursor-pointer ${
                filterType === 'doc' ? 'bg-[#242427] text-blue-400 font-bold' : 'text-[#919196] hover:text-blue-400'
              }`}
            >
              Docs/Slides
            </button>
            <button
              onClick={() => setFilterType('audio')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition cursor-pointer ${
                filterType === 'audio' ? 'bg-[#242427] text-purple-400 font-bold' : 'text-[#919196] hover:text-purple-400'
              }`}
            >
              Áudios
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#636366]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar arquivo ou apostila..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-xs text-white placeholder-[#636366] focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Files Grid */}
      {files.length === 0 ? (
        <div className="text-center py-16 bg-[#121214] rounded-2xl border border-dashed border-[#242427] p-8">
          <Folder className="w-12 h-12 text-[#636366] mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">
            Nenhum arquivo encontrado
          </h3>
          <p className="text-xs text-[#919196] mt-1 mb-4">
            Faça upload de apostilas, PDFs de artigos científicos, slides ou fotos de quadro.
          </p>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            + Fazer Upload de Arquivo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => {
            const discipline = db.disciplines.find((d) => d.id === file.disciplineId);
            const isPdf = file.type === 'pdf';
            const hasAnnotations = isPdf && file.annotations && JSON.parse(file.annotations).length > 0;

            return (
              <div
                key={file.id}
                className="p-4 rounded-2xl bg-[#121214] border border-[#242427] hover:border-[#3A3A3E] transition flex flex-col justify-between space-y-4 group relative"
              >
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-[#1C1C1F] border border-[#242427] shrink-0">
                    {getIconForType(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      {discipline ? (
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider inline-block"
                          style={{ backgroundColor: discipline.color }}
                        >
                          {discipline.name}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold text-[#919196] bg-[#1C1C1F] uppercase tracking-wider inline-block">
                          Geral
                        </span>
                      )}
                      {hasAnnotations && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold text-rose-400 bg-rose-500/10 border border-rose-500/20 uppercase tracking-widest animate-pulse">
                          Anotado
                        </span>
                      )}
                    </div>

                    {renamingFileId === file.id ? (
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="text"
                          value={renamingName}
                          onChange={(e) => setRenamingName(e.target.value)}
                          className="px-2 py-1 text-xs rounded border border-blue-500 bg-[#1C1C1F] text-white focus:outline-none w-full"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameFile(file.id);
                            else if (e.key === 'Escape') setRenamingFileId(null);
                          }}
                        />
                        <button
                          onClick={() => handleRenameFile(file.id)}
                          className="p-1 rounded bg-green-600 hover:bg-green-500 text-white transition cursor-pointer"
                          title="Salvar"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setRenamingFileId(null)}
                          className="p-1 rounded bg-[#242427] hover:bg-red-900/40 text-[#919196] hover:text-white transition cursor-pointer"
                          title="Cancelar"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1 group/title">
                        <h4 className="font-semibold text-xs text-white truncate max-w-[85%]">
                          {file.name}
                        </h4>
                        <button
                          onClick={() => {
                            setRenamingFileId(file.id);
                            setRenamingName(file.name);
                          }}
                          className="text-[#919196] hover:text-white p-0.5 rounded opacity-0 group-hover/title:opacity-100 transition cursor-pointer"
                          title="Renomear arquivo"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <p className="text-[10px] text-[#636366] mt-1">
                      Tamanho: {file.size}
                    </p>
                    <p className="text-[10px] text-[#919196] mt-0.5">
                      Última edição: {new Date(file.updatedAt || file.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {isPdf && (
                  <button
                    onClick={() => setActivePdfFile(file)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white text-xs font-bold rounded-xl border border-rose-500/20 hover:border-transparent transition duration-200 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <FileText className="w-4 h-4" />
                    Abrir e Anotar PDF
                  </button>
                )}

                {/* File actions */}
                <div className="pt-2 border-t border-[#242427] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    {file.type === 'image' && (
                      <button
                        onClick={() => handleRunOCROnFile(file)}
                        disabled={ocrLoading}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold hover:bg-blue-500/20 transition cursor-pointer mr-1"
                        title="Transcrever texto e notas manuscritas com IA"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        OCR IA
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setRenamingFileId(file.id);
                        setRenamingName(file.name);
                      }}
                      className="p-1.5 text-[#919196] hover:text-white rounded-lg hover:bg-[#1C1C1F] transition cursor-pointer"
                      title="Renomear"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDuplicateFile(file)}
                      className="p-1.5 text-[#919196] hover:text-white rounded-lg hover:bg-[#1C1C1F] transition cursor-pointer"
                      title="Duplicar"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <a
                      href={file.url}
                      download={file.name}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-[#919196] hover:text-white rounded-lg hover:bg-[#1C1C1F] transition cursor-pointer"
                      title={isPdf ? "Baixar PDF Original" : "Download original"}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="p-1.5 text-[#919196] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Excluir arquivo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[#242427] bg-[#161618]">
              <h3 className="text-base font-bold text-white">
                Upload de Arquivo Acadêmico
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-[#919196] hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Drop area */}
              <div className="border-2 border-dashed border-[#242427] rounded-2xl p-6 text-center hover:border-blue-500 transition bg-[#161618]">
                <Upload className="w-8 h-8 text-[#919196] mx-auto mb-2" />
                <p className="text-xs font-semibold text-white">
                  Arraste seu arquivo ou clique para selecionar
                </p>
                <p className="text-[10px] text-[#919196] mt-1">
                  Suporta PDF, JPG, PNG, DOCX, PPTX, MP3
                </p>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="mt-3 block w-full text-xs text-[#919196] file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
              </div>

              {fileName && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                      Nome do Arquivo
                    </label>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                      Tipo de Arquivo (Para visualização)
                    </label>
                    <select
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="pdf">Documento PDF (Editável/Anotável)</option>
                      <option value="image">Imagem (Suporta Transcrição OCR)</option>
                      <option value="doc">Documento / Slide / Outros</option>
                      <option value="audio">Áudio (Gravação/MP3)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-[#919196] mb-1">
                      Vincular à Disciplina
                    </label>
                    <select
                      value={fileDisciplineId}
                      onChange={(e) => setFileDisciplineId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#242427] text-xs bg-[#1C1C1F] text-white focus:outline-none"
                    >
                      <option value="">Geral (Sem disciplina vinculada)</option>
                      {db.disciplines.filter((d) => d.semesterId === currentSemesterId).map((d) => (
                        <option key={d.id} value={d.id} className="bg-[#1C1C1F] text-white">
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#242427]">
                <button
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#919196] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveFile}
                  disabled={!fileName.trim() || !fileUrl}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  Salvar Arquivo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePdfFile && (
        <PdfAnnotator
          file={activePdfFile}
          onClose={() => setActivePdfFile(null)}
        />
      )}
    </div>
  );
};
