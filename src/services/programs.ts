import { api } from './api';
import { Program, ScheduleEntry } from '../types';

interface ApiProgram {
  _id: string;
  name: string;
  goal?: string;
  weeks: number;
  sessionsPerWeek: number;
  schedule: any[];
}

interface ProgramsResponse {
  programs: ApiProgram[];
}

function mapProgram(apiProgram: ApiProgram): Program {
  return {
    id: apiProgram._id,
    name: apiProgram.name,
    goal: apiProgram.goal,
    weeks: apiProgram.weeks,
    sessionsPerWeek: apiProgram.sessionsPerWeek,
    schedule: apiProgram.schedule,
  };
}

export const programsService = {
  getAll: async () => {
    const response = await api.get<ProgramsResponse>('/programs');
    return response.programs.map(mapProgram);
  },

  getById: async (id: string) => {
    const apiProgram = await api.get<ApiProgram>(`/programs/${id}`);
    return mapProgram(apiProgram);
  },

  create: async (data: Omit<Program, 'id' | 'schedule'>) => {
    const apiProgram = await api.post<ApiProgram>('/programs', data);
    return mapProgram(apiProgram);
  },

  update: async (id: string, data: Partial<Omit<Program, 'id' | 'schedule'>>) => {
    const apiProgram = await api.patch<ApiProgram>(`/programs/${id}`, data);
    return mapProgram(apiProgram);
  },

  delete: (id: string) => api.delete(`/programs/${id}`),

  addScheduleEntry: (programId: string, data: Omit<ScheduleEntry, 'entryId'>) =>
      api.post<ScheduleEntry>(`/programs/${programId}/schedule`, data),

  updateScheduleEntry: (programId: string, entryId: string, data: Omit<ScheduleEntry, 'entryId'>) =>
      api.put<ScheduleEntry>(`/programs/${programId}/schedule/${entryId}`, data),

  deleteScheduleEntry: (programId: string, entryId: string) =>
      api.delete(`/programs/${programId}/schedule/${entryId}`),
};