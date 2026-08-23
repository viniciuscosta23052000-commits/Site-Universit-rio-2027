import React, { useState } from 'react';
import { Notebook, Semester, Discipline } from '../../types';
import { StorageService } from '../../lib/storage';
import { NotebookModal } from './NotebookModal';
import {
  BookOpen,
  Plus,
  Search,
  Star,
  MoreVertical,
  Layers,
  FileText,
  Calendar,
  Trash2,
  Edit2,
  FolderPlus,
  Archive,
} from 'lucide-react';

interface NotebooksListProps {
  onSelectNotebook: (notebookId: string) => void;
  onOpenLesson: (lessonId: string) => void;
}

export const NotebooksList: React.FC<NotebooksListProps> = ({ onSelectNotebook, onOpenLesson }) => {
  const db = StorageService.getDatabase();
  const currentSemesterId = db.profile.activeSemesterId;
  const currentSemester = db.semesters.find((s) => s.id === currentSemesterId);

  const [filterSemesterId, setFilterSemesterId] = useState(currentSemesterId);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'favorites' | 'archived'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);

  // Filter notebooks
  const notebooks = db.notebooks.filter((nb) => {
    if (filterType === 'favorites') return nb.isFavorite && !nb.isArchived;
    if (filterType === 'archived') return nb.isArchived;
    return nb.semesterId === filterSemesterId && !nb.isArchived;
  }).filter((nb) => {
    if (!searchQuery.trim()) return true;
    return (
      nb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nb.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleToggleFavorite = (nbId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.update((draft) => {
      const nb = draft.notebooks.find((item) => item.id === nbId);
      if (nb) nb.isFavorite = !nb.isFavorite;
    });
  };

  const handleDeleteNotebook = (nbId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja realmente excluir este caderno e todas as suas anotações?')) {
      StorageService.update((draft) => {
        draft.notebooks = draft.notebooks.filter((n) => n.id !== nbId);
        draft.chapters = draft.chapters.filter((c) => c.notebookId !== nbId);
        draft.lessons = draft.lessons.filter((l) => l.notebookId !== nbId);
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Cadernos Digitais
          </h1>
          <p className="text-xs sm:text-sm text-[#919196] mt-1">
            Seus cadernos, fichários e anotações organizadas por matéria e capítulo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingNotebook(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Caderno
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121214] p-3 rounded-2xl border border-[#242427] shadow-xs">
        {/* Semester switcher and filter tabs */}
        <div className="flex items-center flex-wrap gap-2">
          <select
            value={filterSemesterId}
            onChange={(e) => setFilterSemesterId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-xs font-medium text-[#E2E2E2] focus:outline-none"
          >
            {db.semesters.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#1C1C1F] text-white">
                {s.name} {s.isArchived ? '(Arquivado)' : ''}
              </option>
            ))}
          </select>

          <div className="flex items-center bg-[#1C1C1F] p-1 rounded-xl gap-1 border border-[#242427]">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-xs rounded-lg transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#2A2A2D] text-white font-semibold shadow-xs'
                  : 'text-[#919196] hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('favorites')}
              className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg transition cursor-pointer ${
                filterType === 'favorites'
                  ? 'bg-[#2A2A2D] text-amber-400 font-semibold shadow-xs'
                  : 'text-[#919196] hover:text-white'
              }`}
            >
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              Favoritos
            </button>
            <button
              onClick={() => setFilterType('archived')}
              className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg transition cursor-pointer ${
                filterType === 'archived'
                  ? 'bg-[#2A2A2D] text-white font-semibold shadow-xs'
                  : 'text-[#919196] hover:text-white'
              }`}
            >
              <Archive className="w-3 h-3" />
              Arquivados
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#636366]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar caderno ou anotação..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-xs text-[#E2E2E2] placeholder-[#636366] focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Notebook Cards Grid */}
      {notebooks.length === 0 ? (
        <div className="text-center py-16 bg-[#121214] rounded-2xl border border-dashed border-[#242427] p-8">
          <BookOpen className="w-12 h-12 text-[#636366] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">
            Nenhum caderno encontrado
          </h3>
          <p className="text-xs text-[#919196] mt-1 mb-4">
            Crie seu primeiro caderno digital para organizar suas matérias da faculdade.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer"
          >
            + Criar Novo Caderno
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {notebooks.map((nb) => {
            const discipline = db.disciplines.find((d) => d.id === nb.disciplineId);
            const chapters = db.chapters.filter((c) => c.notebookId === nb.id);
            const lessons = db.lessons.filter((l) => l.notebookId === nb.id);

            return (
              <div
                key={nb.id}
                onClick={() => onSelectNotebook(nb.id)}
                className="group relative bg-[#121214] rounded-2xl border border-[#242427] hover:border-blue-500/50 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col transform hover:-translate-y-1 shadow-xs"
              >
                {/* Cover Image Banner */}
                <div className="h-36 w-full relative overflow-hidden bg-[#1C1C1F]">
                  {nb.coverImage ? (
                    <img
                      src={nb.coverImage}
                      alt={nb.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white"
                      style={{ backgroundColor: nb.color }}
                    >
                      <BookOpen className="w-12 h-12 opacity-30" />
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-black/40 to-transparent" />

                  {/* Discipline Badge */}
                  {discipline && (
                    <span
                      className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-xs shadow-xs"
                      style={{ backgroundColor: discipline.color }}
                    >
                      {discipline.name}
                    </span>
                  )}

                  {/* Favorite star */}
                  <button
                    onClick={(e) => handleToggleFavorite(nb.id, e)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:scale-110 transition cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        nb.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-white/60'
                      }`}
                    />
                  </button>

                  {/* Title over cover */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-base font-semibold text-white line-clamp-1 drop-shadow-xs">
                      {nb.name}
                    </h3>
                  </div>
                </div>

                {/* Content body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <p className="text-xs text-[#919196] line-clamp-2 leading-relaxed">
                    {nb.description || 'Caderno de anotações universitárias'}
                  </p>

                  {/* Stats and chapters */}
                  <div className="pt-2 border-t border-[#242427] flex items-center justify-between text-[11px] text-[#919196]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-medium">
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                        {chapters.length} {chapters.length === 1 ? 'capítulo' : 'capítulos'}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        {lessons.length} {lessons.length === 1 ? 'aula' : 'aulas'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNotebook(nb);
                          setModalOpen(true);
                        }}
                        className="p-1.5 text-[#919196] hover:text-white rounded-lg hover:bg-[#1C1C1F] transition cursor-pointer"
                        title="Editar caderno"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteNotebook(nb.id, e)}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                        title="Excluir caderno"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <NotebookModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingNotebook(null);
          }}
          notebookToEdit={editingNotebook}
          activeSemesterId={filterSemesterId}
        />
      )}
    </div>
  );
};
