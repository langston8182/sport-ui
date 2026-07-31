import { api } from './api';

export interface PlanSession {
  sessionId: string;
  week: number;
  session: number;
  description: string;
  type: 'endurance' | 'fractionné' | 'test' | 'autre';
}

class RunningPlanService {
  private basePath = '/running-plan';

  async getPlan(): Promise<{ sessions: PlanSession[]; doneIds: string[] }> {
    return api.get<{ sessions: PlanSession[]; doneIds: string[] }>(this.basePath);
  }

  async setDone(sessionId: string, done: boolean): Promise<{ sessionId: string; done: boolean }> {
    return api.patch<{ sessionId: string; done: boolean }>(
      `${this.basePath}/${sessionId}`,
      { done }
    );
  }
}

export const runningPlanService = new RunningPlanService();

