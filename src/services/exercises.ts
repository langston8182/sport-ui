import { api } from './api';
import { Exercise } from '../types';

interface ApiExercise {
  _id: string;
  name: string;
  mode: 'reps' | 'time';
  imageKeyOriginal: string;
  notes?: string;
}

interface ExercisesResponse {
  exercises: ApiExercise[];
}

function mapExercise(apiEx: ApiExercise): Exercise {
  return {
    id: apiEx._id,
    name: apiEx.name,
    mode: apiEx.mode,
    imageKeyOriginal: apiEx.imageKeyOriginal,
    notes: apiEx.notes,
  };
}

export const exercisesService = {
  getAll: async () => {
    const response = await api.get<ExercisesResponse>('/exercises');
    return response.exercises.map(mapExercise);
  },

  getById: async (id: string) => {
    const apiEx = await api.get<ApiExercise>(`/exercises/${id}`);
    return mapExercise(apiEx);
  },

  create: async (data: Omit<Exercise, 'id'>) => {
    const apiEx = await api.post<ApiExercise>('/exercises', data);
    return mapExercise(apiEx);
  },

  update: async (id: string, data: Partial<Omit<Exercise, 'id'>>) => {
    const apiEx = await api.patch<ApiExercise>(`/exercises/${id}`, data);
    return mapExercise(apiEx);
  },

  delete: (id: string) => api.delete(`/exercises/${id}`),
};