import React, { useState } from 'react';
import { StorageService } from '../../lib/storage';
import { Discipline, WeeklySlot } from '../../types';
import { DisciplineModal } from '../semesters/DisciplineModal';
import {
  Clock,
  Plus,
  BookOpen,
  MapPin,
  User,
  Calendar,
  Grid,
  List,
  Edit2,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface ScheduleViewProps {
  onOpenDisciplineNotebook: (notebookId: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onOpenDisciplineNotebook }) => {
  const [db, setDb] = useState(() => StorageService.getDatabase());

  const refreshData = () => {
    setDb(StorageService.getDatabase());
  };

  const currentSemesterId = db.profile.activeSemesterId;
  const currentSemester = db.semesters.find((s) => s.id === currentSemesterId);

  const [disciplineModalOpen, setDisciplineModalOpen] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const disciplines = db.disciplines.filter((d) => d.semesterId === currentSemesterId);

  const daysOfWeek = [
    { day: 1, name: 'Segunda-feira', short: 'SEG' },
    { day: 2, name: 'Terça-feira', short: 'TER' },
    { day: 3, name: 'Quarta-feira', short: 'QUA' },
    { day: 4, name: 'Quinta-feira', short: 'QUI' },
    { day: 5, name: 'Sexta-feira', short: 'SEX' },
    { day: 6, name: 'Sábado', short: 'SÁB' },
  ];

  // Group slots by day
  const getSlotsForDay = (day: number) => {
    const slots: { discipline: Discipline; slot: WeeklySlot }[] = [];
    disciplines.forEach((d) => {
      d.scheduleSlots?.forEach((slot) => {
        if (slot.dayOfWeek === day) {
          slots.push({ discipline: d, slot });
        }
      });
    });
    return slots.sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));
  };

  const handleOpenNotebookForDiscipline = (disciplineId: string) => {
    const targetNotebook = db.notebooks.find((n) => n.disciplineId === disciplineId);
    if (targetNotebook) {
      onOpenDisciplineNotebook(targetNotebook.id);
    } else {
      // If no notebook exists for this discipline, create one or open first
      const firstNotebook = db.notebooks[0];
      if (firstNotebook) onOpenDisciplineNotebook(firstNotebook.id);
    }
  };

  const handleDeleteDiscipline = (discId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Deseja remover esta disciplina e seus horários?')) {
      StorageService.update((draft) => {
        draft.disciplines = draft.disciplines.filter((d) => d.id !== discId);
      });
      refreshData();
    }
  };

  // Calculate total weekly hours
  let totalMinutes = 0;
  disciplines.forEach((d) => {
    d.scheduleSlots?.forEach((s) => {
      const [startH, startM] = s.startTime.split(':').map(Number);
      const [endH, endM] = s.endTime.split(':').map(Number);
      if (!isNaN(startH) && !isNaN(endH)) {
        totalMinutes += endH * 60 + endM - (startH * 60 + startM);
      }
    });
  });
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Workload Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121214] p-5 rounded-2xl border border-[#242427] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Grade Horária Semanal
            </h1>
            <p className="text-xs text-[#919196]">
              {currentSemester?.name} • {disciplines.length} matérias cadastradas • ~{totalHours}h semanais
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode */}
          <div className="flex items-center bg-[#1C1C1F] p-1 rounded-xl border border-[#242427]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#2A2A2D] text-white shadow-xs'
                  : 'text-[#919196] hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grade</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#2A2A2D] text-white shadow-xs'
                  : 'text-[#919196] hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingDiscipline(null);
              setDisciplineModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Matéria / Horário</span>
          </button>
        </div>
      </div>

      {/* Grid View of Weekly Days */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {daysOfWeek.map(({ day, name, short }) => {
            const daySlots = getSlotsForDay(day);
            const isToday = new Date().getDay() === day;

            return (
              <div
                key={day}
                className={`bg-[#121214] rounded-2xl border p-4 shadow-xs flex flex-col space-y-3 ${
                  isToday
                    ? 'border-blue-500/50 bg-[#141820]'
                    : 'border-[#242427]'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#242427]">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {name}
                    </h3>
                    <span className="text-[10px] text-[#636366] font-semibold">{short}</span>
                  </div>
                  {isToday && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-600 text-white">
                      Hoje
                    </span>
                  )}
                </div>

                {/* Day Slots List */}
                <div className="flex-1 space-y-2.5">
                  {daySlots.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#636366] italic">
                      Sem aulas
                    </div>
                  ) : (
                    daySlots.map(({ discipline, slot }) => (
                      <div
                        key={slot.id}
                        onClick={() => handleOpenNotebookForDiscipline(discipline.id)}
                        className="p-3 rounded-xl border border-[#242427] bg-[#1C1C1F] hover:border-blue-500/50 transition space-y-1.5 cursor-pointer group shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider"
                            style={{ backgroundColor: discipline.color }}
                          >
                            {discipline.name}
                          </span>
                          <span className="text-[11px] font-bold text-[#E2E2E2]">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#919196] flex items-center gap-1.5 pt-0.5">
                          <MapPin className="w-3 h-3 text-[#636366]" />
                          <span>{slot.room || discipline.room || 'Campus'}</span>
                        </p>

                        {discipline.professor && (
                          <p className="text-[10px] text-[#919196] flex items-center gap-1.5">
                            <User className="w-3 h-3 text-[#636366]" />
                            <span>Prof. {discipline.professor}</span>
                          </p>
                        )}

                        <div className="pt-1 flex items-center justify-between text-[10px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition">
                          <span>Abrir Caderno →</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View of All Disciplines and Schedules */
        <div className="bg-[#121214] p-6 rounded-2xl border border-[#242427] shadow-xs space-y-4">
          <div className="divide-y divide-[#242427] space-y-4">
            {disciplines.map((disc) => (
              <div key={disc.id} className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span
                    className="w-3 h-12 rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: disc.color }}
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-white">
                        {disc.name}
                      </h3>
                      {disc.code && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1C1C1F] text-[#919196] border border-[#242427]">
                          {disc.code}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#919196]">
                      {disc.professor ? `Prof. ${disc.professor}` : 'Sem professor informado'} •{' '}
                      {disc.room || 'Sala não definida'} ({disc.workloadHours || 60}h)
                    </p>

                    {/* Weekly Schedule Slots */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {disc.scheduleSlots?.map((slot) => {
                        const dayName = daysOfWeek.find((d) => d.day === slot.dayOfWeek)?.short || 'DIA';
                        return (
                          <span
                            key={slot.id}
                            className="px-2.5 py-1 rounded-xl text-[10px] font-medium bg-[#1C1C1F] text-[#E2E2E2] border border-[#242427]"
                          >
                            📅 {dayName}: {slot.startTime} - {slot.endTime} ({slot.room || 'Sala Padrão'})
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleOpenNotebookForDiscipline(disc.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#242427] text-xs font-semibold text-blue-400 hover:bg-[#1C1C1F] hover:border-blue-500/50 transition cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Caderno
                  </button>
                  <button
                    onClick={() => {
                      setEditingDiscipline(disc);
                      setDisciplineModalOpen(true);
                    }}
                    className="p-2 text-[#919196] hover:text-white hover:bg-[#1C1C1F] rounded-xl transition cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteDiscipline(disc.id, e)}
                    className="p-2 text-[#919196] hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discipline Modal */}
      {disciplineModalOpen && (
        <DisciplineModal
          isOpen={disciplineModalOpen}
          onClose={() => {
            setDisciplineModalOpen(false);
            setEditingDiscipline(null);
          }}
          activeSemesterId={currentSemesterId}
          disciplineToEdit={editingDiscipline}
          onSaved={refreshData}
        />
      )}
    </div>
  );
};
