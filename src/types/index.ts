export type ExerciseMode = 'reps' | 'time';

export interface Exercise {
  id: string;
  name: string;
  mode: ExerciseMode;
  imageKeyOriginal: string;
  notes?: string;
}

export interface SessionItem {
  order: number;
  exerciseId: string;
  sets?: number;
  reps?: number;
  durationSec?: number;
  restSec: number;
  notes?: string;
}

export interface Session {
  id: string;
  name: string;
  items: SessionItem[];
}

export interface ScheduleEntry {
  entryId: string;
  week: number;
  slot: number;
  sessionId: string;
}

export interface Program {
  id: string;
  name: string;
  goal?: string;
  weeks: number;
  sessionsPerWeek: number;
  schedule: ScheduleEntry[];
}

export interface WeightEntry {
  _id: string;
  weight: number;
  unit: 'kg' | 'lbs';
  measureDate: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}