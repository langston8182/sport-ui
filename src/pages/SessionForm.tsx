import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, CreditCard as Edit, GripVertical } from 'lucide-react';
import { sessionsService } from '../services/sessions';
import { exercisesService } from '../services/exercises';
import { Session, SessionItem, Exercise } from '../types';
import { Loader } from '../components/ui/Loader';
import { useToast } from '../components/ui/Toast';
import { ExercisePicker } from '../components/sessions/ExercisePicker';
import { getResponsiveImageUrl, getResponsiveImageSrcSet } from '../services/imageUpload';

export function SessionForm() {
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
  const [items, setItems] = useState<SessionItem[]>([]);
  const [exercises, setExercises] = useState<Record<string, Exercise>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPicker, setShowPicker] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchExercises();
    if (id) {
      fetchSession();
    }
  }, [id]);

  const fetchExercises = async () => {
    try {
      const data = await exercisesService.getAll();
      const dataArray = Array.isArray(data) ? data : [];
      const exerciseMap = dataArray.reduce((acc, ex) => {
        acc[ex.id] = ex;
        return acc;
      }, {} as Record<string, Exercise>);
      setExercises(exerciseMap);
    } catch (error) {
      showToast('Failed to load exercises', 'error');
      setExercises({});
    }
  };

  const fetchSession = async () => {
    if (!id) return;

    try {
      const data = await sessionsService.getById(id);
      setName(data.name);
      setItems(data.items);
    } catch (error) {
      showToast('Failed to load session', 'error');
      navigate('/sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = (exercise: Exercise) => {
    const newItem: SessionItem = {
      order: items.length,
      exerciseId: exercise.id,
      restSec: 60,
      ...(exercise.mode === 'reps'
          ? { sets: 3, reps: 10 }
          : { durationSec: 30 }),
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated.map((item, i) => ({ ...item, order: i })));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (
        (direction === 'up' && index === 0) ||
        (direction === 'down' && index === items.length - 1)
    ) {
      return;
    }

    const updated = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    setItems(updated.map((item, i) => ({ ...item, order: i })));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const updated = [...items];
      const [draggedItem] = updated.splice(draggedIndex, 1);
      updated.splice(dropIndex, 0, draggedItem);
      setItems(updated.map((item, i) => ({ ...item, order: i })));
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleUpdateItem = (index: number, updates: Partial<SessionItem>) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...updates };
    setItems(updated);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (items.length === 0) {
      newErrors.items = 'Add at least one exercise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    try {
      const payload = { name, items };

      if (isEdit && id) {
        await sessionsService.update(id, payload);
        showToast('Session updated successfully', 'success');
      } else {
        await sessionsService.create(payload);
        showToast('Session created successfully', 'success');
      }
      navigate('/sessions');
    } catch (error) {
      showToast(
          isEdit ? 'Failed to update session' : 'Failed to create session',
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
            onClick={() => navigate('/sessions')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Sessions</span>
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {isView ? name || 'Session Details' : isEdit ? 'Edit Session' : 'New Session'}
            </h1>
            {isView && (
                <button
                    onClick={() => navigate(`/sessions/${id}/edit`)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
            )}
          </div>

          {isView ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session Name</label>
                  <p className="text-gray-900 text-lg font-semibold">{name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">Exercises ({items.length})</label>
                  {items.length === 0 ? (
                      <p className="text-gray-500">No exercises in this session</p>
                  ) : (
                      <div className="space-y-3">
                        {items.map((item, index) => {
                          const exercise = exercises[item.exerciseId];
                          if (!exercise) return null;

                          return (
                              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="flex items-start gap-4">
                                  <img
                                      src={getResponsiveImageUrl(exercise.imageKeyOriginal)}
                                      srcSet={getResponsiveImageSrcSet(exercise.imageKeyOriginal)}
                                      sizes="(max-width: 640px) 64px, (max-width: 768px) 64px, 64px"
                                      alt={exercise.name}
                                      className="w-16 h-16 object-cover rounded-lg"
                                  />

                                  <div className="flex-1">
                                    <h3 className="font-medium text-gray-900 mb-3">{exercise.name}</h3>

                                    {exercise.mode === 'reps' ? (
                                        <div className="grid grid-cols-3 gap-3">
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">Sets</label>
                                            <p className="text-gray-900 font-semibold">{item.sets || 3}</p>
                                          </div>
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">Reps</label>
                                            <p className="text-gray-900 font-semibold">{item.reps || 10}</p>
                                          </div>
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">Rest (sec)</label>
                                            <p className="text-gray-900 font-semibold">{item.restSec}</p>
                                          </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">Duration (sec)</label>
                                            <p className="text-gray-900 font-semibold">{item.durationSec || 30}</p>
                                          </div>
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">Rest (sec)</label>
                                            <p className="text-gray-900 font-semibold">{item.restSec}</p>
                                          </div>
                                        </div>
                                    )}

                                    {item.notes && (
                                        <div className="mt-3">
                                          <label className="block text-xs text-gray-600 mb-1">Notes</label>
                                          <p className="text-gray-700 text-sm">{item.notes}</p>
                                        </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                          );
                        })}
                      </div>
                  )}
                </div>

                <div className="pt-4">
                  <button
                      type="button"
                      onClick={() => navigate('/sessions')}
                      className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Back to Sessions
                  </button>
                </div>
              </div>
          ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Session Name <span className="text-red-500">*</span>
                  </label>
                  <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Upper Body Strength"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Exercises <span className="text-red-500">*</span>
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowPicker(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Exercise
                    </button>
                  </div>

                  {errors.items && <p className="mb-2 text-sm text-red-600">{errors.items}</p>}

                  {items.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <p className="text-gray-500">No exercises added yet</p>
                        <button
                            type="button"
                            onClick={() => setShowPicker(true)}
                            className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Add your first exercise
                        </button>
                      </div>
                  ) : (
                      <div className="space-y-3">
                        {items.map((item, index) => {
                          const exercise = exercises[item.exerciseId];
                          if (!exercise) return null;

                          const isDragging = draggedIndex === index;
                          const isOver = dragOverIndex === index;

                          return (
                              <div
                                  key={index}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, index)}
                                  onDragOver={(e) => handleDragOver(e, index)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, index)}
                                  onDragEnd={handleDragEnd}
                                  className={`
                        relative border rounded-lg p-4 transition-all duration-200
                        ${isDragging
                                      ? 'opacity-50 scale-[0.98] shadow-2xl border-blue-500 bg-blue-50 cursor-grabbing'
                                      : 'bg-gray-50 border-gray-200 cursor-grab hover:shadow-lg hover:border-gray-300'
                                  }
                        ${isOver && !isDragging
                                      ? 'border-t-4 border-t-blue-500 border-b-4 border-b-blue-500 scale-[1.02]'
                                      : ''
                                  }
                      `}
                              >
                                {isOver && !isDragging && (
                                    <div className="absolute inset-0 bg-blue-100 opacity-20 rounded-lg pointer-events-none animate-pulse" />
                                )}
                                <div className="flex items-start gap-4">
                                  <div className="flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors mt-1">
                                    <GripVertical className="w-5 h-5" />
                                  </div>
                                  <img
                                      src={getResponsiveImageUrl(exercise.imageKeyOriginal)}
                                      srcSet={getResponsiveImageSrcSet(exercise.imageKeyOriginal)}
                                      sizes="(max-width: 640px) 64px, (max-width: 768px) 64px, 64px"
                                      alt={exercise.name}
                                      className="w-16 h-16 object-cover rounded-lg"
                                  />

                                  <div className="flex-1">
                                    <h3 className="font-medium text-gray-900 mb-3">{exercise.name}</h3>

                                    {exercise.mode === 'reps' ? (
                                        <div className="grid grid-cols-3 gap-3">
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">Sets</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.sets || 3}
                                                onChange={(e) =>
                                                    handleUpdateItem(index, { sets: Number(e.target.value) })
                                                }
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">Reps</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.reps || 10}
                                                onChange={(e) =>
                                                    handleUpdateItem(index, { reps: Number(e.target.value) })
                                                }
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">Rest (sec)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.restSec}
                                                onChange={(e) =>
                                                    handleUpdateItem(index, { restSec: Number(e.target.value) })
                                                }
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                                            />
                                          </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                              Duration (sec)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.durationSec || 30}
                                                onChange={(e) =>
                                                    handleUpdateItem(index, { durationSec: Number(e.target.value) })
                                                }
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">Rest (sec)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.restSec}
                                                onChange={(e) =>
                                                    handleUpdateItem(index, { restSec: Number(e.target.value) })
                                                }
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                                            />
                                          </div>
                                        </div>
                                    )}

                                    <div className="mt-3">
                                      <label className="block text-xs text-gray-600 mb-1">Notes</label>
                                      <input
                                          type="text"
                                          value={item.notes || ''}
                                          onChange={(e) =>
                                              handleUpdateItem(index, { notes: e.target.value })
                                          }
                                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                                          placeholder="Optional notes..."
                                      />
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-1">
                                    <button
                                        type="button"
                                        onClick={() => handleMoveItem(index, 'up')}
                                        disabled={index === 0}
                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                        aria-label="Move up"
                                    >
                                      <ChevronUp className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleMoveItem(index, 'down')}
                                        disabled={index === items.length - 1}
                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                        aria-label="Move down"
                                    >
                                      <ChevronDown className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(index)}
                                        className="p-1 text-gray-400 hover:text-red-600"
                                        aria-label="Remove"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                          );
                        })}
                      </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                      type="button"
                      onClick={() => navigate('/sessions')}
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
                    {submitting ? 'Saving...' : isEdit ? 'Update Session' : 'Create Session'}
                  </button>
                </div>
              </form>
          )}
        </div>

        {!isView && (
            <ExercisePicker
                isOpen={showPicker}
                onClose={() => setShowPicker(false)}
                onSelect={handleAddExercise}
            />
        )}
      </div>
  );
}