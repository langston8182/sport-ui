import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, CreditCard as Edit, Trash2, Search, CalendarDays } from 'lucide-react';
import { programsService } from '../services/programs';
import { Program } from '../types';
import { Loader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';

export function ProgramsList() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredPrograms(
          programs.filter((program) =>
              program.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    } else {
      setFilteredPrograms(programs);
    }
  }, [programs, searchTerm]);

  const fetchPrograms = async () => {
    try {
      const data = await programsService.getAll();
      setPrograms(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('Failed to load programs', 'error');
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await programsService.delete(deleteId);
      setPrograms((prev) => prev.filter((p) => p.id !== deleteId));
      showToast('Program deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete program', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Programs</h1>
            <p className="text-gray-600">{programs.length} total programs</p>
          </div>
          <Link
              to="/programs/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Program</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
                type="text"
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>

        {filteredPrograms.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <EmptyState
                  icon={CalendarDays}
                  title="No programs found"
                  description={
                    searchTerm
                        ? 'Try adjusting your search'
                        : 'Get started by creating your first program'
                  }
                  action={
                    !searchTerm
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
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
                          onClick={() => navigate(`/programs/${program.id}?mode=view`)}
                      >
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