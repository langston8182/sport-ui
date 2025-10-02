import { useCallback, useEffect, useState } from 'react';

interface ProgressState {
    done: Record<number, boolean>;
    updatedAt: number;
}

function storageKey(sessionId: string) {
    return `session-progress:${sessionId}`;
}

/**
 * Suivi de progression d'une séance côté client (sessionStorage).
 * - `done[index] = true` si l'exercice est entièrement terminé
 *   (toutes les séries faites pour les exercices en "reps", ou validé pour les autres).
 */
export function useSessionProgress(sessionId: string, itemsCount: number) {
    const key = storageKey(sessionId);
    const [progress, setProgress] = useState<ProgressState>({
        done: {},
        updatedAt: Date.now(),
    });

    // Charger depuis sessionStorage
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(key);
            if (!raw) return;
            const parsed = JSON.parse(raw) as ProgressState;
            setProgress({
                done: parsed.done ?? {},
                updatedAt: parsed.updatedAt ?? Date.now(),
            });
        } catch {
            // ignore
        }
    }, [key]);

    // Persister
    const persist = useCallback(
        (next: ProgressState) => {
            setProgress(next);
            sessionStorage.setItem(key, JSON.stringify(next));
        },
        [key]
    );

    // Basculer l'état d'un exercice
    const toggle = useCallback(
        (index: number) => {
            const nextDone = { ...progress.done, [index]: !progress.done[index] };
            persist({ done: nextDone, updatedAt: Date.now() });
        },
        [progress.done, persist]
    );

    // Tout valider/invalider
    const setAll = useCallback(
        (value: boolean) => {
            const nextDone: Record<number, boolean> = {};
            for (let i = 0; i < itemsCount; i++) nextDone[i] = value;
            persist({ done: nextDone, updatedAt: Date.now() });
        },
        [itemsCount, persist]
    );

    // Reset
    const reset = useCallback(() => {
        persist({ done: {}, updatedAt: Date.now() });
    }, [persist]);

    const completedCount = Object.values(progress.done).filter(Boolean).length;
    const isCompleted = itemsCount > 0 && completedCount === itemsCount;

    return { done: progress.done, toggle, setAll, reset, completedCount, isCompleted };
}