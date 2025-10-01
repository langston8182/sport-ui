import { api } from './api';
import { Session } from '../types';

interface ApiSession {
  _id: string;
  name: string;
  items: any[];
}

interface SessionsResponse {
  sessions: ApiSession[];
}

function mapSession(apiSession: ApiSession): Session {
  return {
    id: apiSession._id,
    name: apiSession.name,
    items: apiSession.items,
  };
}

export const sessionsService = {
  getAll: async () => {
    const response = await api.get<SessionsResponse>('/sessions');
    return response.sessions.map(mapSession);
  },

  getById: async (id: string) => {
    const apiSession = await api.get<ApiSession>(`/sessions/${id}`);
    return mapSession(apiSession);
  },

  create: async (data: Omit<Session, 'id'>) => {
    const apiSession = await api.post<ApiSession>('/sessions', data);
    return mapSession(apiSession);
  },

  update: async (id: string, data: Partial<Omit<Session, 'id'>>) => {
    const apiSession = await api.patch<ApiSession>(`/sessions/${id}`, data);
    return mapSession(apiSession);
  },

  delete: (id: string) => api.delete(`/sessions/${id}`),
};