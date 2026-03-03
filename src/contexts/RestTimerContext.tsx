import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

interface RestTimerState {
  exerciseName: string;
  setNumber: number;
  timeLeft: number;
  totalTime: number;
  isActive: boolean;
  isMinimized: boolean;
}

interface StartRestTimerPayload {
  exerciseName: string;
  setNumber: number;
  restTime: number;
}

interface RestTimerContextType {
  restTimer: RestTimerState | null;
  startRestTimer: (payload: StartRestTimerPayload) => void;
  stopRestTimer: () => void;
  minimizeRestTimer: () => void;
  expandRestTimer: () => void;
}

const STORAGE_KEY = 'global-rest-timer';
const RestTimerContext = createContext<RestTimerContextType | undefined>(undefined);

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playRestFinishedSound = async () => {
    try {
      const AudioContextClass = window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const context = audioContextRef.current;
      if (context.state === 'suspended') {
        await context.resume();
      }

      const now = context.currentTime;
      const masterGain = context.createGain();
      masterGain.gain.setValueAtTime(0.32, now);
      masterGain.connect(context.destination);

      const melody = [1046.5, 1318.5, 1568, 2093];

      melody.forEach((frequency, index) => {
        const startAt = now + index * 0.14;
        const stopAt = startAt + 0.22;

        const leadOscillator = context.createOscillator();
        const leadGain = context.createGain();
        leadOscillator.type = 'triangle';
        leadOscillator.frequency.setValueAtTime(frequency, startAt);

        leadGain.gain.setValueAtTime(0.0001, startAt);
        leadGain.gain.exponentialRampToValueAtTime(0.24, startAt + 0.012);
        leadGain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

        leadOscillator.connect(leadGain);
        leadGain.connect(masterGain);
        leadOscillator.start(startAt);
        leadOscillator.stop(stopAt);

        const bodyOscillator = context.createOscillator();
        const bodyGain = context.createGain();
        bodyOscillator.type = 'sine';
        bodyOscillator.frequency.setValueAtTime(frequency / 2, startAt);

        bodyGain.gain.setValueAtTime(0.0001, startAt);
        bodyGain.gain.exponentialRampToValueAtTime(0.12, startAt + 0.01);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

        bodyOscillator.connect(bodyGain);
        bodyGain.connect(masterGain);
        bodyOscillator.start(startAt);
        bodyOscillator.stop(stopAt);
      });
    } catch (error) {
      console.error('Impossible de jouer la sonnerie de repos:', error);
    }
  };

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as RestTimerState;
      if (parsed && typeof parsed.timeLeft === 'number') {
        setRestTimer(parsed);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!restTimer) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(restTimer));
  }, [restTimer]);

  useEffect(() => {
    if (!restTimer || !restTimer.isActive || restTimer.timeLeft <= 0) {
      if (restTimer && restTimer.isActive && restTimer.timeLeft === 0) {
        playRestFinishedSound();
        setRestTimer((prev) => (prev ? { ...prev, isActive: false, isMinimized: false } : null));
      }
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRestTimer((prev) => {
        if (!prev) return null;
        return { ...prev, timeLeft: Math.max(prev.timeLeft - 1, 0) };
      });
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [restTimer]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, []);

  const startRestTimer = ({ exerciseName, setNumber, restTime }: StartRestTimerPayload) => {
    if (restTime <= 0) return;

    setRestTimer({
      exerciseName,
      setNumber,
      timeLeft: restTime,
      totalTime: restTime,
      isActive: true,
      isMinimized: false,
    });
  };

  const stopRestTimer = () => setRestTimer(null);

  const minimizeRestTimer = () => {
    setRestTimer((prev) => (prev ? { ...prev, isMinimized: true } : prev));
  };

  const expandRestTimer = () => {
    setRestTimer((prev) => (prev ? { ...prev, isMinimized: false } : prev));
  };

  return (
    <RestTimerContext.Provider value={{ restTimer, startRestTimer, stopRestTimer, minimizeRestTimer, expandRestTimer }}>
      {children}
    </RestTimerContext.Provider>
  );
}

export function useRestTimer() {
  const context = useContext(RestTimerContext);
  if (!context) {
    throw new Error('useRestTimer must be used within RestTimerProvider');
  }
  return context;
}
