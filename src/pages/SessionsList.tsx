import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, CreditCard as Edit, Trash2, Search, Play, ListChecks } from 'lucide-react';
import { sessionsService } from '../services/sessions';
import { exercisesService } from '../services/exercises';
import { Session, Exercise } from '../types';
import { Loader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { matchesSearchTerm } from '../utils/searchUtils';

export function SessionsList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // Store all exercises in a map so we can pass them to the play page without
  // further backend calls. If exercises fail to load, the map remains empty.
  const [exercises, setExercises] = useState<Record<string, Exercise>>({});
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchSessions();
    fetchExercises();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredSessions(
          sessions.filter((session) =>
              matchesSearchTerm(searchTerm, session.name)
          )
      );
    } else {
      setFilteredSessions(sessions);
    }
  }, [sessions, searchTerm]);

  const fetchSessions = async () => {
    try {
      const data = await sessionsService.getAll();
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('Failed to load sessions', 'error');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch all exercises once so that session play mode can resolve exercise
   * names and details without performing additional backend requests. This
   * call is optional; if it fails the exercises map will remain empty.
   */
  const fetchExercises = async () => {
    try {
      const data = await exercisesService.getAll();
      const dataArray = Array.isArray(data) ? data : [];
      const exMap: Record<string, Exercise> = {};
      for (const ex of dataArray) {
        exMap[ex.id] = ex;
      }
      setExercises(exMap);
    } catch (error) {
      // Do not show a toast here; exercise data is optional for play mode
      setExercises({});
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await sessionsService.delete(deleteId);
      setSessions((prev) => prev.filter((s) => s.id !== deleteId));
      showToast('Session deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete session', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const calculateDuration = (session: Session): number => {
    return session.items.reduce((total, item) => {
      if (item.durationSec) {
        return total + item.durationSec + item.restSec;
      }
      if (item.sets && item.reps) {
        return total + item.sets * 3 + item.restSec * item.sets;
      }
      return total;
    }, 0);
  };

  if (loading) {
    return <Loader />;
  }

  return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">Sessions</h1>
            <p className="text-gray-600 text-lg">{sessions.length} total sessions</p>
          </div>
          <Link
              to="/sessions/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Session</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>

        {filteredSessions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <EmptyState
                  icon={ListChecks}
                  title="No sessions found"
                  description={
                    searchTerm
                        ? 'Try adjusting your search'
                        : 'Get started by creating your first session'
                  }
                  action={
                    !searchTerm
                        ? {
                          label: 'Create Session',
                          onClick: () => navigate('/sessions/new'),
                        }
                        : undefined
                  }
              />
            </div>
        ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exercises
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Est. Duration
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                  {filteredSessions.map((session) => (
                      <tr
                          key={session.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/sessions/${session.id}?mode=view`)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{session.name}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {session.items.length} exercises
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {Math.round(calculateDuration(session) / 60)} min
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {/* Play session: navigate to training mode without triggering row click */}
                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/sessions/${session.id}/play`, {
                                    state: { session, exercises },
                                  });
                                }}
                                className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                aria-label="Play session"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/sessions/${session.id}/edit`);
                                }}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                aria-label="Edit session"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(session.id);
                                }}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                aria-label="Delete session"
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
            title="Delete Session"
            message="Are you sure you want to delete this session? This action cannot be undone."
            confirmLabel="Delete"
        />
      </div>
  );
}