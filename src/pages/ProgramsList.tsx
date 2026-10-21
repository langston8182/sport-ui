import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, CreditCard as Edit, Trash2, Search, CalendarDays, Download, Copy } from 'lucide-react';
import { programsService } from '../services/programs';
import { sessionsService } from '../services/sessions';
import { exercisesService } from '../services/exercises';
import { Exercise, Program, Session, SessionItem } from '../types';
import { Loader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';

type ExportFormat = 'txt' | 'csv' | 'md';
type SessionMap = Record<string, Session>;
type ExerciseMap = Record<string, Exercise>;
type LocationCategory = 'all' | 'home' | 'work' | 'gym';

const env = import.meta.env as Record<string, string | undefined>;

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = env[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return undefined;
}

const HOME_PREFIX = (readEnv('VITE_HOME_PROGRAM_PREFIX', 'EXPO_PUBLIC_HOME_PROGRAM_PREFIX') || 'Maison')
    .trim()
    .toLowerCase();
const WORK_PREFIX = (readEnv('VITE_WORK_PROGRAM_PREFIX', 'EXPO_PUBLIC_WORK_PROGRAM_PREFIX') || 'Travail')
    .trim()
    .toLowerCase();

function isHomeProgram(program: Program): boolean {
  return program.name.trim().toLowerCase().startsWith(HOME_PREFIX);
}

function isWorkProgram(program: Program): boolean {
  return program.name.trim().toLowerCase().startsWith(WORK_PREFIX);
}

function getProgramCategory(program: Program): Exclude<LocationCategory, 'all'> {
  if (isHomeProgram(program)) return 'home';
  if (isWorkProgram(program)) return 'work';
  return 'gym';
}

const categoryFilterOptions: Array<{ value: LocationCategory; label: string; icon: string }> = [
  { value: 'all', label: 'Tous', icon: '📋' },
  { value: 'home', label: 'Maison', icon: '🏠' },
  { value: 'work', label: 'Travail', icon: '🏢' },
  { value: 'gym', label: 'Salle de sport', icon: '🏋️' },
];

const exportFormatOptions: Array<{ value: ExportFormat; label: string }> = [
  { value: 'txt', label: 'Texte' },
  { value: 'csv', label: 'CSV' },
  { value: 'md', label: 'Markdown' },
];

function getSortedSessionItems(session: Session): SessionItem[] {
  return [...session.items].sort((a, b) => a.order - b.order);
}

function getExerciseDetails(item: SessionItem, exercises: ExerciseMap, index: number): string[] {
  const exercise = exercises[item.exerciseId];
  const lines = [
    `${index + 1}. ${exercise?.name || 'Exercice inconnu'}`,
    `   - Series: ${item.sets || '-'}`,
    `   - Repetitions: ${item.reps || '-'}`,
    `   - Duree: ${item.durationSec ? `${item.durationSec} sec` : '-'}`,
    `   - Repos: ${item.restSec} sec`,
  ];

  if (item.notes) {
    lines.push(`   - Notes: ${item.notes}`);
  }

  return lines;
}

function formatScheduleText(program: Program, sessions: SessionMap, exercises: ExerciseMap): string {
  if (program.schedule.length === 0) return 'Aucune session planifiee';

  return [...program.schedule]
      .sort((a, b) => a.week - b.week || a.slot - b.slot)
      .map((entry) => {
        const session = sessions[entry.sessionId];

        if (!session) {
          return `Semaine ${entry.week} - seance ${entry.slot}\n  Session inconnue`;
        }

        const exercisesText = getSortedSessionItems(session)
            .flatMap((item, index) => getExerciseDetails(item, exercises, index))
            .map((line) => `  ${line}`)
            .join('\n');

        return [
          `Semaine ${entry.week} - seance ${entry.slot}`,
          `  Session: ${session.name}`,
          exercisesText || '  Aucun exercice',
        ].join('\n');
      })
      .join('\n\n');
}

function formatScheduleMarkdown(program: Program, sessions: SessionMap, exercises: ExerciseMap): string {
  if (program.schedule.length === 0) return '_Aucune session planifiee_';

  return [...program.schedule]
      .sort((a, b) => a.week - b.week || a.slot - b.slot)
      .map((entry) => {
        const session = sessions[entry.sessionId];

        if (!session) {
          return `### Semaine ${entry.week} - seance ${entry.slot}\n\nSession inconnue`;
        }

        const exercisesText = getSortedSessionItems(session)
            .flatMap((item, index) => getExerciseDetails(item, exercises, index))
            .join('\n');

        return [
          `### Semaine ${entry.week} - seance ${entry.slot}`,
          `**Session:** ${session.name}`,
          exercisesText || '_Aucun exercice_',
        ].join('\n\n');
      })
      .join('\n\n');
}

function escapeCsvValue(value: string | number): string {
  const text = String(value);

  if (!/[",\n]/.test(text)) return text;

  return `"${text.replace(/"/g, '""')}"`;
}

function buildProgramsText(programs: Program[], sessions: SessionMap, exercises: ExerciseMap): string {
  return programs
      .map((program) => [
        `PROGRAMME: ${program.name}`,
        `Objectif: ${program.goal || '-'}`,
        `Duree: ${program.weeks} ${program.weeks === 1 ? 'semaine' : 'semaines'}`,
        `Frequence: ${program.sessionsPerWeek} seance${program.sessionsPerWeek > 1 ? 's' : ''} par semaine`,
        '',
        'Planning:',
        formatScheduleText(program, sessions, exercises),
      ].join('\n'))
      .join('\n\n---\n\n');
}

function buildProgramsMarkdown(programs: Program[], sessions: SessionMap, exercises: ExerciseMap): string {
  return programs
      .map((program) => [
        `# ${program.name}`,
        `- **Objectif:** ${program.goal || '-'}`,
        `- **Duree:** ${program.weeks} ${program.weeks === 1 ? 'semaine' : 'semaines'}`,
        `- **Frequence:** ${program.sessionsPerWeek} seance${program.sessionsPerWeek > 1 ? 's' : ''} par semaine`,
        '',
        '## Planning',
        formatScheduleMarkdown(program, sessions, exercises),
      ].join('\n'))
      .join('\n\n---\n\n');
}

function buildProgramsCsv(programs: Program[], sessions: SessionMap, exercises: ExerciseMap): string {
  const rows = [
    ['Programme', 'Objectif', 'Semaines', 'Seances par semaine', 'Semaine', 'Seance', 'Session', 'Ordre exercice', 'Exercice', 'Series', 'Repetitions', 'Duree sec', 'Repos sec', 'Notes'],
    ...programs.flatMap((program) => {
      if (program.schedule.length === 0) {
        return [[program.name, program.goal || '', program.weeks, program.sessionsPerWeek, '', '', 'Aucune session planifiee', '', '', '', '', '', '', '']];
      }

      return [...program.schedule]
          .sort((a, b) => a.week - b.week || a.slot - b.slot)
          .flatMap((entry) => {
            const session = sessions[entry.sessionId];
            const baseRow = [program.name, program.goal || '', program.weeks, program.sessionsPerWeek, entry.week, entry.slot, session?.name || 'Session inconnue'];

            if (!session || session.items.length === 0) {
              return [[...baseRow, '', 'Aucun exercice', '', '', '', '', '']];
            }

            return getSortedSessionItems(session).map((item, index) => {
              const exercise = exercises[item.exerciseId];

              return [
                ...baseRow,
                index + 1,
                exercise?.name || 'Exercice inconnu',
                item.sets || '',
                item.reps || '',
                item.durationSec || '',
                item.restSec,
                item.notes || '',
              ];
            });
          });
    }),
  ];

  return rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ProgramsList() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<LocationCategory>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('txt');
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchPrograms = useCallback(async () => {
    try {
      const data = await programsService.getAll();
      setPrograms(Array.isArray(data) ? data : []);
    } catch {
      showToast('Failed to load programs', 'error');
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  useEffect(() => {
    let next = programs;

    if (categoryFilter !== 'all') {
      next = next.filter((program) => getProgramCategory(program) === categoryFilter);
    }

    if (searchTerm) {
      next = next.filter((program) =>
          program.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPrograms(next);
  }, [programs, searchTerm, categoryFilter]);

  useEffect(() => {
    setSelectedProgramIds((prev) => prev.filter((id) => programs.some((program) => program.id === id)));
  }, [programs]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await programsService.delete(deleteId);
      setPrograms((prev) => prev.filter((p) => p.id !== deleteId));
      showToast('Program deleted successfully', 'success');
    } catch {
      showToast('Failed to delete program', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const handleDuplicate = async (program: Program) => {
    setDuplicatingId(program.id);
    try {
      const duplicatedProgram = await programsService.create({
        name: `${program.name} (copy)`,
        goal: program.goal,
        weeks: program.weeks,
        sessionsPerWeek: program.sessionsPerWeek,
      });

      for (const entry of [...program.schedule].sort((a, b) => a.week - b.week || a.slot - b.slot)) {
        await programsService.addScheduleEntry(duplicatedProgram.id, {
          week: entry.week,
          slot: entry.slot,
          sessionId: entry.sessionId,
        });
      }

      const fullDuplicatedProgram = await programsService.getById(duplicatedProgram.id);

      setPrograms((prev) => [fullDuplicatedProgram, ...prev]);
      showToast('Program duplicated successfully', 'success');
    } catch {
      showToast('Failed to duplicate program', 'error');
    } finally {
      setDuplicatingId(null);
    }
  };

  const toggleProgramSelection = (programId: string) => {
    setSelectedProgramIds((prev) =>
        prev.includes(programId)
            ? prev.filter((id) => id !== programId)
            : [...prev, programId]
    );
  };

  const toggleFilteredSelection = () => {
    const filteredIds = filteredPrograms.map((program) => program.id);
    const allFilteredSelected = filteredIds.every((id) => selectedProgramIds.includes(id));

    setSelectedProgramIds((prev) => {
      if (allFilteredSelected) {
        return prev.filter((id) => !filteredIds.includes(id));
      }

      return Array.from(new Set([...prev, ...filteredIds]));
    });
  };

  const handleExport = async () => {
    const selectedPrograms = programs.filter((program) => selectedProgramIds.includes(program.id));

    if (selectedPrograms.length === 0) {
      showToast('Select at least one program to export', 'error');
      return;
    }

    setExporting(true);

    try {
      const [sessions, exercises] = await Promise.all([
        sessionsService.getAll(),
        exercisesService.getAll(),
      ]);
      const sessionMap = sessions.reduce((acc, session) => {
        acc[session.id] = session;
        return acc;
      }, {} as SessionMap);
      const exerciseMap = exercises.reduce((acc, exercise) => {
        acc[exercise.id] = exercise;
        return acc;
      }, {} as ExerciseMap);
      const timestamp = new Date().toISOString().slice(0, 10);
      const contentByFormat: Record<ExportFormat, string> = {
        txt: buildProgramsText(selectedPrograms, sessionMap, exerciseMap),
        csv: buildProgramsCsv(selectedPrograms, sessionMap, exerciseMap),
        md: buildProgramsMarkdown(selectedPrograms, sessionMap, exerciseMap),
      };
      const mimeTypeByFormat: Record<ExportFormat, string> = {
        txt: 'text/plain;charset=utf-8',
        csv: 'text/csv;charset=utf-8',
        md: 'text/markdown;charset=utf-8',
      };

      downloadFile(contentByFormat[exportFormat], `programmes-${timestamp}.${exportFormat}`, mimeTypeByFormat[exportFormat]);
      showToast(`${selectedPrograms.length} program${selectedPrograms.length > 1 ? 's' : ''} exported`, 'success');
    } catch {
      showToast('Failed to export programs', 'error');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">Programs</h1>
            <p className="text-gray-600 text-lg">{programs.length} total programs</p>
          </div>
          <Link
              to="/programs/new"
              className="btn-primary inline-flex w-full sm:w-auto justify-center items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau programme</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible mb-3" role="group" aria-label="Filtrer par lieu">
            {categoryFilterOptions.map((option) => {
              const count = option.value === 'all'
                  ? programs.length
                  : programs.filter((program) => getProgramCategory(program) === option.value).length;
              const isActive = categoryFilter === option.value;

              return (
                  <button
                      key={option.value}
                      type="button"
                      onClick={() => setCategoryFilter(option.value)}
                      aria-pressed={isActive}
                      className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                          isActive
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <span aria-hidden="true">{option.icon}</span>
                    <span>{option.label}</span>
                    <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                        isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  </button>
              );
            })}
          </div>
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                  type="text"
                  placeholder="Search programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                  type="button"
                  onClick={toggleFilteredSelection}
                  disabled={filteredPrograms.length === 0}
                  className="btn-outline justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {filteredPrograms.length > 0 && filteredPrograms.every((program) => selectedProgramIds.includes(program.id))
                    ? 'Deselectionner'
                    : 'Selectionner'}
              </button>
              <div className="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-1" role="group" aria-label="Format d'export">
                {exportFormatOptions.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => setExportFormat(option.value)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            exportFormat === option.value
                                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
                        }`}
                        aria-pressed={exportFormat === option.value}
                    >
                      {option.label}
                    </button>
                ))}
              </div>
              <button
                  type="button"
                  onClick={handleExport}
                  disabled={selectedProgramIds.length === 0 || exporting}
                  className="btn-primary inline-flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                <span>{exporting ? 'Export...' : `Exporter (${selectedProgramIds.length})`}</span>
              </button>
            </div>
          </div>
        </div>

        {filteredPrograms.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <EmptyState
                  icon={CalendarDays}
                  title="No programs found"
                  description={
                    searchTerm || categoryFilter !== 'all'
                        ? 'Try adjusting your search or filter'
                        : 'Get started by creating your first program'
                  }
                  action={
                    !searchTerm && categoryFilter === 'all'
                        ? {
                          label: 'Create Program',
                          onClick: () => navigate('/programs/new'),
                        }
                        : undefined
                  }
              />
            </div>
        ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="md:hidden divide-y divide-gray-200">
                {filteredPrograms.map((program) => (
                    <div
                        key={program.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          localStorage.setItem('currentProgramId', program.id);
                          navigate(`/programs/${program.id}?mode=view`);
                        }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <input
                            type="checkbox"
                            checked={selectedProgramIds.includes(program.id)}
                            onChange={() => toggleProgramSelection(program.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                            aria-label={`Select ${program.name}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 break-words">{program.name}</p>
                          <p className="text-sm text-gray-600 mt-1 break-words">{program.goal || '-'}</p>
                        </div>
                        <div className="flex justify-end gap-1 shrink-0">
                          <button
                              onClick={(e) => {
                                e.stopPropagation();
                                localStorage.setItem('currentProgramId', program.id);
                                navigate(`/programs/${program.id}/edit`);
                              }}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              aria-label="Edit program"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDuplicate(program);
                              }}
                              disabled={duplicatingId === program.id}
                              className="p-2 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Duplicate program"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(program.id);
                              }}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              aria-label="Delete program"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                        <span>{program.weeks} {program.weeks === 1 ? 'week' : 'weeks'}</span>
                        <span>{program.sessionsPerWeek}x/week</span>
                        <span>{program.schedule.length} scheduled</span>
                      </div>
                    </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                          type="checkbox"
                          checked={filteredPrograms.length > 0 && filteredPrograms.every((program) => selectedProgramIds.includes(program.id))}
                          onChange={toggleFilteredSelection}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                          aria-label="Select all visible programs"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Goal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                  {filteredPrograms.map((program) => (
                      <tr
                          key={program.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            localStorage.setItem('currentProgramId', program.id);
                            navigate(`/programs/${program.id}?mode=view`);
                          }}
                      >
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="checkbox"
                                checked={selectedProgramIds.includes(program.id)}
                                onChange={() => toggleProgramSelection(program.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                aria-label={`Select ${program.name}`}
                            />
                          </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{program.name}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {program.goal || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {program.weeks} {program.weeks === 1 ? 'week' : 'weeks'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {program.sessionsPerWeek}x per week ({program.schedule.length} scheduled)
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  localStorage.setItem('currentProgramId', program.id);
                                  navigate(`/programs/${program.id}/edit`);
                                }}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                aria-label="Edit program"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleDuplicate(program);
                                }}
                                disabled={duplicatingId === program.id}
                                className="p-2 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Duplicate program"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(program.id);
                                }}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                aria-label="Delete program"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
        )}

        <ConfirmDialog
            isOpen={deleteId !== null}
            onClose={() => setDeleteId(null)}
            onConfirm={handleDelete}
            title="Delete Program"
            message="Are you sure you want to delete this program? This action cannot be undone."
            confirmLabel="Delete"
        />
      </div>
  );
}