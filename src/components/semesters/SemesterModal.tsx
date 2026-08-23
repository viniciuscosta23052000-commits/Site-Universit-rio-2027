import React, { useState } from 'react';
import { Semester } from '../../types';
import { StorageService } from '../../lib/storage';
import { X, Calendar, BookOpen, GraduationCap, Copy, Check } from 'lucide-react';

interface SemesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  semesterToEdit?: Semester | null;
  onSaved?: (semester: Semester) => void;
}

export const SemesterModal: React.FC<SemesterModalProps> = ({
  isOpen,
  onClose,
  semesterToEdit,
  onSaved,
}) => {
  const db = StorageService.getDatabase();

  const [name, setName] = useState(semesterToEdit?.name || '2027/1 — 6º Período');
  const [periodNumber, setPeriodNumber] = useState(semesterToEdit?.periodNumber || 6);
  const [year, setYear] = useState(semesterToEdit?.year || 2027);
  const [course, setCourse] = useState(semesterToEdit?.course || db.profile.course || 'Medicina Veterinária');
  const [institution, setInstitution] = useState(semesterToEdit?.institution || db.profile.institution || 'UFU');
  const [startDate, setStartDate] = useState(semesterToEdit?.startDate || '2027-02-15');
  const [endDate, setEndDate] = useState(semesterToEdit?.endDate || '2027-07-10');
  const [observations, setObservations] = useState(semesterToEdit?.observations || '');
  const [copyFromPrevious, setCopyFromPrevious] = useState(false);
  const [sourceSemesterId, setSourceSemesterId] = useState(db.semesters[0]?.id || '');

  if (!isOpen) return null;

  const handleSave = () => {
    const semId = semesterToEdit ? semesterToEdit.id : `sem-${Date.now()}`;
    const newSemester: Semester = {
      id: semId,
      name,
      periodNumber: Number(periodNumber),
      year: Number(year),
      startDate,
      endDate,
      course,
      institution,
      isArchived: semesterToEdit?.isArchived || false,
      observations,
      createdAt: semesterToEdit?.createdAt || new Date().toISOString(),
    };

    StorageService.update((draft) => {
      if (semesterToEdit) {
        const index = draft.semesters.findIndex((s) => s.id === semesterToEdit.id);
        if (index !== -1) {
          draft.semesters[index] = newSemester;
        }
      } else {
        draft.semesters.push(newSemester);
        draft.profile.activeSemesterId = newSemester.id;

        // If user wants to copy structure from another semester
        if (copyFromPrevious && sourceSemesterId) {
          const sourceDisciplines = draft.disciplines.filter((d) => d.semesterId === sourceSemesterId);
          sourceDisciplines.forEach((srcDisc) => {
            const newDiscId = `disc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            draft.disciplines.push({
              ...srcDisc,
              id: newDiscId,
              semesterId: newSemester.id,
              scheduleSlots: srcDisc.scheduleSlots.map((slot) => ({ ...slot, id: `slot-${Math.random()}` })),
              createdAt: new Date().toISOString(),
            });

            // Copy notebooks
            const sourceNotebooks = draft.notebooks.filter((nb) => nb.disciplineId === srcDisc.id);
            sourceNotebooks.forEach((srcNb) => {
              const newNbId = `nb-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
              draft.notebooks.push({
                ...srcNb,
                id: newNbId,
                semesterId: newSemester.id,
                disciplineId: newDiscId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });

              // Copy chapters structure
              const sourceChapters = draft.chapters.filter((ch) => ch.notebookId === srcNb.id);
              sourceChapters.forEach((srcCh) => {
                draft.chapters.push({
                  ...srcCh,
                  id: `chap-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  notebookId: newNbId,
                  createdAt: new Date().toISOString(),
                });
              });
            });
          });
        }
      }
    });

    if (onSaved) onSaved(newSemester);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#121214] border border-[#242427] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-[#242427] bg-[#161618]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {semesterToEdit ? 'Editar Semestre' : 'Novo Semestre / Período'}
              </h2>
              <p className="text-xs text-[#919196]">
                Configure e personalize o período letivo
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
              Nome do Semestre / Identificação
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: 2026/2 — 5º Período"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-xs placeholder-[#636366] focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Número do Período
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={periodNumber}
                onChange={(e) => setPeriodNumber(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Ano
              </label>
              <input
                type="number"
                min="2000"
                max="2050"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Curso
              </label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="Ex: Medicina Veterinária"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-xs placeholder-[#636366] focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Instituição
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Ex: UFU, USP, Unicamp"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-xs placeholder-[#636366] focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Data de Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
                Data de Término
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-xs focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#919196] mb-1.5">
              Observações / Metas do Semestre
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: Foco em artigos de iniciação científica e notas altas nas matérias clínicas..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#242427] bg-[#1C1C1F] text-white text-xs placeholder-[#636366] focus:outline-none focus:border-blue-500"
            />
          </div>

          {!semesterToEdit && db.semesters.length > 0 && (
            <div className="p-3.5 rounded-xl border border-[#242427] bg-[#161618]">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-white">
                <input
                  type="checkbox"
                  checked={copyFromPrevious}
                  onChange={(e) => setCopyFromPrevious(e.target.checked)}
                  className="rounded border-[#242427] bg-[#1C1C1F] text-blue-600 focus:ring-0"
                />
                <span className="flex items-center gap-1.5 text-[#EDEDED]">
                  <Copy className="w-4 h-4 text-blue-400" />
                  Copiar estrutura do semestre anterior
                </span>
              </label>
              {copyFromPrevious && (
                <div className="mt-3 pl-6">
                  <p className="text-xs text-[#919196] mb-1.5">
                    Selecione o semestre de origem para duplicar cadernos e capítulos vazios:
                  </p>
                  <select
                    value={sourceSemesterId}
                    onChange={(e) => setSourceSemesterId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#242427] bg-[#1C1C1F] text-white text-xs focus:outline-none"
                  >
                    {db.semesters.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#1C1C1F] text-white">
                        {s.name} ({s.course})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
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
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {semesterToEdit ? 'Salvar Alterações' : 'Criar Semestre'}
          </button>
        </div>
      </div>
    </div>
  );
};
