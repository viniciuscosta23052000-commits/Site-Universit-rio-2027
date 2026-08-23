import React, { useState, useEffect } from 'react';
import { StorageService } from '../../lib/storage';
import { Discipline, DisciplineGrades, AbsenceLog } from '../../types';
import {
  GraduationCap,
  Award,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Save,
  BookOpen,
  Calendar,
  Layers,
  ChevronDown,
  Edit3,
  CalendarDays,
  Plus,
  Trash2,
  FileSpreadsheet,
  XCircle,
  Percent,
  Clock,
  Settings
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const BoletimView: React.FC = () => {
  const [db, setDb] = useState(() => StorageService.getDatabase());
  const [selectedSemesterId, setSelectedSemesterId] = useState(db.profile.activeSemesterId);
  const [activeTab, setActiveTab] = useState<'grades' | 'absences'>('grades');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);

  // Absence log input form states
  const [newAbsenceDate, setNewAbsenceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newAbsenceClasses, setNewAbsenceClasses] = useState(1);
  const [selectedDisciplineIdForAbsence, setSelectedDisciplineIdForAbsence] = useState<string>('');

  // Editing disciplines parameters states
  const [editingParamsId, setEditingParamsId] = useState<string | null>(null);
  const [tempWorkload, setTempWorkload] = useState<string>('');
  const [tempMaxAbsencePercent, setTempMaxAbsencePercent] = useState<string>('');
  const [tempClassDuration, setTempClassDuration] = useState<string>('');

  // Sync state with StorageService
  const refreshData = () => {
    setDb(StorageService.getDatabase());
  };

  const currentSemester = db.semesters.find((s) => s.id === selectedSemesterId);
  const disciplines = db.disciplines.filter((d) => d.semesterId === selectedSemesterId);

  // Set default selected discipline for absences
  useEffect(() => {
    if (disciplines.length > 0 && !selectedDisciplineIdForAbsence) {
      setSelectedDisciplineIdForAbsence(disciplines[0].id);
    }
  }, [disciplines, selectedDisciplineIdForAbsence]);

  // Temporary grades state during edit mode
  const [tempGrades, setTempGrades] = useState<Record<string, {
    prova: string;
    trabalhos: string;
    eds: string;
    seminarios: string;
    projetos: string;
  }>>({});

  // Initialize temporary state when entering editing mode
  const handleStartEdit = (discId: string, currentGrades?: DisciplineGrades) => {
    setEditingNotesId(discId);
    setTempGrades((prev) => ({
      ...prev,
      [discId]: {
        prova: currentGrades?.prova?.toString() || '0',
        trabalhos: currentGrades?.trabalhos?.toString() || '0',
        eds: currentGrades?.eds?.toString() || '0',
        seminarios: currentGrades?.seminarios?.toString() || '0',
        projetos: currentGrades?.projetos?.toString() || '0',
      }
    }));
  };

  // Handle value change
  const handleTempGradeChange = (discId: string, field: keyof DisciplineGrades, value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    setTempGrades((prev) => ({
      ...prev,
      [discId]: {
        ...prev[discId],
        [field]: sanitized,
      }
    }));
  };

  // Save Grades logic
  const handleSaveGrades = (discId: string) => {
    const gradesInput = tempGrades[discId];
    if (!gradesInput) return;

    const parsedGrades: DisciplineGrades = {
      prova: Math.min(100, Math.max(0, parseFloat(gradesInput.prova) || 0)),
      trabalhos: Math.min(100, Math.max(0, parseFloat(gradesInput.trabalhos) || 0)),
      eds: Math.min(100, Math.max(0, parseFloat(gradesInput.eds) || 0)),
      seminarios: Math.min(100, Math.max(0, parseFloat(gradesInput.seminarios) || 0)),
      projetos: Math.min(100, Math.max(0, parseFloat(gradesInput.projetos) || 0)),
    };

    const previousTotal = calculateTotal(db.disciplines.find(d => d.id === discId)?.grades);
    const newTotal = calculateTotal(parsedGrades);

    StorageService.update((draft) => {
      const index = draft.disciplines.findIndex((d) => d.id === discId);
      if (index !== -1) {
        draft.disciplines[index].grades = parsedGrades;
      }
    });

    if (previousTotal < 60 && newTotal >= 60) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#6EE7B7']
      });
    }

    setEditingNotesId(null);
    refreshData();
  };

  // Helpers to calculate sums
  const calculateTotal = (grades?: DisciplineGrades): number => {
    if (!grades) return 0;
    return (
      (grades.prova || 0) +
      (grades.trabalhos || 0) +
      (grades.eds || 0) +
      (grades.seminarios || 0) +
      (grades.projetos || 0)
    );
  };

  // ABSENCES ACTIONS LOGIC
  const handleAddAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisciplineIdForAbsence) return;

    const disc = disciplines.find(d => d.id === selectedDisciplineIdForAbsence);
    if (!disc) return;

    const classDuration = disc.classDurationHours || 2;
    const hours = newAbsenceClasses * classDuration;

    StorageService.update((draft) => {
      const idx = draft.disciplines.findIndex(d => d.id === selectedDisciplineIdForAbsence);
      if (idx !== -1) {
        const d = draft.disciplines[idx];
        if (!d.absences) d.absences = [];
        
        d.absences.push({
          id: 'abs-' + Date.now(),
          date: newAbsenceDate,
          classesCount: newAbsenceClasses,
          hoursCount: hours
        });
      }
    });

    refreshData();
    setNewAbsenceClasses(1);
    
    // Tiny feedback confetti for interaction
    confetti({
      particleCount: 20,
      spread: 30,
      colors: ['#EF4444', '#F59E0B']
    });
  };

  const handleRemoveAbsence = (discId: string, absenceId: string) => {
    if (!window.confirm('Deseja realmente remover esta falta?')) return;

    StorageService.update((draft) => {
      const idx = draft.disciplines.findIndex(d => d.id === discId);
      if (idx !== -1) {
        const d = draft.disciplines[idx];
        if (d.absences) {
          d.absences = d.absences.filter(a => a.id !== absenceId);
        }
      }
    });

    refreshData();
  };

  // Edit discipline absence workload and limit percentages
  const handleStartEditingParams = (disc: Discipline) => {
    setEditingParamsId(disc.id);
    setTempWorkload((disc.workloadHours || 60).toString());
    setTempMaxAbsencePercent((disc.maxAbsenceLimitPercent || 25).toString());
    setTempClassDuration((disc.classDurationHours || 2).toString());
  };

  const handleSaveParams = (discId: string) => {
    const wl = Math.max(1, parseInt(tempWorkload) || 60);
    const limit = Math.min(100, Math.max(1, parseInt(tempMaxAbsencePercent) || 25));
    const dur = Math.max(0.5, parseFloat(tempClassDuration) || 2);

    StorageService.update((draft) => {
      const idx = draft.disciplines.findIndex(d => d.id === discId);
      if (idx !== -1) {
        draft.disciplines[idx].workloadHours = wl;
        draft.disciplines[idx].maxAbsenceLimitPercent = limit;
        draft.disciplines[idx].classDurationHours = dur;
        
        // Re-calculate existing absences hour counts with new class duration if any
        if (draft.disciplines[idx].absences) {
          draft.disciplines[idx].absences = draft.disciplines[idx].absences!.map(a => ({
            ...a,
            hoursCount: a.classesCount * dur
          }));
        }
      }
    });

    setEditingParamsId(null);
    refreshData();
  };

  // Stats for the chosen semester
  const approvedCount = disciplines.filter((d) => calculateTotal(d.grades) >= 60).length;
  const pendingCount = disciplines.length - approvedCount;
  
  const overallSemesterAverage = disciplines.length > 0 
    ? (disciplines.reduce((acc, curr) => acc + calculateTotal(curr.grades), 0) / disciplines.length).toFixed(1)
    : '0.0';

  // Calculations for absences
  const getTotalAbsencesSemester = () => {
    let classes = 0;
    let hours = 0;
    disciplines.forEach(d => {
      if (d.absences) {
        d.absences.forEach(a => {
          classes += a.classesCount;
          hours += a.hoursCount;
        });
      }
    });
    return { classes, hours };
  };

  const { classes: totalClassesMissed, hours: totalHoursMissed } = getTotalAbsencesSemester();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#121214] p-6 rounded-2xl border border-[#242427] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Boletim e Controle Acadêmico
            </h1>
            <p className="text-xs text-[#919196] mt-0.5">
              Monitore suas notas, frequências de aulas e limite de faltas no semestre.
            </p>
          </div>
        </div>

        {/* Semester select */}
        <div className="flex items-center gap-2 bg-[#1C1C1F] px-3 py-1.5 rounded-xl border border-[#242427]">
          <span className="text-xs text-[#919196] font-medium">Semestre:</span>
          <select
            value={selectedSemesterId}
            onChange={(e) => setSelectedSemesterId(e.target.value)}
            className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
          >
            {db.semesters.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#1C1C1F] text-white text-xs">
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-[#121214] p-1 rounded-xl border border-[#242427] w-fit">
        <button
          onClick={() => setActiveTab('grades')}
          className={`px-4.5 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'grades'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-[#919196] hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          Notas e Avaliações
        </button>
        <button
          onClick={() => setActiveTab('absences')}
          className={`px-4.5 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'absences'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-[#919196] hover:text-white'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Faltas e Presença
        </button>
      </div>

      {/* STATS ACCORDING TO THE ACTIVE TAB */}
      {activeTab === 'grades' ? (
        /* GRADES SUMMARY CARDS */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#121214] border border-[#242427] p-4.5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#919196] font-bold uppercase tracking-wider block">Disciplinas Aprovadas</span>
              <span className="text-2xl font-mono font-bold text-white mt-0.5 block">{approvedCount}</span>
            </div>
          </div>

          <div className="bg-[#121214] border border-[#242427] p-4.5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#919196] font-bold uppercase tracking-wider block">Em Andamento</span>
              <span className="text-2xl font-mono font-bold text-white mt-0.5 block">{pendingCount}</span>
            </div>
          </div>

          <div className="bg-[#121214] border border-[#242427] p-4.5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#919196] font-bold uppercase tracking-wider block">Média Geral</span>
              <span className="text-2xl font-mono font-bold text-white mt-0.5 block">{overallSemesterAverage} / 100</span>
            </div>
          </div>
        </div>
      ) : (
        /* ABSENCES SUMMARY CARDS */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#121214] border border-[#242427] p-4.5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#919196] font-bold uppercase tracking-wider block">Total Aulas Perdidas</span>
              <span className="text-2xl font-mono font-bold text-white mt-0.5 block">{totalClassesMissed}</span>
            </div>
          </div>

          <div className="bg-[#121214] border border-[#242427] p-4.5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#919196] font-bold uppercase tracking-wider block">Total Horas de Falta</span>
              <span className="text-2xl font-mono font-bold text-white mt-0.5 block">{totalHoursMissed} hrs</span>
            </div>
          </div>

          <div className="bg-[#121214] border border-[#242427] p-4.5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#919196] font-bold uppercase tracking-wider block">Frequência Exigida</span>
              <span className="text-2xl font-mono font-bold text-white mt-0.5 block">Mínimo 75%</span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEW CONTENTS */}
      {activeTab === 'grades' ? (
        /* GRADES TAB SECTION */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {disciplines.length === 0 ? (
            <div className="lg:col-span-2 text-center py-16 bg-[#121214] border border-[#242427] rounded-2xl text-sm text-[#919196] italic">
              Nenhuma disciplina cadastrada neste semestre. Adicione-as na Grade Horária! 📅
            </div>
          ) : (
            disciplines.map((disc) => {
              const isEditing = editingNotesId === disc.id;
              const grades = disc.grades || { prova: 0, trabalhos: 0, eds: 0, seminarios: 0, projetos: 0 };
              const total = isEditing 
                ? (
                    (parseFloat(tempGrades[disc.id]?.prova) || 0) +
                    (parseFloat(tempGrades[disc.id]?.trabalhos) || 0) +
                    (parseFloat(tempGrades[disc.id]?.eds) || 0) +
                    (parseFloat(tempGrades[disc.id]?.seminarios) || 0) +
                    (parseFloat(tempGrades[disc.id]?.projetos) || 0)
                  )
                : calculateTotal(disc.grades);
              const isApproved = total >= 60;

              return (
                <div
                  key={disc.id}
                  className="bg-[#121214] border border-[#242427] rounded-2xl p-5 space-y-4 relative overflow-hidden flex flex-col justify-between"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: disc.color }}
                  />

                  <div className="flex justify-between items-start pt-2">
                    <div className="space-y-1">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider"
                        style={{ backgroundColor: disc.color }}
                      >
                        {disc.code || 'Matéria'}
                      </span>
                      <h2 className="text-base font-bold text-white mt-1">{disc.name}</h2>
                      {disc.professor && (
                        <p className="text-[11px] text-[#919196]">Prof. {disc.professor}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-[#919196] font-semibold">Pontuação Total</div>
                      <div className="text-2xl font-mono font-extrabold text-white mt-0.5">
                        {total.toFixed(1)} <span className="text-xs text-[#636366]">/100</span>
                      </div>
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full mt-1.5 border ${
                          isApproved
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}
                      >
                        {isApproved ? 'Aprovado 🎉' : 'Abaixo da Média'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#1C1C1F] p-4 rounded-xl border border-[#242427]/50 space-y-3.5">
                    <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold text-[#919196] uppercase tracking-wider pb-1.5 border-b border-[#242427]">
                      <div>Prova</div>
                      <div>Trabalho</div>
                      <div>EDs</div>
                      <div>Seminário</div>
                      <div>Projeto</div>
                    </div>

                    {isEditing ? (
                      <div className="grid grid-cols-5 gap-2">
                        <div>
                          <input
                            type="text"
                            value={tempGrades[disc.id]?.prova}
                            onChange={(e) => handleTempGradeChange(disc.id, 'prova', e.target.value)}
                            className="w-full bg-[#121214] border border-[#242427] text-white text-xs font-mono font-bold text-center p-1.5 rounded-lg focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-[9px] text-[#636366] mt-1 block">Max: 100</span>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={tempGrades[disc.id]?.trabalhos}
                            onChange={(e) => handleTempGradeChange(disc.id, 'trabalhos', e.target.value)}
                            className="w-full bg-[#121214] border border-[#242427] text-white text-xs font-mono font-bold text-center p-1.5 rounded-lg focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-[9px] text-[#636366] mt-1 block">Max: 100</span>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={tempGrades[disc.id]?.eds}
                            onChange={(e) => handleTempGradeChange(disc.id, 'eds', e.target.value)}
                            className="w-full bg-[#121214] border border-[#242427] text-white text-xs font-mono font-bold text-center p-1.5 rounded-lg focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-[9px] text-[#636366] mt-1 block">Max: 100</span>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={tempGrades[disc.id]?.seminarios}
                            onChange={(e) => handleTempGradeChange(disc.id, 'seminarios', e.target.value)}
                            className="w-full bg-[#121214] border border-[#242427] text-white text-xs font-mono font-bold text-center p-1.5 rounded-lg focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-[9px] text-[#636366] mt-1 block">Max: 100</span>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={tempGrades[disc.id]?.projetos}
                            onChange={(e) => handleTempGradeChange(disc.id, 'projetos', e.target.value)}
                            className="w-full bg-[#121214] border border-[#242427] text-white text-xs font-mono font-bold text-center p-1.5 rounded-lg focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-[9px] text-[#636366] mt-1 block">Max: 100</span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 gap-2 text-center font-mono font-bold text-sm text-white">
                        <div className="p-1 bg-[#121214] border border-[#242427] rounded-lg">
                          {grades.prova !== undefined ? grades.prova.toFixed(1) : '-'}
                        </div>
                        <div className="p-1 bg-[#121214] border border-[#242427] rounded-lg">
                          {grades.trabalhos !== undefined ? grades.trabalhos.toFixed(1) : '-'}
                        </div>
                        <div className="p-1 bg-[#121214] border border-[#242427] rounded-lg">
                          {grades.eds !== undefined ? grades.eds.toFixed(1) : '-'}
                        </div>
                        <div className="p-1 bg-[#121214] border border-[#242427] rounded-lg">
                          {grades.seminarios !== undefined ? grades.seminarios.toFixed(1) : '-'}
                        </div>
                        <div className="p-1 bg-[#121214] border border-[#242427] rounded-lg">
                          {grades.projetos !== undefined ? grades.projetos.toFixed(1) : '-'}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-[#919196] font-medium">
                      <span>Progresso para Aprovação</span>
                      <span className="font-bold">{Math.min(100, Math.round((total / 60) * 100))}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#1C1C1F] rounded-full overflow-hidden border border-[#242427]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (total / 100) * 100)}%`,
                          backgroundColor: isApproved ? '#10B981' : disc.color,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-[#636366]">
                      <span>0 pts</span>
                      <span className="text-emerald-500 font-bold border-r border-emerald-500/30 pr-1.5">Média: 60 pts</span>
                      <span>100 pts</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1.5 border-t border-[#242427]/30 mt-1">
                    {isEditing ? (
                      <button
                        onClick={() => handleSaveGrades(disc.id)}
                        className="flex items-center gap-1.5 px-4.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-md"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Salvar Notas
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(disc.id, disc.grades)}
                        className="flex items-center gap-1.5 px-4.5 py-2 bg-[#1C1C1F] hover:bg-[#242427] border border-[#242427] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#919196]" />
                        Lançar Notas
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ABSENCES (FALTAS) TAB SECTION */
        <div className="space-y-6">
          {/* Quick logger action card */}
          {disciplines.length > 0 && (
            <form onSubmit={handleAddAbsence} className="bg-[#121214] border border-[#242427] p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Registrar Falta Rápida nas Aulas
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#919196]">Disciplina</label>
                  <select
                    value={selectedDisciplineIdForAbsence}
                    onChange={(e) => setSelectedDisciplineIdForAbsence(e.target.value)}
                    className="w-full bg-[#1C1C1F] border border-[#242427] p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {disciplines.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#919196]">Data da Falta</label>
                  <input
                    type="date"
                    value={newAbsenceDate}
                    onChange={(e) => setNewAbsenceDate(e.target.value)}
                    className="w-full bg-[#1C1C1F] border border-[#242427] p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#919196]">Quantidade de Aulas Faltadas</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newAbsenceClasses}
                      onChange={(e) => setNewAbsenceClasses(parseInt(e.target.value) || 1)}
                      className="w-20 bg-[#1C1C1F] border border-[#242427] p-2.5 rounded-xl text-xs text-white font-mono font-bold text-center focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Registrar Falta
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* LIST OF DISCIPLINES WITH DETAILED ABSENCE CALCULATION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {disciplines.length === 0 ? (
              <div className="lg:col-span-2 text-center py-16 bg-[#121214] border border-[#242427] rounded-2xl text-sm text-[#919196] italic">
                Nenhuma disciplina cadastrada para calcular faltas. Adicione-as na Grade Horária! 📅
              </div>
            ) : (
              disciplines.map((disc) => {
                const totalHours = disc.workloadHours || 60;
                const maxAbsencePercent = disc.maxAbsenceLimitPercent !== undefined ? disc.maxAbsenceLimitPercent : 25; 
                const classDuration = disc.classDurationHours || 2;

                // Max absence hours allowed
                const maxAbsenceHoursAllowed = (totalHours * (maxAbsencePercent / 100));

                // Calculate missed items
                let classesMissed = 0;
                let hoursMissed = 0;
                if (disc.absences) {
                  disc.absences.forEach(a => {
                    classesMissed += a.classesCount;
                    hoursMissed += a.hoursCount;
                  });
                }

                // Current absence percentage relative to discipline total hours
                const currentAbsenceRate = (hoursMissed / totalHours) * 100;
                // Current attendance percentage (e.g. 100% - absence rate)
                const currentAttendanceRate = 100 - currentAbsenceRate;

                // Check fail condition (if attendance drops below 100 - maxAbsencePercent, which defaults to 75%!)
                const attendanceThreshold = 100 - maxAbsencePercent; // by default 75%
                const isFailedByAbsence = currentAttendanceRate < attendanceThreshold;
                const isNearLimit = !isFailedByAbsence && currentAttendanceRate < (attendanceThreshold + 10);

                const isEditingParams = editingParamsId === disc.id;

                return (
                  <div
                    key={disc.id}
                    className="bg-[#121214] border border-[#242427] rounded-2xl p-5 space-y-4 relative overflow-hidden flex flex-col justify-between"
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: disc.color }}
                    />

                    {/* Subject info */}
                    <div className="flex justify-between items-start pt-2">
                      <div className="space-y-1">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider"
                          style={{ backgroundColor: disc.color }}
                        >
                          {disc.code || 'Código'}
                        </span>
                        <h2 className="text-base font-bold text-white mt-1">{disc.name}</h2>
                        <p className="text-[10px] text-[#919196]">
                          Carga Horária: <span className="text-white font-mono font-bold">{totalHours}h</span> | 
                          Aula: <span className="text-white font-mono font-bold">{classDuration}h</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <button
                          onClick={() => handleStartEditingParams(disc)}
                          className="p-1.5 bg-[#1C1C1F] hover:bg-[#242427] border border-[#242427] rounded-xl text-[#919196] hover:text-white transition cursor-pointer"
                          title="Editar parâmetros de carga horária e limites"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* EDITABLE PARAMETERS ROW */}
                    {isEditingParams && (
                      <div className="p-3.5 bg-[#1C1C1F] rounded-xl border border-blue-500/20 space-y-3">
                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                          Configurar Carga Horária e Limites
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <span className="text-[9px] text-[#919196] font-semibold">Total Carga (Hrs)</span>
                            <input
                              type="number"
                              value={tempWorkload}
                              onChange={(e) => setTempWorkload(e.target.value)}
                              className="w-full bg-[#121214] border border-[#242427] text-white font-mono text-xs p-1.5 rounded-lg focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] text-[#919196] font-semibold">Duração Aula (Hrs)</span>
                            <input
                              type="number"
                              step="0.5"
                              value={tempClassDuration}
                              onChange={(e) => setTempClassDuration(e.target.value)}
                              className="w-full bg-[#121214] border border-[#242427] text-white font-mono text-xs p-1.5 rounded-lg focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] text-[#919196] font-semibold">Limite Faltas (%)</span>
                            <input
                              type="number"
                              value={tempMaxAbsencePercent}
                              onChange={(e) => setTempMaxAbsencePercent(e.target.value)}
                              className="w-full bg-[#121214] border border-[#242427] text-white font-mono text-xs p-1.5 rounded-lg focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingParamsId(null)}
                            className="px-3 py-1 bg-transparent hover:bg-[#242427] text-[#919196] text-[10px] font-bold rounded-lg transition"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveParams(disc.id)}
                            className="px-3.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CALCULATED RESULTS */}
                    <div className="grid grid-cols-3 gap-2 bg-[#1C1C1F] p-3 rounded-xl border border-[#242427]/40 text-center font-mono">
                      <div>
                        <span className="text-[9px] text-[#919196] block font-sans font-bold uppercase tracking-wider">Aulas Perdidas</span>
                        <span className="text-base font-extrabold text-white mt-1 block">{classesMissed}</span>
                        <span className="text-[8px] text-[#636366] block">aulas totais</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#919196] block font-sans font-bold uppercase tracking-wider">Horas de Falta</span>
                        <span className="text-base font-extrabold text-white mt-1 block">{hoursMissed}h</span>
                        <span className="text-[8px] text-[#636366] block">acumuladas</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#919196] block font-sans font-bold uppercase tracking-wider">Faltas Máximas</span>
                        <span className="text-base font-extrabold text-[#EF4444] mt-1 block">{maxAbsenceHoursAllowed.toFixed(0)}h</span>
                        <span className="text-[8px] text-[#636366] block">limite ({maxAbsencePercent}%)</span>
                      </div>
                    </div>

                    {/* FREQUENCY AND ABSENCE GAUGE BAR */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-[#919196] font-medium">
                        <span className="flex items-center gap-1">
                          Frequência Atual: 
                          <span className={`font-bold ${isFailedByAbsence ? 'text-red-400' : 'text-emerald-400'}`}>
                            {currentAttendanceRate.toFixed(1)}%
                          </span>
                        </span>
                        <span>Mínimo Exigido: {attendanceThreshold}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#1C1C1F] rounded-full overflow-hidden border border-[#242427]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(0, Math.min(100, currentAttendanceRate))}%`,
                            backgroundColor: isFailedByAbsence ? '#EF4444' : (isNearLimit ? '#F59E0B' : '#10B981'),
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        {/* Final Status Alarm Indicator */}
                        {isFailedByAbsence ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-red-500">
                            <XCircle className="w-3.5 h-3.5" />
                            REPROVADO POR FALTAS ❌
                          </span>
                        ) : isNearLimit ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-500">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Atenção ao Limite! ⚠️
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-500">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Frequência Regular ✅
                          </span>
                        )}
                        <span className="text-[9px] text-[#636366]">
                          {hoursMissed} / {maxAbsenceHoursAllowed.toFixed(0)} horas consumidas
                        </span>
                      </div>
                    </div>

                    {/* INDIVIDUAL ABSENCE LOGS TIMELINE */}
                    <div className="pt-2 border-t border-[#242427]/30 space-y-2">
                      <div className="text-[10px] font-bold text-[#919196] uppercase tracking-wider">Histórico de Ausências</div>
                      {(!disc.absences || disc.absences.length === 0) ? (
                        <div className="text-[10px] text-[#52525B] italic py-1">Nenhuma ausência registrada nesta disciplina. Parabéns! 🌟</div>
                      ) : (
                        <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 text-xs">
                          {disc.absences.map((a) => (
                            <div key={a.id} className="flex justify-between items-center bg-[#1C1C1F] p-1.5 px-2.5 rounded-lg border border-[#242427]/50">
                              <span className="font-mono text-[10px] text-white">
                                📅 {a.date.split('-').reverse().join('/')} — <span className="font-sans font-bold text-red-400">{a.classesCount} aulas</span> ({a.hoursCount}h)
                              </span>
                              <button
                                onClick={() => handleRemoveAbsence(disc.id, a.id)}
                                className="text-[#919196] hover:text-[#EF4444] transition p-1 rounded hover:bg-[#242427] cursor-pointer"
                                title="Excluir falta"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
