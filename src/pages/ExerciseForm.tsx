import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Info, Upload, CreditCard as Edit } from 'lucide-react';
import { exercisesService } from '../services/exercises';
import { ExerciseMode } from '../types';
import { Loader } from '../components/ui/Loader';
import { useToast } from '../components/ui/Toast';
import { uploadImage, getImageUrl, getResponsiveImageUrl } from '../services/imageUpload';

export function ExerciseForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const viewMode = searchParams.get('mode') || 'edit';
  const isView = viewMode === 'view';
  const isEdit = Boolean(id) && !isView;

  const [loading, setLoading] = useState(Boolean(id));
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<ExerciseMode>('reps');
  const [notes, setNotes] = useState('');
  const [imageKeyOriginal, setImageKeyOriginal] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchExercise();
    }
  }, [id]);

  const fetchExercise = async () => {
    if (!id) return;

    try {
      const data = await exercisesService.getById(id);
      setName(data.name);
      setMode(data.mode);
      setNotes(data.notes || '');
      setImageKeyOriginal(data.imageKeyOriginal);
      setImagePreviewUrl(getResponsiveImageUrl(data.imageKeyOriginal));
    } catch (error) {
      showToast('Failed to load exercise', 'error');
      navigate('/exercises');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, image: 'Please select an image file' });
      return;
    }

    setSelectedFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setErrors({ ...errors, image: '' });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!imageKeyOriginal && !selectedFile) {
      newErrors.image = 'Image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    try {
      let finalImageKey = imageKeyOriginal;

      if (selectedFile) {
        setUploading(true);
        try {
          finalImageKey = await uploadImage(selectedFile);
        } catch (error) {
          showToast('Failed to upload image', 'error');
          setSubmitting(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      const payload = {
        name,
        mode,
        imageKeyOriginal: finalImageKey,
        notes: notes || undefined,
      };

      if (isEdit && id) {
        await exercisesService.update(id, payload);
        showToast('Exercise updated successfully', 'success');
      } else {
        await exercisesService.create(payload);
        showToast('Exercise created successfully', 'success');
      }
      navigate('/exercises');
    } catch (error) {
      showToast(
          isEdit ? 'Failed to update exercise' : 'Failed to create exercise',
          'error'
      );
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
      <div>
        <button
            onClick={() => navigate('/exercises')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Exercises</span>
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {isView ? name || 'Exercise Details' : isEdit ? 'Edit Exercise' : 'New Exercise'}
            </h1>
            {isView && (
                <button
                    onClick={() => navigate(`/exercises/${id}/edit`)}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <p className="text-gray-900 text-lg font-semibold">{name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                  <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          mode === 'reps'
                              ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800'
                              : 'bg-gradient-to-r from-emerald-100 to-green-200 text-emerald-800'
                      }`}
                  >
                {mode === 'reps' ? 'Répétitions' : 'Temps'}
              </span>
                </div>

                {imagePreviewUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                      <img
                          src={imagePreviewUrl}
                          alt={name}
                          className="w-64 h-64 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                      />
                    </div>
                )}

                {notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <p className="text-gray-700 whitespace-pre-wrap">{notes}</p>
                    </div>
                )}

                <div className="pt-4">
                  <button
                      type="button"
                      onClick={() => navigate('/exercises')}
                      className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Back to Exercises
                  </button>
                </div>
              </div>
          ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Push-ups"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="mode" className="block text-sm font-medium text-gray-700 mb-2">
                    Mode <span className="text-red-500">*</span>
                  </label>
                  <select
                      id="mode"
                      value={mode}
                      onChange={(e) => setMode(e.target.value as ExerciseMode)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="reps">Reps</option>
                    <option value="time">Time</option>
                  </select>

                  <div className="mt-2 p-3 bg-blue-50 rounded-lg flex gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      {mode === 'reps' ? (
                          <p>
                            <strong>Reps mode:</strong> Configure sets, reps per set, and rest time when
                            adding to a session.
                          </p>
                      ) : (
                          <p>
                            <strong>Time mode:</strong> Configure duration in seconds and rest time when
                            adding to a session.
                          </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                    Image <span className="text-red-500">*</span>
                  </label>

                  <div className="flex items-start gap-4">
                    {imagePreviewUrl && (
                        <img
                            src={imagePreviewUrl}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                        />
                    )}

                    <div className="flex-1">
                      <label
                          htmlFor="image"
                          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                    {selectedFile ? selectedFile.name : 'Choose an image file'}
                  </span>
                      </label>
                      <input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                      />
                      {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Optional notes or instructions..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                      type="button"
                      onClick={() => navigate('/exercises')}
                      className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                      type="submit"
                      disabled={submitting || uploading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading
                        ? 'Uploading image...'
                        : submitting
                            ? 'Saving...'
                            : isEdit
                                ? 'Update Exercise'
                                : 'Create Exercise'}
                  </button>
                </div>
              </form>
          )}
        </div>
      </div>
  );
}