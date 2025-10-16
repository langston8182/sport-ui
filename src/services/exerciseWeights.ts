import { ExerciseWeight, ExerciseWeightCreate, ExerciseWeightPatch, ExerciseProgressionData } from '../types';
import { api } from './api';

export interface GetExerciseWeightsParams {
  exerciseId?: string;
  sessionId?: string;
}

class ExerciseWeightsService {
  private basePath = '/exercise-weights';

  async getAll(params?: GetExerciseWeightsParams): Promise<ExerciseWeight[]> {
    const queryParams: Record<string, string> = {};
    
    if (params?.exerciseId) {
      queryParams.exerciseId = params.exerciseId;
    }
    if (params?.sessionId) {
      queryParams.sessionId = params.sessionId;
    }

    const response = await api.get<{ weights: ExerciseWeight[] }>(this.basePath, queryParams);
    return response.weights || [];
  }

  async getById(weightId: string): Promise<ExerciseWeight> {
    return api.get<ExerciseWeight>(`${this.basePath}/${weightId}`);
  }

  async create(data: ExerciseWeightCreate): Promise<ExerciseWeight> {
    return api.post<ExerciseWeight>(this.basePath, data);
  }

  async update(weightId: string, data: ExerciseWeightPatch): Promise<ExerciseWeight> {
    return api.patch<ExerciseWeight>(`${this.basePath}/${weightId}`, data);
  }

  async delete(weightId: string): Promise<void> {
    return api.delete<void>(`${this.basePath}/${weightId}`);
  }

  async getProgression(exerciseId: string): Promise<ExerciseProgressionData> {
    return api.get<ExerciseProgressionData>(`/exercises/${exerciseId}/progression`);
  }
}

export const exerciseWeightsService = new ExerciseWeightsService();