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

// Types for exercise weights (new API)
export type WeightUnit = 'kg' | 'lb';

export interface ExerciseWeight {
  _id: string;
  exerciseId: string;
  sessionId: string;
  weight: number;
  unit: WeightUnit;
  setNumber: number;
  reps: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseWeightCreate {
  exerciseId: string;
  sessionId: string;
  weight: number;
  unit: WeightUnit;
  setNumber: number;
  reps: number;
}

export interface ExerciseWeightPatch {
  weight?: number;
  unit?: WeightUnit;
  setNumber?: number;
  reps?: number;
}

export interface ProgressPoint {
  date: string;
  sessionId: string;
  setNumber: number;
  weight: number;
  unit: WeightUnit;
  reps: number;
}

export interface ProgressSession {
  sessionId: string;
  date: string;
  maxWeight: number;
  totalSets: number;
  weights: ExerciseWeight[];
}

export interface ExerciseProgressionData {
  exerciseId: string;
  totalSessions: number;
  maxWeight: number;
  latestWeight: number;
  progression: ProgressSession[];
}