import React, { useState } from 'react';
import { StorageService } from '../../lib/storage';
import { AcademicTask, TaskPriority, TaskStatus, Discipline } from '../../types';
import { TaskModal } from './TaskModal';
import {
  CheckSquare,
  Plus,
  Filter,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Flame,
  LayoutGrid,
  List,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const TasksView: React.FC = () => {
  const db = StorageService.getDatabase();
  const currentSemesterId = db.profile.activeSemesterId;

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterDisciplineId, setFilterDisciplineId] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AcademicTask | null>(null);

  // Quick inline task input
  const [quickTitle, setQuickTitle] = useState('');

  const disciplines = db.disciplines.filter((d) => d.semesterId === currentSemesterId);

  const filteredTasks = db.tasks.filter((t) => {
    if (t.semesterId !== currentSemesterId) return false;
    if (filterDisciplineId !== 'all' && t.disciplineId !== filterDisciplineId) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress');
  const doneTasks = filteredTasks.filter((t) => t.status === 'done');

  const handleToggleTaskStatus = (task: AcademicTask) => {
    const isNowDone = task.status !== 'done';
    StorageService.update((draft) => {
      const target = draft.tasks.find((item) => item.id === task.id);
      if (target) {
        target.status = isNowDone ? 'done' : 'todo';
      }
    });

    if (isNowDone) {
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
    }
  };

  const handleMoveStatus = (task: AcademicTask, newStatus: TaskStatus) => {
    StorageService.update((draft) => {
      const target = draft.tasks.find((item) => item.id === task.id);
      if (target) {
        target.status = newStatus;
      }
    });

    if (newStatus === 'done') {
      confetti({ particleCount: 30, spread: 45, origin: { y: 0.7 } });
    }
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Deseja excluir esta tarefa?')) {
      StorageService.update((draft) => {
        draft.tasks = draft.tasks.filter((item) => item.id !== taskId);
      });
    }
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const newTask: AcademicTask = {
      id: `task-${Date.now()}`,
      semesterId: currentSemesterId,
      title: quickTitle.trim(),
      date: new Date().toISOString().split('T')[0],
      priority: 'medium',
      status: 'todo',
      order: db.tasks.length + 1,
      createdAt: new Date().toISOString(),
    };

    StorageService.update((draft) => {
      draft.tasks.push(newTask);
    });

    setQuickTitle('');
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">Urgente</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Alta</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">Média</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#242427] text-[#919196] border border-[#242427]">Normal</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121214] p-5 rounded-2xl border border-[#242427]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#1C1C1F] border border-[#242427] text-blue-400">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Tarefas, Trabalhos & Prazos
            </h1>
            <p className="text-xs text-[#919196]">
              Organize seus estudos por prioridades, prazos de entrega e quadro Kanban
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-[#1C1C1F] p-1 rounded-xl border border-[#242427]">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-[#121214] text-white shadow-xs'
                  : 'text-[#919196] hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#121214] text-white shadow-xs'
                  : 'text-[#919196] hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setTaskModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Quick Add Bar & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quick Add Form */}
        <form
          onSubmit={handleQuickAdd}
          className="md:col-span-2 flex items-center gap-2 bg-[#121214] p-2.5 rounded-2xl border border-[#242427]"
        >
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Adicionar tarefa rápida (pressione Enter)..."
            className="flex-1 px-3 py-1.5 bg-transparent text-xs text-white placeholder-[#5A5A5E] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="px-3.5 py-1.5 bg-[#1C1C1F] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg border border-[#242427] hover:border-blue-500 transition cursor-pointer"
          >
            Adicionar
          </button>
        </form>

        {/* Filters */}
        <div className="flex items-center gap-2 bg-[#121214] p-2.5 rounded-2xl border border-[#242427] text-xs">
          <Filter className="w-4 h-4 text-[#919196]" />
          <select
            value={filterDisciplineId}
            onChange={(e) => setFilterDisciplineId(e.target.value)}
            className="flex-1 bg-transparent text-white font-medium focus:outline-none"
          >
            <option value="all" className="bg-[#1C1C1F] text-white">Todas as Matérias</option>
            {disciplines.map((d) => (
              <option key={d.id} value={d.id} className="bg-[#1C1C1F] text-white">
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column: To Do */}
          <div className="bg-[#121214] rounded-2xl border border-[#242427] p-4 space-y-3 flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#242427]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <h3 className="text-sm font-bold text-white">
                  A Fazer
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1C1C1F] border border-[#242427] text-[#919196]">
                {todoTasks.length}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto min-h-[250px]">
              {todoTasks.map((task) => renderTaskCard(task))}
            </div>
          </div>

          {/* Column: In Progress */}
          <div className="bg-[#121214] rounded-2xl border border-[#242427] p-4 space-y-3 flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#242427]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Em Andamento
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                {inProgressTasks.length}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto min-h-[250px]">
              {inProgressTasks.map((task) => renderTaskCard(task))}
            </div>
          </div>

          {/* Column: Done */}
          <div className="bg-[#121214] rounded-2xl border border-[#242427] p-4 space-y-3 flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#242427]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Concluído
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {doneTasks.length}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto min-h-[250px]">
              {doneTasks.map((task) => renderTaskCard(task))}
            </div>
          </div>
        </div>
      ) : (
        /* List Mode */
        <div className="bg-[#121214] p-6 rounded-2xl border border-[#242427] space-y-4">
          <div className="divide-y divide-[#242427] space-y-3">
            {filteredTasks.map((task) => {
              const discipline = db.disciplines.find((d) => d.id === task.disciplineId);

              return (
                <div
                  key={task.id}
                  className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTaskStatus(task)}
                      className="text-[#919196] hover:text-emerald-400 transition shrink-0 cursor-pointer"
                    >
                      {task.status === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-xs sm:text-sm font-bold text-white ${
                            task.status === 'done' ? 'line-through text-[#5A5A5E]' : ''
                          }`}
                        >
                          {task.title}
                        </h4>
                        {getPriorityBadge(task.priority)}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#919196] mt-0.5">
                        {discipline && (
                          <span className="font-bold" style={{ color: discipline.color }}>
                            ● {discipline.name}
                          </span>
                        )}
                        {task.deadline && <span>Prazo: {task.deadline}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setTaskModalOpen(true);
                      }}
                      className="p-2 text-[#919196] hover:text-white hover:bg-[#1C1C1F] rounded-lg transition cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteTask(task.id, e)}
                      className="p-2 text-[#919196] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
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

      {/* Task Modal */}
      {taskModalOpen && (
        <TaskModal
          isOpen={taskModalOpen}
          onClose={() => {
            setTaskModalOpen(false);
            setEditingTask(null);
          }}
          activeSemesterId={currentSemesterId}
          taskToEdit={editingTask || undefined}
        />
      )}
    </div>
  );

  function renderTaskCard(task: AcademicTask) {
    const discipline = db.disciplines.find((d) => d.id === task.disciplineId);

    return (
      <div
        key={task.id}
        className="p-3.5 rounded-xl border border-[#242427] bg-[#161618] hover:border-[#38383C] transition space-y-2 group"
      >
        <div className="flex items-center justify-between">
          {getPriorityBadge(task.priority)}

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
            <button
              onClick={() => {
                setEditingTask(task);
                setTaskModalOpen(true);
              }}
              className="p-1 text-[#919196] hover:text-white cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => handleDeleteTask(task.id, e)}
              className="p-1 text-[#919196] hover:text-red-400 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div>
          <h4
            className={`text-xs font-bold text-white ${
              task.status === 'done' ? 'line-through text-[#5A5A5E]' : ''
            }`}
          >
            {task.title}
          </h4>
          {task.description && (
            <p className="text-[11px] text-[#919196] mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#242427] text-[10px] text-[#919196]">
          {discipline ? (
            <span className="font-bold" style={{ color: discipline.color }}>
              ● {discipline.name}
            </span>
          ) : (
            <span>Geral</span>
          )}

          {task.deadline && (
            <span className="flex items-center gap-1 font-semibold text-red-400">
              <Clock className="w-3 h-3" /> {task.deadline}
            </span>
          )}
        </div>

        {/* Quick Status Changers in card */}
        <div className="flex items-center gap-1.5 pt-1">
          {task.status !== 'todo' && (
            <button
              onClick={() => handleMoveStatus(task, 'todo')}
              className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#1C1C1F] text-[#919196] hover:text-white border border-[#242427] cursor-pointer"
            >
              ← A Fazer
            </button>
          )}
          {task.status !== 'in_progress' && (
            <button
              onClick={() => handleMoveStatus(task, 'in_progress')}
              className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 cursor-pointer"
            >
              Em Andamento
            </button>
          )}
          {task.status !== 'done' && (
            <button
              onClick={() => handleMoveStatus(task, 'done')}
              className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 cursor-pointer"
            >
              ✓ Concluir
            </button>
          )}
        </div>
      </div>
    );
  }
};
