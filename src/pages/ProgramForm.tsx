import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, X, CreditCard as Edit } from 'lucide-react';
import { programsService } from '../services/programs';
import { sessionsService } from '../services/sessions';
import { Program, Session, ScheduleEntry } from '../types';
import { Loader } from '../components/ui/Loader';
import { useToast } from '../components/ui/Toast';
import { SessionPicker } from '../components/programs/SessionPicker';
// SessionDetailsModal removed: navigation instead of modal

export function ProgramForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const viewMode = searchParams.get('mode') || 'edit';
  const isView = viewMode === 'view';
  const isEdit = Boolean(id) && !isView;

  const [loading, setLoading] = useState(Boolean(id));
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [weeks, setWeeks] = useState(4);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPicker, setShowPicker] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ week: number; slot: number } | null>(null);

  useEffect(() => {
    fetchSessions();
    if (id) {
      fetchProgram();
    }
  }, [id]);

  const fetchSessions = async () => {
    try {
      const data = await sessionsService.getAll();
      const dataArray = Array.isArray(data) ? data : [];
      const sessionMap = dataArray.reduce((acc, s) => {
        acc[s.id] = s;
        return acc;
      }, {} as Record<string, Session>);
      setSessions(sessionMap);
    } catch (error) {
      showToast('Failed to load sessions', 'error');
      setSessions({});
    }
  };

  const fetchProgram = async () => {
    if (!id) return;

    try {
      const data = await programsService.getById(id);
      setName(data.name);
      setGoal(data.goal || '');
      setWeeks(data.weeks);
      setSessionsPerWeek(data.sessionsPerWeek);
      setSchedule(data.schedule);
    } catch (error) {
      showToast('Failed to load program', 'error');
      navigate('/programs');
    } finally {
      setLoading(false);
    }
  };

  const getScheduleEntry = (week: number, slot: number): ScheduleEntry | undefined => {
    return schedule.find((entry) => entry.week === week && entry.slot === slot);
  };

  const handleCellClick = (week: number, slot: number) => {
    setSelectedCell({ week, slot });
    setShowPicker(true);
  };

  /**
   * Navigates to the session detail page in view mode. When a session cell is clicked,
   * redirect to the session's page with ?mode=view.
   */
  const handleViewSession = (sessionId: string) => {
    navigate(`/sessions/${sessionId}?mode=view`);
  };

  const handleSelectSession = async (session: Session) => {
    if (!selectedCell) return;

    const { week, slot } = selectedCell;
    const existingEntry = getScheduleEntry(week, slot);
    const entryId = `wk${week}-s${slot}`;

    setShowPicker(false);
    setSelectedCell(null);

    try {
      if (isEdit && id) {
        if (existingEntry) {
          await programsService.updateScheduleEntry(id, existingEntry.entryId, {
            week,
            slot,
            sessionId: session.id,
          });

          setSchedule((prev) =>
              prev.map((entry) =>
                  entry.week === week && entry.slot === slot
                      ? { ...entry, sessionId: session.id }
                      : entry
              )
          );
        } else {
          const newEntry = await programsService.addScheduleEntry(id, {
            week,
            slot,
            sessionId: session.id,
          });
          setSchedule((prev) => [...prev, newEntry]);
        }
        setSessions((prev) => ({ ...prev, [session.id]: session }));
        showToast('Session added to schedule', 'success');
      } else {
        setSessions((prev) => ({ ...prev, [session.id]: session }));
        if (existingEntry) {
          setSchedule((prev) =>
              prev.map((entry) =>
                  entry.week === week && entry.slot === slot
                      ? { ...entry, sessionId: session.id }
                      : entry
              )
          );
        } else {
          setSchedule((prev) => [...prev, { entryId, week, slot, sessionId: session.id }]);
        }
      }
    } catch (error) {
      showToast('Failed to update schedule', 'error');
    }
  };

  const handleRemoveEntry = async (week: number, slot: number) => {
    const entry = getScheduleEntry(week, slot);
    if (!entry) return;

    try {
      if (isEdit && id) {
        await programsService.deleteScheduleEntry(id, entry.entryId);
      }
      setSchedule((prev) => prev.filter((e) => !(e.week === week && e.slot === slot)));
    } catch (error) {
      showToast('Failed to remove session from schedule', 'error');
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (weeks < 1) {
      newErrors.weeks = 'Must be at least 1 week';
    }

    if (sessionsPerWeek < 1) {
      newErrors.sessionsPerWeek = 'Must be at least 1 session per week';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    try {
      const payload = { name, goal: goal || undefined, weeks, sessionsPerWeek };

      if (isEdit && id) {
        await programsService.update(id, payload);
        showToast('Program updated successfully', 'success');
      } else {
        const created = await programsService.create(payload);

        for (const entry of schedule) {
          await programsService.addScheduleEntry(created.id, {
            week: entry.week,
            slot: entry.slot,
            sessionId: entry.sessionId,
          });
        }

        showToast('Program created successfully', 'success');
      }
      navigate('/programs');
    } catch (error) {
      showToast(
          isEdit ? 'Failed to update program' : 'Failed to create program',
          'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
      <div>
        <button
            onClick={() => navigate('/programs')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Programs</span>
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {isView ? name || 'Program Details' : isEdit ? 'Edit Program' : 'New Program'}
            </h1>
            {isView && (
                <button
                    onClick={() => navigate(`/programs/${id}/edit`)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
            )}
          </div>

          {isView ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Program Name</label>
                    <p className="text-gray-900 text-lg font-semibold">{name}</p>
                  </div>

                  {goal && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Goal</label>
                        <p className="text-gray-900">{goal}</p>
                      </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                    <p className="text-gray-900">{weeks} {weeks === 1 ? 'week' : 'weeks'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sessions per Week</label>
                    <p className="text-gray-900">{sessionsPerWeek}</p>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h2>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                          Week
                        </th>
                        {Array.from({ length: sessionsPerWeek }, (_, i) => (
                            <th
                                key={i}
                                className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0"
                            >
                              Slot {i + 1}
                            </th>
                        ))}
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                      {Array.from({ length: weeks }, (_, weekIndex) => {
                        const week = weekIndex + 1;
                        return (
                            <tr key={week}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200">
                                Week {week}
                              </td>
                              {Array.from({ length: sessionsPerWeek }, (_, slotIndex) => {
                                const slot = slotIndex + 1;
                                const entry = getScheduleEntry(week, slot);
                                const session = entry ? sessions[entry.sessionId] : null;

                                return (
                                    <td
                                        key={slot}
                                        className="px-2 py-2 border-r border-gray-200 last:border-r-0"
                                    >
                                      {session ? (
                                          <button
                                              type="button"
                                              onClick={() => handleViewSession(session.id)}
                                              className="w-full p-2 bg-blue-50 border border-blue-200 rounded-lg text-left hover:bg-blue-100"
                                          >
                                            <span className="text-sm text-blue-900 font-medium truncate">
                                              {session.name}
                                            </span>
                                          </button>
                                      ) : (
                                          <div className="p-4 text-center text-sm text-gray-400">
                                            No session
                                          </div>
                                      )}
                                    </td>
                                );
                              })}
                            </tr>
                        );
                      })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                      type="button"
                      onClick={() => navigate('/programs')}
                      className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Back to Programs
                  </button>
                </div>
              </div>
          ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Program Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                            errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., 12-Week Strength Builder"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
                      Goal
                    </label>
                    <input
                        id="goal"
                        type="text"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="e.g., Build strength and muscle"
                    />
                  </div>

                  <div>
                    <label htmlFor="weeks" className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (weeks) <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="weeks"
                        type="number"
                        min="1"
                        value={weeks}
                        onChange={(e) => setWeeks(Number(e.target.value))}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                            errors.weeks ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.weeks && <p className="mt-1 text-sm text-red-600">{errors.weeks}</p>}
                  </div>

                  <div>
                    <label htmlFor="sessionsPerWeek" className="block text-sm font-medium text-gray-700 mb-2">
                      Sessions per Week <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="sessionsPerWeek"
                        type="number"
                        min="1"
                        value={sessionsPerWeek}
                        onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                            errors.sessionsPerWeek ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.sessionsPerWeek && <p className="mt-1 text-sm text-red-600">{errors.sessionsPerWeek}</p>}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Click on any cell to assign a session to that week and slot
                  </p>

                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                          Week
                        </th>
                        {Array.from({ length: sessionsPerWeek }, (_, i) => (
                            <th
                                key={i}
                                className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0"
                            >
                              Slot {i + 1}
                            </th>
                        ))}
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                      {Array.from({ length: weeks }, (_, weekIndex) => {
                        const week = weekIndex + 1;
                        return (
                            <tr key={week}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200">
                                Week {week}
                              </td>
                              {Array.from({ length: sessionsPerWeek }, (_, slotIndex) => {
                                const slot = slotIndex + 1;
                                const entry = getScheduleEntry(week, slot);
                                const session = entry ? sessions[entry.sessionId] : null;

                                return (
                                    <td
                                        key={slot}
                                        className="px-2 py-2 border-r border-gray-200 last:border-r-0"
                                    >
                                      {session ? (
                                          <div
                                              className="flex items-center justify-between gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer"
                                              onClick={() => handleViewSession(session.id)}
                                          >
                                            <span className="text-sm text-blue-900 font-medium truncate">
                                              {session.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleRemoveEntry(week, slot);
                                                }}
                                                className="flex-shrink-0 text-blue-600 hover:text-blue-800"
                                                aria-label="Remove session"
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                          </div>
                                      ) : (
                                          <button
                                              type="button"
                                              onClick={() => handleCellClick(week, slot)}
                                              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm text-gray-500"
                                          >
                                            Click to assign
                                          </button>
                                      )}
                                    </td>
                                );
                              })}
                            </tr>
                        );
                      })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                      type="button"
                      onClick={() => navigate('/programs')}
                      className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : isEdit ? 'Update Program' : 'Create Program'}
                  </button>
                </div>
              </form>
          )}
        </div>

        {!isView && (
            <SessionPicker
                isOpen={showPicker}
                onClose={() => {
                  setShowPicker(false);
                  setSelectedCell(null);
                }}
                onSelect={handleSelectSession}
            />
        )}
      </div>
  );
}