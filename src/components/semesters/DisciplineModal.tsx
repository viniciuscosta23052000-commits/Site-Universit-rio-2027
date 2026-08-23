import React, { useState } from 'react';
import { Discipline, WeeklySlot } from '../../types';
import { StorageService } from '../../lib/storage';
import { X, BookOpen, Plus, Trash2, Clock, MapPin, User, Check, Palette } from 'lucide-react';

interface DisciplineModalProps {
  isOpen: boolean;
  onClose: () => void;
  disciplineToEdit?: Discipline | null;
  activeSemesterId: string;
  onSaved?: (discipline: Discipline) => void;
}

const PRESET_COLORS = [
  '#4A6B53', // Sage / Forest green
  '#B85D43', // Warm Terracotta
  '#4B6584', // Slate Blue
  '#7A528A', // Muted Purple
  '#D97706', // Warm Amber
  '#2563EB', // Royal Blue
  '#059669', // Emerald
  '#DC2626', // Crimson
  '#475569', // Graphite
];

const PRESET_ICONS = [
  'BookOpen',
  'HeartPulse',
  'Microscope',
  'Pill',
  'Dna',
  'Stethoscope',
  'GraduationCap',
  'FileText',
  'FlaskConical',
  'Calculator',
  'Scale',
  'Code',
];

const DAYS_OF_WEEK = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

export const DisciplineModal: React.FC<DisciplineModalProps> = ({
  isOpen,
  onClose,
  disciplineToEdit,
  activeSemesterId,
  onSaved,
}) => {
  const [name, setName] = useState(disciplineToEdit?.name || '');
  const [code, setCode] = useState(disciplineToEdit?.code || '');
  const [professor, setProfessor] = useState(disciplineToEdit?.professor || '');
  const [room, setRoom] = useState(disciplineToEdit?.room || '');
  const [campus, setCampus] = useState(disciplineToEdit?.campus || 'Campus Principal');
  const [color, setColor] = useState(disciplineToEdit?.color || PRESET_COLORS[0]);
  const [icon, setIcon] = useState(disciplineToEdit?.icon || 'BookOpen');
  const [coverImage, setCoverImage] = useState(disciplineToEdit?.coverImage || '');
  const [workloadHours, setWorkloadHours] = useState(disciplineToEdit?.workloadHours || 60);
  const [observations, setObservations] = useState(disciplineToEdit?.observations || '');
  const [scheduleSlots, setScheduleSlots] = useState<WeeklySlot[]>(
    disciplineToEdit?.scheduleSlots || [
      { id: `slot-${Date.now()}`, dayOfWeek: 1, startTime: '08:00', endTime: '10:00', room: 'Sala 101' },
    ]
  );

  if (!isOpen) return null;

  const handleAddSlot = () => {
    setScheduleSlots([
      ...scheduleSlots,
      {
        id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        dayOfWeek: 2,
        startTime: '10:00',
        endTime: '12:00',
        room: room || 'Sala 101',
      },
    ]);
  };

  const handleRemoveSlot = (id: string) => {
    setScheduleSlots(scheduleSlots.filter((s) => s.id !== id));
  };

  const handleUpdateSlot = (id: string, field: keyof WeeklySlot, value: any) => {
    setScheduleSlots(
      scheduleSlots.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const discId = disciplineToEdit ? disciplineToEdit.id : `disc-${Date.now()}`;
    const newDiscipline: Discipline = {
      id: discId,
      semesterId: activeSemesterId,
      name: name.trim(),
      code: code.trim(),
      professor: professor.trim(),
      room: room.trim(),
      campus: campus.trim(),
      color,
      icon,
      coverImage,
      workloadHours: Number(workloadHours),
      observations: observations.trim(),
      scheduleSlots,
      createdAt: disciplineToEdit?.createdAt || new Date().toISOString(),
    };

    StorageService.update((draft) => {
      if (disciplineToEdit) {
        const index = draft.disciplines.findIndex((d) => d.id === disciplineToEdit.id);
        if (index !== -1) {
          draft.disciplines[index] = newDiscipline;
        }
      } else {
        draft.disciplines.push(newDiscipline);

        // Auto-create a linked Notebook for this discipline!
        draft.notebooks.push({
          id: `nb-${Date.now()}`,
          semesterId: activeSemesterId,
          disciplineId: newDiscipline.id,
          name: `Caderno de ${newDiscipline.name}`,
          description: `Anotações e materiais da disciplina de ${newDiscipline.name}`,
          color: newDiscipline.color,
          icon: newDiscipline.icon,
          coverImage: newDiscipline.coverImage || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80',
          isFavorite: false,
          isArchived: false,
          order: draft.notebooks.length + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    if (onSaved) onSaved(newDiscipline);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-[#242427] bg-[#1C1C1F]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {disciplineToEdit ? 'Editar Disciplina' : 'Nova Disciplina'}
              </h2>
              <p className="text-xs text-[#919196]">
                Cadastre a matéria, horários e professor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#919196] hover:text-white hover:bg-[#242427] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-[#E2E2E2]">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
              Nome da Disciplina *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Anatomia Topográfica, Direito Civil, etc."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-sm text-white placeholder-[#636366] focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Código / Sigla
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: VET301, MAT01"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-sm text-white placeholder-[#636366] focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Carga Horária (Horas)
              </label>
              <input
                type="number"
                value={workloadHours}
                onChange={(e) => setWorkloadHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Professor(a)
              </label>
              <input
                type="text"
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                placeholder="Ex: Dra. Helena Castro"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-sm text-white placeholder-[#636366] focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Sala / Laboratório
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Ex: Lab 4, Anfiteatro 2"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-sm text-white placeholder-[#636366] focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-2">
              Cor de Identificação
            </label>
            <div className="flex flex-wrap gap-2.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-500 ring-offset-[#121214]' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
              URL da Imagem de Capa (Opcional)
            </label>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#242427] bg-[#1C1C1F] text-xs text-white placeholder-[#636366] focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Schedule slots */}
          <div className="p-4 rounded-xl border border-[#242427] bg-[#1C1C1F] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Horários na Grade Semanal ({scheduleSlots.length})
              </span>
              <button
                type="button"
                onClick={handleAddSlot}
                className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Horário
              </button>
            </div>

            {scheduleSlots.map((slot) => (
              <div
                key={slot.id}
                className="grid grid-cols-12 gap-2 items-center bg-[#121214] p-2.5 rounded-xl border border-[#242427]"
              >
                <div className="col-span-4">
                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) => handleUpdateSlot(slot.id, 'dayOfWeek', Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#242427] bg-[#1C1C1F] text-xs text-white focus:outline-none"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.value} value={d.value} className="bg-[#1C1C1F] text-white">
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => handleUpdateSlot(slot.id, 'startTime', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#242427] bg-[#1C1C1F] text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleUpdateSlot(slot.id, 'endTime', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#242427] bg-[#1C1C1F] text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(slot.id)}
                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#242427] bg-[#1C1C1F]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#919196] hover:text-white rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {disciplineToEdit ? 'Salvar Disciplina' : 'Cadastrar Disciplina'}
          </button>
        </div>
      </div>
    </div>
  );
};
