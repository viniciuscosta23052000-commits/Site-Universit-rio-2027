import React, { useState } from 'react';
import { AcademicTask, TaskPriority, TaskStatus } from '../../types';
import { StorageService } from '../../lib/storage';
import { X, CheckSquare, Calendar, Clock, Tag, Flag, Check, Star } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: AcademicTask | null;
  activeSemesterId: string;
  onSaved?: (task: AcademicTask) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  activeSemesterId,
  onSaved,
}) => {
  const db = StorageService.getDatabase();
  const activeDisciplines = db.disciplines.filter((d) => d.semesterId === activeSemesterId);

  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [description, setDescription] = useState(taskToEdit?.description || '');
  const [date, setDate] = useState(taskToEdit?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(taskToEdit?.time || '');
  const [priority, setPriority] = useState<TaskPriority>(taskToEdit?.priority || 'medium');
  const [status, setStatus] = useState<TaskStatus>(taskToEdit?.status || 'todo');
  const [disciplineId, setDisciplineId] = useState(taskToEdit?.disciplineId || '');
  const [deadline, setDeadline] = useState(taskToEdit?.deadline || '');
  const [isTop3, setIsTop3] = useState(taskToEdit?.isTop3 || false);
  const [tagInput, setTagInput] = useState(taskToEdit?.tags?.join(' ') || '');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) return;

    const tags = tagInput
      .split(' ')
      .filter((t) => t.trim().length > 0)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const taskId = taskToEdit ? taskToEdit.id : `task-${Date.now()}`;
    const newTask: AcademicTask = {
      id: taskId,
      semesterId: activeSemesterId,
      disciplineId: disciplineId || undefined,
      title: title.trim(),
      description: description.trim(),
      date,
      time: time || undefined,
      priority,
      status,
      deadline: deadline || undefined,
      isTop3,
      order: taskToEdit?.order || db.tasks.length + 1,
      tags,
      createdAt: taskToEdit?.createdAt || new Date().toISOString(),
    };

    StorageService.update((draft) => {
      if (taskToEdit) {
        const index = draft.tasks.findIndex((t) => t.id === taskToEdit.id);
        if (index !== -1) draft.tasks[index] = newTask;
      } else {
        draft.tasks.unshift(newTask);
      }
    });

    if (onSaved) onSaved(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-[#242427] bg-[#161618]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1C1C1F] border border-[#242427] text-blue-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {taskToEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h2>
              <p className="text-xs text-[#919196]">
                Organize suas metas, entregas e estudos diários
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#919196] hover:text-white hover:bg-[#1C1C1F] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
              Título da Tarefa *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Resolver lista de Farmacocinética..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
              Descrição / Detalhes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Anotações adicionais, links, páginas do livro..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Disciplina Vinculada
              </label>
              <select
                value={disciplineId}
                onChange={(e) => setDisciplineId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-sm focus:outline-none"
              >
                <option value="" className="bg-[#1C1C1F] text-white">Geral (Sem disciplina)</option>
                {activeDisciplines.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#1C1C1F] text-white">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-sm focus:outline-none"
              >
                <option value="low" className="bg-[#1C1C1F] text-white">🟢 Baixa</option>
                <option value="medium" className="bg-[#1C1C1F] text-white">🟡 Média</option>
                <option value="high" className="bg-[#1C1C1F] text-white">🟠 Alta</option>
                <option value="urgent" className="bg-[#1C1C1F] text-white">🔴 Urgente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Data Prevista
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Prazo Final (Deadline)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
              Tags (separadas por espaço)
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Ex: #prova #resumo #artigo"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="p-3.5 rounded-xl border border-[#242427] bg-[#161618]">
            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-white">
              <input
                type="checkbox"
                checked={isTop3}
                onChange={(e) => setIsTop3(e.target.checked)}
                className="rounded accent-blue-600 focus:ring-0"
              />
              <span className="flex items-center gap-1.5 text-xs text-[#EDEDED]">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                Marcar como "Top 3 da semana" (Destaque no Dashboard)
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#242427] bg-[#161618]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#919196] hover:text-white transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {taskToEdit ? 'Salvar Alterações' : 'Criar Tarefa'}
          </button>
        </div>
      </div>
    </div>
  );
};
