import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, CreditCard as Edit, Trash2, Search, Dumbbell } from 'lucide-react';
import { exercisesService } from '../services/exercises';
import { Exercise, ExerciseMode } from '../types';
import { Loader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { ImageModal } from '../components/ui/ImageModal';
import { getResponsiveImageUrl, getResponsiveImageSrcSet } from '../services/imageUpload';
import { matchesSearchTerm } from '../utils/searchUtils';

export function ExercisesList() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState<ExerciseMode | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; srcSet: string; alt: string } | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    let filtered = exercises;

    if (searchTerm) {
      filtered = filtered.filter((ex) =>
          matchesSearchTerm(searchTerm, ex.name) ||
          (ex.notes && matchesSearchTerm(searchTerm, ex.notes))
      );
    }

    if (modeFilter !== 'all') {
      filtered = filtered.filter((ex) => ex.mode === modeFilter);
    }

    setFilteredExercises(filtered);
  }, [exercises, searchTerm, modeFilter]);

  const fetchExercises = async () => {
    try {
      const data = await exercisesService.getAll();
      setExercises(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('Failed to load exercises', 'error');
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await exercisesService.delete(deleteId);
      setExercises((prev) => prev.filter((ex) => ex.id !== deleteId));
      showToast('Exercise deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete exercise', 'error');
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">Exercices</h1>
            <p className="text-gray-600 text-lg">{exercises.length} exercices au total</p>
          </div>
          <Link
              to="/exercises/new"
              className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nouvel exercice</span>
          </Link>
        </div>

        <div className="card-gradient rounded-2xl mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                  type="text"
                  placeholder="Rechercher des exercices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-modern w-full pl-10"
              />
            </div>
            <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value as ExerciseMode | 'all')}
                className="input-modern"
            >
              <option value="all">Tous les modes</option>
              <option value="reps">Répétitions</option>
              <option value="time">Temps</option>
            </select>
          </div>
        </div>

        {filteredExercises.length === 0 ? (
            <div className="card-gradient rounded-2xl">
              <EmptyState
                  icon={Dumbbell}
                  title="Aucun exercice trouvé"
                  description={
                    searchTerm || modeFilter !== 'all'
                        ? 'Essayez d\'ajuster vos filtres'
                        : 'Commencez par créer votre premier exercice'
                  }
                  action={
                    !searchTerm && modeFilter === 'all'
                        ? {
                          label: 'Créer un exercice',
                          onClick: () => navigate('/exercises/new'),
                        }
                        : undefined
                  }
              />
            </div>
        ) : (
            <div className="card-gradient rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                  {filteredExercises.map((exercise) => (
                      <tr
                          key={exercise.id}
                          className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/exercises/${exercise.id}?mode=view`)}
                      >
                        <td className="px-6 py-4">
                          <img
                              src={getResponsiveImageUrl(exercise.imageKeyOriginal)}
                              srcSet={getResponsiveImageSrcSet(exercise.imageKeyOriginal)}
                              sizes="(max-width: 640px) 64px, (max-width: 768px) 64px, 64px"
                              alt={exercise.name}
                              className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                setSelectedImage({
                                  url: getResponsiveImageUrl(exercise.imageKeyOriginal),
                                  srcSet: getResponsiveImageSrcSet(exercise.imageKeyOriginal),
                                  alt: exercise.name,
                                });
                                setImageModalOpen(true);
                              }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{exercise.name}</div>
                        </td>
                        <td className="px-6 py-4">
                      <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              exercise.mode === 'reps'
                                  ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800'
                                  : 'bg-gradient-to-r from-emerald-100 to-green-200 text-emerald-800'
                          }`}
                      >
                        {exercise.mode === 'reps' ? 'Répétitions' : 'Temps'}
                      </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {exercise.notes || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/exercises/${exercise.id}/edit`);
                                }}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                                aria-label="Edit exercise"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(exercise.id);
                                }}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                                aria-label="Delete exercise"
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
            title="Supprimer l'exercice"
            message="Êtes-vous sûr de vouloir supprimer cet exercice ? Cette action ne peut pas être annulée."
            confirmLabel="Supprimer"
        />

        <ImageModal
            isOpen={imageModalOpen}
            onClose={() => {
              setImageModalOpen(false);
              setSelectedImage(null);
            }}
            imageUrl={selectedImage?.url || ''}
            imageSrcSet={selectedImage?.srcSet}
            alt={selectedImage?.alt || ''}
        />
      </div>
  );
}