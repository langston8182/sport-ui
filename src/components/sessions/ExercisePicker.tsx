import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { exercisesService } from '../../services/exercises';
import { Exercise } from '../../types';
import { Loader } from '../ui/Loader';
import { getResponsiveImageUrl, getResponsiveImageSrcSet } from '../../services/imageUpload';
import { matchesSearchTerm } from '../../utils/searchUtils';

interface ExercisePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export function ExercisePicker({ isOpen, onClose, onSelect }: ExercisePickerProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchExercises();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredExercises(
          exercises.filter((ex) =>
              matchesSearchTerm(searchTerm, ex.name) ||
              (ex.notes && matchesSearchTerm(searchTerm, ex.notes))
          )
      );
    } else {
      setFilteredExercises(exercises);
    }
  }, [exercises, searchTerm]);

  const fetchExercises = async () => {
    try {
      const data = await exercisesService.getAll();
      setExercises(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load exercises:', error);
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    onClose();
    setSearchTerm('');
  };

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
            aria-hidden="true"
        />
        <div
            className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exercise-picker-title"
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 id="exercise-picker-title" className="text-xl font-semibold text-gray-900">
              Select Exercise
            </h2>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  autoFocus
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
                <Loader />
            ) : filteredExercises.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No exercises found</p>
            ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredExercises.map((exercise) => (
                      <button
                          key={exercise.id}
                          onClick={() => handleSelect(exercise)}
                          className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                      >
                        <img
                            src={getResponsiveImageUrl(exercise.imageKeyOriginal)}
                            alt={exercise.name}
                            className="w-16 h-16 object-cover rounded-lg bg-gray-200"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{exercise.name}</h3>
                          <p className="text-sm text-gray-600">
                      <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                              exercise.mode === 'reps'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                          }`}
                      >
                        {exercise.mode}
                      </span>
                          </p>
                        </div>
                      </button>
                  ))}
                </div>
            )}
          </div>
        </div>
      </div>
  );
}