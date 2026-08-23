import React, { useState } from 'react';
import { AcademicEvent, EventType, TaskPriority } from '../../types';
import { StorageService } from '../../lib/storage';
import { X, Calendar, Clock, MapPin, Check } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: AcademicEvent | null;
  activeSemesterId: string;
  defaultDate?: string;
  onSaved?: (event: AcademicEvent) => void;
}

const EVENT_TYPE_MAP: Record<EventType, { label: string; defaultColor: string; icon: string }> = {
  exam: { label: 'Prova / Exame', defaultColor: '#DC2626', icon: '📝' },
  assignment: { label: 'Trabalho Acadêmico', defaultColor: '#2563EB', icon: '📄' },
  seminar: { label: 'Seminário / Apresentação', defaultColor: '#7C3AED', icon: '🎤' },
  delivery: { label: 'Entrega de Relatório', defaultColor: '#D97706', icon: '📦' },
  class: { label: 'Aula Especial / Reposição', defaultColor: '#059669', icon: '🏫' },
  event: { label: 'Congresso / Evento Geral', defaultColor: '#475569', icon: '📅' },
};

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
  activeSemesterId,
  defaultDate,
  onSaved,
}) => {
  const db = StorageService.getDatabase();
  const activeDisciplines = db.disciplines.filter((d) => d.semesterId === activeSemesterId);

  const [title, setTitle] = useState(eventToEdit?.title || '');
  const [type, setType] = useState<EventType>(eventToEdit?.type || 'exam');
  const [disciplineId, setDisciplineId] = useState(eventToEdit?.disciplineId || '');
  const [date, setDate] = useState(eventToEdit?.date || defaultDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(eventToEdit?.time || '08:00');
  const [location, setLocation] = useState(eventToEdit?.location || '');
  const [description, setDescription] = useState(eventToEdit?.description || '');
  const [notes, setNotes] = useState(eventToEdit?.notes || '');
  const [priority, setPriority] = useState<TaskPriority>(eventToEdit?.priority || 'urgent');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) return;

    const eventId = eventToEdit ? eventToEdit.id : `event-${Date.now()}`;
    const newEvent: AcademicEvent = {
      id: eventId,
      semesterId: activeSemesterId,
      disciplineId: disciplineId || undefined,
      title: title.trim(),
      type,
      date,
      time: time || undefined,
      location: location.trim(),
      description: description.trim(),
      notes: notes.trim(),
      priority,
      color: EVENT_TYPE_MAP[type].defaultColor,
    };

    StorageService.update((draft) => {
      if (eventToEdit) {
        const index = draft.events.findIndex((e) => e.id === eventToEdit.id);
        if (index !== -1) draft.events[index] = newEvent;
      } else {
        draft.events.push(newEvent);
      }
    });

    if (onSaved) onSaved(newEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-[#242427] bg-[#161618]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-xs"
              style={{ backgroundColor: EVENT_TYPE_MAP[type].defaultColor }}
            >
              {EVENT_TYPE_MAP[type].icon}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {eventToEdit ? 'Editar Evento Acadêmico' : 'Novo Evento / Prova'}
              </h2>
              <p className="text-xs text-[#919196]">
                Provas, trabalhos, seminários e datas importantes
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
              Título do Evento *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Prova Bimestral 1 — Patologia Geral"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-xs placeholder-[#636366] focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Tipo de Evento
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-xs focus:outline-none"
              >
                {Object.entries(EVENT_TYPE_MAP).map(([key, info]) => (
                  <option key={key} value={key} className="bg-[#1C1C1F] text-white">
                    {info.icon} {info.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Disciplina
              </label>
              <select
                value={disciplineId}
                onChange={(e) => setDisciplineId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-xs focus:outline-none"
              >
                <option value="" className="bg-[#1C1C1F] text-white">Geral / Sem disciplina</option>
                {activeDisciplines.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#1C1C1F] text-white">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Data do Evento *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-xs focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Horário
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-xs focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
              Local / Sala / Plataforma
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Anfiteatro 2B, Lab de Microscopia..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-xs placeholder-[#636366] focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
              Conteúdo / Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Matéria que vai cair, temas do trabalho..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-xs placeholder-[#636366] focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
              Instruções / Material Necessário
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Levar jaleco, caneta azul, calculadora científica..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-xs placeholder-[#636366] focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#242427] bg-[#161618]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#919196] hover:text-white rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {eventToEdit ? 'Salvar Evento' : 'Agendar Evento'}
          </button>
        </div>
      </div>
    </div>
  );
};
