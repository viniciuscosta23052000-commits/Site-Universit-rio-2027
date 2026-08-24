import React, { useState } from 'react';
import { StorageService } from '../../lib/storage';
import { AcademicEvent, Discipline, EventType } from '../../types';
import { EventModal } from './EventModal';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  Tag,
  List,
  Grid,
  Trash2,
  Edit2,
} from 'lucide-react';

interface AcademicCalendarViewProps {
  onOpenEventDetail?: (event: AcademicEvent) => void;
}

export const AcademicCalendarView: React.FC<AcademicCalendarViewProps> = () => {
  const db = StorageService.getDatabase();
  const currentSemesterId = db.profile.activeSemesterId;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [filterDisciplineId, setFilterDisciplineId] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AcademicEvent | null>(null);

  const activeSemesterDisciplines = db.disciplines.filter((d) => d.semesterId === currentSemesterId);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const totalDaysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Filter events
  const filteredEvents = db.events.filter((e) => {
    if (e.semesterId !== currentSemesterId) return false;
    if (filterDisciplineId !== 'all' && e.disciplineId !== filterDisciplineId) return false;
    if (filterType !== 'all' && e.type !== filterType) return false;
    return true;
  });

  const getEventsForDate = (dateStr: string) => {
    return filteredEvents.filter((e) => e.date === dateStr);
  };

  const handleToggleComplete = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.update((draft) => {
      const target = draft.events.find((item) => item.id === eventId);
      if (target) {
        target.isCompleted = !target.isCompleted;
      }
    });
  };

  const handleDeleteEvent = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Deseja excluir este evento do calendário?')) {
      StorageService.update((draft) => {
        draft.events = draft.events.filter((item) => item.id !== eventId);
      });
    }
  };

  // Calendar cells generation
  const calendarCells = [];
  // Empty leading cells
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push(null);
  }
  // Days of month
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const formattedDay = day < 10 ? `0${day}` : `${day}`;
    const formattedMonth = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    calendarCells.push({ day, dateStr });
  }

  const selectedDateEvents = getEventsForDate(selectedDate);

  const getEventTypeLabel = (type: EventType) => {
    switch (type) {
      case 'exam':
        return 'Prova';
      case 'assignment':
        return 'Trabalho';
      case 'seminar':
        return 'Seminário';
      case 'delivery':
        return 'Entrega';
      case 'class':
        return 'Aula';
      default:
        return 'Evento';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121214] p-5 rounded-2xl border border-[#242427] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Calendário Acadêmico & Provas
            </h1>
            <p className="text-xs text-[#919196]">
              Acompanhe datas de exames, entregas, seminários e cronograma do semestre
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-[#1C1C1F] p-1 rounded-xl border border-[#242427]">
            <button
              onClick={() => setViewMode('month')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-[#2A2A2D] text-white shadow-xs'
                  : 'text-[#919196] hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mês</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-[#2A2A2D] text-white shadow-xs'
                  : 'text-[#919196] hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agenda</span>
            </button>
          </div>

          {/* New Event Button */}
          <button
            onClick={() => {
              setEditingEvent(null);
              setEventModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Evento / Prova</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-[#121214] p-3.5 rounded-2xl border border-[#242427] shadow-xs text-xs">
        <div className="flex items-center gap-2 text-[#919196]">
          <Filter className="w-4 h-4" />
          <span className="font-semibold text-white">Filtros:</span>
        </div>

        {/* Filter Discipline */}
        <select
          value={filterDisciplineId}
          onChange={(e) => setFilterDisciplineId(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white font-medium focus:outline-none"
        >
          <option value="all" className="bg-[#1C1C1F] text-white">Todas as Matérias</option>
          {activeSemesterDisciplines.map((d) => (
            <option key={d.id} value={d.id} className="bg-[#1C1C1F] text-white">
              {d.name}
            </option>
          ))}
        </select>

        {/* Filter Event Type */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white font-medium focus:outline-none"
        >
          <option value="all" className="bg-[#1C1C1F] text-white">Todos os Tipos</option>
          <option value="exam" className="bg-[#1C1C1F] text-white">Provas</option>
          <option value="assignment" className="bg-[#1C1C1F] text-white">Trabalhos</option>
          <option value="seminar" className="bg-[#1C1C1F] text-white">Seminários</option>
          <option value="delivery" className="bg-[#1C1C1F] text-white">Entregas</option>
          <option value="event" className="bg-[#1C1C1F] text-white">Outros Eventos</option>
        </select>
      </div>

      {/* Month Grid View */}
      {viewMode === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Month Grid */}
          <div className="lg:col-span-2 bg-[#121214] p-5 sm:p-6 rounded-2xl border border-[#242427] shadow-xs space-y-4">
            {/* Month Header Switcher */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {monthNames[month]} de {year}
              </h2>

              <div className="flex items-center gap-2">
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-xs font-semibold rounded-xl border border-[#242427] bg-[#1C1C1F] text-blue-400 hover:text-white transition cursor-pointer"
                >
                  Hoje
                </button>
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-xl text-[#919196] hover:text-white hover:bg-[#1C1C1F] transition cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-xl text-[#919196] hover:text-white hover:bg-[#1C1C1F] transition cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#636366] py-1 border-b border-[#242427]">
              {weekDayNames.map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarCells.map((cell, index) => {
                if (!cell) {
                  return <div key={`empty-${index}`} className="h-20 sm:h-24 rounded-xl bg-transparent" />;
                }

                const dayEvents = getEventsForDate(cell.dateStr);
                const isSelected = selectedDate === cell.dateStr;
                const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`h-20 sm:h-24 p-1.5 sm:p-2 rounded-xl border transition flex flex-col justify-between cursor-pointer group ${
                      isSelected
                        ? 'border-blue-500 bg-[#161C26]'
                        : isToday
                        ? 'border-blue-500/40 bg-[#141820]'
                        : 'border-[#242427] hover:border-[#38383C] bg-[#161618]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-blue-600 text-white'
                            : isSelected
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-[#E2E2E2]'
                        }`}
                      >
                        {cell.day}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-semibold text-[#919196] hidden sm:inline">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event badges in cell */}
                    <div className="space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold truncate text-white"
                          style={{ backgroundColor: ev.color || '#2563EB' }}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-[9px] text-[#919196] font-semibold">+ {dayEvents.length - 2} mais</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Detail Drawer */}
          <div className="bg-[#121214] p-5 sm:p-6 rounded-2xl border border-[#242427] shadow-xs space-y-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#242427]">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#919196]">
                  Eventos do Dia
                </span>
                <h3 className="text-base font-semibold text-white">
                  {selectedDate}
                </h3>
              </div>

              <button
                onClick={() => {
                  setEditingEvent(null);
                  setEventModalOpen(true);
                }}
                className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition cursor-pointer"
                title="Adicionar evento neste dia"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {selectedDateEvents.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#636366]">
                  Nenhum evento cadastrado para este dia.
                  <br />
                  Clique no botão acima para adicionar.
                </div>
              ) : (
                selectedDateEvents.map((ev) => {
                  const discipline = db.disciplines.find((d) => d.id === ev.disciplineId);

                  return (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl border border-[#242427] bg-[#1C1C1F] space-y-2 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider"
                          style={{ backgroundColor: ev.color || '#2563EB' }}
                        >
                          {getEventTypeLabel(ev.type)}
                        </span>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEvent(ev);
                              setEventModalOpen(true);
                            }}
                            className="p-1 text-[#919196] hover:text-white cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteEvent(ev.id, e)}
                            className="p-1 text-[#919196] hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-white">
                          {ev.title}
                        </h4>
                        {ev.description && (
                          <p className="text-[11px] text-[#919196] mt-0.5">{ev.description}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#919196] pt-1 border-t border-[#242427]">
                        {ev.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#636366]" /> {ev.time}
                          </span>
                        )}
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#636366]" /> {ev.location}
                          </span>
                        )}
                        {discipline && (
                          <span className="font-semibold" style={{ color: discipline.color }}>
                            ● {discipline.name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Agenda / List View */
        <div className="bg-[#121214] p-6 rounded-2xl border border-[#242427] shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-white">
            Cronograma Completo do Semestre ({filteredEvents.length} eventos)
          </h2>

          <div className="divide-y divide-[#242427] space-y-3">
            {filteredEvents
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((ev) => {
                const discipline = db.disciplines.find((d) => d.id === ev.disciplineId);

                return (
                  <div
                    key={ev.id}
                    className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => handleToggleComplete(ev.id, e)}
                        className="mt-0.5 text-[#919196] hover:text-emerald-400 transition cursor-pointer"
                      >
                        <CheckCircle2
                          className={`w-5 h-5 ${ev.isCompleted ? 'text-emerald-400' : 'text-[#38383C]'}`}
                        />
                      </button>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase"
                            style={{ backgroundColor: ev.color || '#2563EB' }}
                          >
                            {getEventTypeLabel(ev.type)}
                          </span>
                          <h4
                            className={`text-xs sm:text-sm font-semibold text-white ${
                              ev.isCompleted ? 'line-through text-[#636366]' : ''
                            }`}
                          >
                            {ev.title}
                          </h4>
                        </div>
                        {ev.description && (
                          <p className="text-xs text-[#919196]">{ev.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-[#919196]">
                          <span>📅 {ev.date}</span>
                          {ev.time && <span>⏰ {ev.time}</span>}
                          {ev.location && <span>📍 {ev.location}</span>}
                          {discipline && (
                            <span className="font-semibold" style={{ color: discipline.color }}>
                              {discipline.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => {
                          setEditingEvent(ev);
                          setEventModalOpen(true);
                        }}
                        className="p-2 text-[#919196] hover:text-white hover:bg-[#1C1C1F] rounded-xl transition cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteEvent(ev.id, e)}
                        className="p-2 text-[#919196] hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Event Modal */}
      {eventModalOpen && (
        <EventModal
          isOpen={eventModalOpen}
          onClose={() => {
            setEventModalOpen(false);
            setEditingEvent(null);
          }}
          activeSemesterId={currentSemesterId}
          eventToEdit={editingEvent || undefined}
        />
      )}
    </div>
  );
};
