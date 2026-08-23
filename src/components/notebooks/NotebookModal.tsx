import React, { useState, useRef } from 'react';
import { Notebook } from '../../types';
import { StorageService } from '../../lib/storage';
import { X, BookOpen, Check, Image as ImageIcon, Upload } from 'lucide-react';
import { UniversalImageEditor, ImageEditParams } from '../editor/UniversalImageEditor';

interface NotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebookToEdit?: Notebook | null;
  activeSemesterId: string;
  onSaved?: (notebook: Notebook) => void;
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507842229451-79b1be8868f0?w=800&auto=format&fit=crop&q=80',
];

const PRESET_COLORS = ['#4A6B53', '#B85D43', '#4B6584', '#7A528A', '#D97706', '#2563EB', '#059669', '#374151'];

export const NotebookModal: React.FC<NotebookModalProps> = ({
  isOpen,
  onClose,
  notebookToEdit,
  activeSemesterId,
  onSaved,
}) => {
  const db = StorageService.getDatabase();
  const activeDisciplines = db.disciplines.filter((d) => d.semesterId === activeSemesterId);

  const [name, setName] = useState(notebookToEdit?.name || '');
  const [description, setDescription] = useState(notebookToEdit?.description || '');
  const [disciplineId, setDisciplineId] = useState(notebookToEdit?.disciplineId || '');
  const [color, setColor] = useState(notebookToEdit?.color || PRESET_COLORS[0]);
  const [coverImage, setCoverImage] = useState(notebookToEdit?.coverImage || PRESET_COVERS[0]);
  const [originalCoverImage, setOriginalCoverImage] = useState(notebookToEdit?.originalCoverImage || '');
  const [coverImageEditParams, setCoverImageEditParams] = useState<any>(notebookToEdit?.coverImageEditParams || null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [uploadOriginalSrc, setUploadOriginalSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCustomCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadOriginalSrc(base64);
      setIsEditorOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveCoverImage = (editedUrl: string, params: ImageEditParams) => {
    setCoverImage(editedUrl);
    setOriginalCoverImage(uploadOriginalSrc || originalCoverImage || editedUrl);
    setCoverImageEditParams(params);
    setIsEditorOpen(false);
    setUploadOriginalSrc(null);
  };

  const [icon, setIcon] = useState(notebookToEdit?.icon || 'BookOpen');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;

    const nbId = notebookToEdit ? notebookToEdit.id : `nb-${Date.now()}`;
    const newNb: Notebook = {
      id: nbId,
      semesterId: activeSemesterId,
      disciplineId: disciplineId || undefined,
      name: name.trim(),
      description: description.trim(),
      color,
      coverImage,
      originalCoverImage: originalCoverImage || undefined,
      coverImageEditParams: coverImageEditParams || undefined,
      icon,
      isFavorite: notebookToEdit?.isFavorite || false,
      isArchived: notebookToEdit?.isArchived || false,
      order: notebookToEdit?.order || db.notebooks.length + 1,
      createdAt: notebookToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.update((draft) => {
      if (notebookToEdit) {
        const index = draft.notebooks.findIndex((n) => n.id === notebookToEdit.id);
        if (index !== -1) draft.notebooks[index] = newNb;
      } else {
        draft.notebooks.push(newNb);
        // Add default Chapter 01
        draft.chapters.push({
          id: `chap-${Date.now()}`,
          notebookId: newNb.id,
          name: 'Capítulo 01 — Introdução',
          description: 'Primeiro capítulo de anotações',
          color: newNb.color,
          order: 1,
          createdAt: new Date().toISOString(),
        });
      }
    });

    if (onSaved) onSaved(newNb);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-[#242427] bg-[#1C1C1F]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {notebookToEdit ? 'Editar Caderno' : 'Novo Caderno de Estudos'}
              </h3>
              <p className="text-xs text-[#919196]">
                Organize suas matérias por capítulos e aulas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#919196] hover:bg-[#242427] hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-[#E2E2E2]">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
              Nome do Caderno *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Caderno de Fisiologia Veterinária"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-sm text-white placeholder-[#636366] focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Vincular a Disciplina
              </label>
              <select
                value={disciplineId}
                onChange={(e) => {
                  setDisciplineId(e.target.value);
                  const selectedDisc = activeDisciplines.find((d) => d.id === e.target.value);
                  if (selectedDisc) {
                    setColor(selectedDisc.color);
                    if (!name) setName(`Caderno de ${selectedDisc.name}`);
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-xs text-white focus:outline-none"
              >
                <option value="" className="bg-[#1C1C1F] text-white">Geral (Sem disciplina vinculada)</option>
                {activeDisciplines.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#1C1C1F] text-white">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-2">
                Cor do Caderno
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                      color === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-500 ring-offset-[#121214]' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
              Descrição do Caderno
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Aulas práticas, teoria de lâminas e resumos para prova..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-xs text-white placeholder-[#636366] focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196]">
                Capa do Caderno
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Enviar Foto Personalizada
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCustomCoverSelect}
              accept="image/*"
              className="hidden"
            />

            {coverImage && (
              <div className="relative h-28 rounded-xl overflow-hidden mb-3 border border-[#242427] group">
                <img src={coverImage} alt="Preview Capa" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (originalCoverImage || coverImage.startsWith('data:')) {
                        setUploadOriginalSrc(originalCoverImage || coverImage);
                        setIsEditorOpen(true);
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Editar Capa Atual
                  </button>
                </div>
              </div>
            )}

            <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
              Ou escolha uma das capas sugeridas:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COVERS.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setCoverImage(imgUrl);
                    setOriginalCoverImage('');
                    setCoverImageEditParams(null);
                  }}
                  className={`h-12 rounded-lg overflow-hidden cursor-pointer border-2 transition ${
                    coverImage === imgUrl && !originalCoverImage ? 'border-blue-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt="Capa" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-[#242427] bg-[#1C1C1F]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#919196] hover:text-white rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {notebookToEdit ? 'Salvar Alterações' : 'Criar Caderno'}
          </button>
        </div>
      </div>

      {isEditorOpen && uploadOriginalSrc && (
        <UniversalImageEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setUploadOriginalSrc(null);
          }}
          title="Personalizar Capa do Caderno"
          originalImage={uploadOriginalSrc}
          editParams={coverImageEditParams}
          circleCrop={false}
          aspectRatios={['free', '16:9', '4:3', '1:1']}
          onSave={handleSaveCoverImage}
        />
      )}
    </div>
  );
};
