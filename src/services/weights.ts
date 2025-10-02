import { WeightEntry } from '../types';
import { api } from './api';

export interface CreateWeightRequest {
  weight: number;
  unit: 'kg' | 'lbs';
  measureDate: string;
  notes?: string;
}

export interface UpdateWeightRequest {
  weight?: number;
  unit?: 'kg' | 'lbs';
  measureDate?: string;
  notes?: string;
}

export interface GetWeightsParams {
  latest?: boolean;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

class WeightsService {
  private basePath = '/weights';

  async getAll(params?: GetWeightsParams): Promise<WeightEntry[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.latest) {
      queryParams.append('latest', 'true');
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate);
    }

    const url = queryParams.toString() 
      ? `${this.basePath}?${queryParams.toString()}`
      : this.basePath;

    const response = await api.get<{ weights: WeightEntry[] }>(url);
    return response.weights || [];
  }

  async getById(id: string): Promise<WeightEntry> {
    const response = await api.get<any>(`${this.basePath}/${id}`);
    return response.weight || response;
  }

  async getLatest(): Promise<WeightEntry | null> {
    const weights = await this.getAll({ latest: true });
    return weights.length > 0 ? weights[0] : null;
  }

  async create(data: CreateWeightRequest): Promise<WeightEntry> {
    const response = await api.post<any>(this.basePath, data);
    return response.weight || response;
  }

  async update(id: string, data: UpdateWeightRequest): Promise<WeightEntry> {
    const response = await api.patch<any>(`${this.basePath}/${id}`, data);
    return response.weight || response;
  }

  async delete(id: string): Promise<void> {
    return api.delete<void>(`${this.basePath}/${id}`);
  }

  // Fonctions utilitaires
  formatWeight(weight: number, unit: 'kg' | 'lbs'): string {
    return `${weight.toFixed(1)} ${unit}`;
  }

  convertWeight(weight: number, fromUnit: 'kg' | 'lbs', toUnit: 'kg' | 'lbs'): number {
    if (fromUnit === toUnit) return weight;
    
    if (fromUnit === 'kg' && toUnit === 'lbs') {
      return weight * 2.20462;
    } else if (fromUnit === 'lbs' && toUnit === 'kg') {
      return weight / 2.20462;
    }
    
    return weight;
  }

  calculateBMI(weight: number, heightInCm: number, unit: 'kg' | 'lbs' = 'kg'): number {
    const weightInKg = unit === 'lbs' ? this.convertWeight(weight, 'lbs', 'kg') : weight;
    const heightInM = heightInCm / 100;
    return weightInKg / (heightInM * heightInM);
  }

  getWeightTrend(weights: WeightEntry[]): 'increasing' | 'decreasing' | 'stable' | 'insufficient-data' {
    if (weights.length < 2) return 'insufficient-data';
    
    const sortedWeights = [...weights].sort((a, b) => 
      new Date(a.measureDate).getTime() - new Date(b.measureDate).getTime()
    );
    
    const recent = sortedWeights.slice(-5); // 5 dernières mesures
    if (recent.length < 2) return 'insufficient-data';
    
    const first = recent[0].weight;
    const last = recent[recent.length - 1].weight;
    const difference = last - first;
    
    if (Math.abs(difference) < 0.5) return 'stable'; // Moins de 0.5kg de différence
    return difference > 0 ? 'increasing' : 'decreasing';
  }
}

export const weightsService = new WeightsService();