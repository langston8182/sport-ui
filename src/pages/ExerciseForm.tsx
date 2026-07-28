import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Info, Upload, CreditCard as Edit } from 'lucide-react';
import { exercisesService } from '../services/exercises';
import { ExerciseMode } from '../types';
import { Loader } from '../components/ui/Loader';
import { useToast } from '../components/ui/Toast';
import { uploadImage, getResponsiveImageUrl } from '../services/imageUpload';

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
  const [previewLoading, setPreviewLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const previousPreviewUrlRef = useRef<string | null>(null);
  const previewRequestIdRef = useRef(0);

  const cleanupPreviewUrl = (url: string | null) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  const updatePreviewUrl = (nextUrl: string) => {
    cleanupPreviewUrl(previousPreviewUrlRef.current);
    previousPreviewUrlRef.current = nextUrl;
    setImagePreviewUrl(nextUrl);
  };

  const createFastPreviewUrl = async (file: File): Promise<string> => {
    const sourceObjectUrl = URL.createObjectURL(file);

    try {
      const img = new Image();
      img.src = sourceObjectUrl;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to decode image'));
      });

      const maxPreviewSize = 800;
      const scale = Math.min(maxPreviewSize / img.naturalWidth, maxPreviewSize / img.naturalHeight, 1);
      const width = Math.max(1, Math.round(img.naturalWidth * scale));
      const height = Math.max(1, Math.round(img.naturalHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        return sourceObjectUrl;
      }

      context.drawImage(img, 0, 0, width, height);

      const previewBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
            return;
          }
          reject(new Error('Failed to create preview blob'));
        }, 'image/jpeg', 0.82);
      });

      return URL.createObjectURL(previewBlob);
    } finally {
      URL.revokeObjectURL(sourceObjectUrl);
    }
  };

  useEffect(() => {
    if (id) {
      fetchExercise();
    }
  }, [id]);

  useEffect(() => {
    return () => {
      cleanupPreviewUrl(previousPreviewUrlRef.current);
    };
  }, []);

  const fetchExercise = async () => {
    if (!id) return;

    try {
      const data = await exercisesService.getById(id);
      setName(data.name);
      setMode(data.mode);
      setNotes(data.notes || '');
      setImageKeyOriginal(data.imageKeyOriginal);
      setImagePreviewUrl(getResponsiveImageUrl(data.imageKeyOriginal));
      setPreviewLoading(true);
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

    const requestId = ++previewRequestIdRef.current;
    setSelectedFile(file);
    setPreviewLoading(true);
    setErrors({ ...errors, image: '' });

    void createFastPreviewUrl(file)
      .then((previewUrl) => {
        if (requestId !== previewRequestIdRef.current) {
          cleanupPreviewUrl(previewUrl);
          return;
        }
        updatePreviewUrl(previewUrl);
      })
      .catch(() => {
        if (requestId !== previewRequestIdRef.current) {
          return;
        }
        updatePreviewUrl(URL.createObjectURL(file));
      })
      .finally(() => {
        if (requestId === previewRequestIdRef.current) {
          setPreviewLoading(false);
        }
      });
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
        navigate('/exercises');
      } else {
        const createdExercise = await exercisesService.create(payload);
        showToast('Exercise created successfully', 'success');
        navigate('/exercises', { state: { createdExercise } });
      }
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
                      <div className="relative w-64 h-64">
                        {previewLoading && (
                            <div className="absolute inset-0 rounded-lg bg-white/80 backdrop-blur-sm flex items-center justify-center">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-4 h-4 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
                                <span>Chargement de l'image...</span>
                              </div>
                            </div>
                        )}
                        <img
                            src={imagePreviewUrl}
                            alt={name}
                            className={`w-64 h-64 object-cover rounded-lg transition-opacity ${previewLoading ? 'opacity-40' : 'opacity-100'}`}
                            onLoad={() => setPreviewLoading(false)}
                            onError={(e) => {
                              setPreviewLoading(false);
                              e.currentTarget.style.display = 'none';
                            }}
                        />
                      </div>
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
                  <div className="inline-flex w-full sm:w-auto rounded-xl border border-gray-200 bg-white p-1 shadow-soft">
                    <button
                        type="button"
                        onClick={() => setMode('reps')}
                        className={`flex-1 sm:flex-initial px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            mode === 'reps'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                        aria-pressed={mode === 'reps'}
                    >
                      Repetitions
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('time')}
                        className={`flex-1 sm:flex-initial px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            mode === 'time'
                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                        aria-pressed={mode === 'time'}
                    >
                      Temps
                    </button>
                  </div>

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

                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {imagePreviewUrl && (
                        <div className="w-32 flex-shrink-0">
                          <div className="relative w-32 h-32">
                            {previewLoading && (
                                <div className="absolute inset-0 rounded-lg bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                  <div className="w-5 h-5 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
                                </div>
                            )}
                            <img
                                src={imagePreviewUrl}
                                alt="Preview"
                                className={`w-32 h-32 object-cover rounded-lg transition-opacity ${previewLoading ? 'opacity-40' : 'opacity-100'}`}
                                onLoad={() => setPreviewLoading(false)}
                                onError={(e) => {
                                  setPreviewLoading(false);
                                  e.currentTarget.style.display = 'none';
                                }}
                            />
                          </div>
                          {selectedFile && (
                              <p className="mt-2 text-xs text-gray-500 truncate" title={selectedFile.name}>
                                {selectedFile.name}
                              </p>
                          )}
                        </div>
                    )}

                    <div className="flex-1 min-w-0 w-full">
                      <label
                          htmlFor="image"
                          className="flex items-center justify-center gap-2 px-4 py-3 w-full border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600">Choisir une image</span>
                      </label>
                      <input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                      />
                      {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
                      {uploading && (
                          <p className="mt-2 text-sm text-blue-600 flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
                            Upload de l'image en cours...
                          </p>
                      )}
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