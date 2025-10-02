import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSessionProgress } from '../hooks/useSessionProgress';
import type { Session, Exercise, SessionItem } from '../types';
import ExerciseDetailsModal from '../components/sessions/ExerciseDetailsModal';
import { SetProgressIndicator } from '../components/ui/SetProgressIndicator';
import { ProgressDot } from '../components/ui/ProgressDot';

interface LocationState {
    session?: Session;
    exercises?: Record<string, Exercise>;
}

/**
 * Mode entraînement avec progression par série.
 * - Exercices "reps" avec plusieurs séries : affichage de pastilles par série.
 * - La ligne devient verte uniquement quand TOUTES les séries sont cochées.
 * - Données stockées en sessionStorage (pas d'appel backend).
 */
export default function SessionPlay() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation() as { state: LocationState };

    const session = location.state?.session;
    const exercises = location.state?.exercises || {};

    if (!id || !session) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Session indisponible</h1>
                <p className="text-gray-700 mb-4">
                    Ouvre d’abord la session (en ligne) depuis la liste pour la mettre en cache, puis relance le mode Lecture.
                </p>
                <button
                    onClick={() => navigate('/sessions')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Retour aux sessions
                </button>
            </div>
        );
    }

    // Suivi global "exercice terminé"
    const { done, toggle, setAll, reset, completedCount, isCompleted } =
        useSessionProgress(session.id, session.items.length);

    // Suivi fin par série (tableau de tableaux de booléens)
    const setsKey = `session-progress-sets:${session.id}`;
    const [setsProgress, setSetsProgress] = useState<boolean[][]>(() => {
        try {
            const raw = sessionStorage.getItem(setsKey);
            if (raw) return JSON.parse(raw);
        } catch {/* ignore */}
        return session.items.map((item) => {
            const sets = item.sets && item.sets > 0 ? item.sets : 0;
            return sets > 0 ? Array(sets).fill(false) : [];
        });
    });

    // ✅ Recalibrage des séries si le nombre change (ex: 3 → 4)
    useEffect(() => {
        setSetsProgress((prev) => {
            return session.items.map((item, i) => {
                const expected = Math.max(0, Number(item.sets || 0));
                const current = prev?.[i] ?? [];
                if (expected === 0) return [];
                if (current.length === expected) return current;

                const next = Array(expected).fill(false);
                for (let j = 0; j < Math.min(expected, current.length); j++) {
                    next[j] = current[j];
                }
                return next;
            });
        });
    }, [session.id, session.items]);

    // Persistance des séries
    useEffect(() => {
        sessionStorage.setItem(setsKey, JSON.stringify(setsProgress));
    }, [setsKey, setsProgress]);

    // Basculer l'état d'une série
    const handleToggleSetDone = (exerciseIndex: number, setIndex: number) => {
        setSetsProgress((prev) => {
            const next = prev.map((arr, i) => {
                if (i !== exerciseIndex) return arr;
                const copy = [...arr];
                copy[setIndex] = !copy[setIndex];
                return copy;
            });
            const allSetsDone = next[exerciseIndex].every(Boolean);
            if (allSetsDone && !done[exerciseIndex]) {
                toggle(exerciseIndex); // passe l'exercice en "terminé"
            } else if (!allSetsDone && done[exerciseIndex]) {
                toggle(exerciseIndex); // revient à "non terminé"
            }
            return next;
        });
    };

    // Modal de détails d'exercice
    const [showModal, setShowModal] = useState(false);
    const [modalExercise, setModalExercise] = useState<Exercise | null>(null);
    const [modalItem, setModalItem] = useState<SessionItem | null>(null);

    const openExerciseModal = (index: number) => {
        const item = session.items[index];
        const ex = exercises[item.exerciseId];
        if (!ex) return;
        setModalItem(item);
        setModalExercise(ex);
        setShowModal(true);
    };

    const closeExerciseModal = () => {
        setShowModal(false);
        setModalItem(null);
        setModalExercise(null);
    };

    const formatSummary = (item: SessionItem, ex?: Exercise) => {
        if (!ex) return '';
        if (ex.mode === 'reps') {
            const sets = item.sets || 1;
            const reps = item.reps || 10;
            return `${sets} × ${reps} reps`;
        }
        const duration = item.durationSec || 30;
        return `${duration}s`;
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                    {session.name}
                </h1>
                <div className="flex gap-2">
                    <button
                        className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200"
                        onClick={() => {
                            reset();
                            // réinitialise aussi les séries
                            setSetsProgress(
                                session.items.map((item) => {
                                    const s = Math.max(0, Number(item.sets || 0));
                                    return s > 0 ? Array(s).fill(false) : [];
                                })
                            );
                        }}
                    >
                        Réinitialiser
                    </button>
                    <button
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => {
                            setAll(true);
                            setSetsProgress(
                                session.items.map((item) => {
                                    const s = Math.max(0, Number(item.sets || 0));
                                    return s > 0 ? Array(s).fill(true) : [];
                                })
                            );
                        }}
                    >
                        Tout valider
                    </button>
                </div>
            </div>

            {/* Compteur */}
            <div className="mb-4 text-gray-700">
                {completedCount}/{session.items.length} exercices validés
                {isCompleted && (
                    <span className="ml-2 text-emerald-700 font-semibold">Séance terminée 🎉</span>
                )}
            </div>

            {/* Liste des exercices */}
            <ul className="space-y-3">
                {session.items.map((item, index) => {
                    const ex = exercises[item.exerciseId];
                    const isReps = ex?.mode === 'reps';
                    const multipleSets = isReps && (item.sets || 1) > 1;

                    const rowClasses = done[index]
                        ? 'bg-gradient-to-r from-emerald-50 to-emerald-50/80 border border-emerald-200 shadow-sm'
                        : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md';

                    return (
                        <li
                            key={index}
                            className={`
                                p-5 rounded-xl ${rowClasses} 
                                flex items-center justify-between cursor-pointer
                                transition-all duration-300 ease-out
                                hover:scale-[1.02] hover:shadow-lg
                                ${done[index] ? 'hover:shadow-emerald-500/10' : 'hover:shadow-gray-500/10'}
                            `}
                            onClick={() => openExerciseModal(index)}
                        >
                            <div className="pr-4">
                                <div className="font-medium text-gray-900">
                                    {ex ? ex.name : `Exercice #${index + 1}`}
                                </div>
                                <div className="text-gray-600 text-sm">
                                    {formatSummary(item, ex)}
                                </div>
                                {item.restSec ? (
                                    <div className="text-gray-600 text-sm">Repos {item.restSec}s</div>
                                ) : null}
                                {item.notes && (
                                    <div className="text-gray-500 italic text-sm mt-1">{item.notes}</div>
                                )}
                            </div>

                            {/* Validation */}
                            <div onClick={(e) => e.stopPropagation()}>
                                {multipleSets ? (
                                    <SetProgressIndicator
                                        setsCompleted={setsProgress[index]}
                                        onToggleSet={(setIndex) => handleToggleSetDone(index, setIndex)}
                                        exerciseName={ex ? ex.name : `Exercice #${index + 1}`}
                                    />
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <ProgressDot
                                            completed={!!done[index]}
                                            onClick={() => toggle(index)}
                                            size="lg"
                                            label={`${ex ? ex.name : `Exercice #${index + 1}`} - Terminé`}
                                            showCheck={true}
                                        />
                                        <span className="text-sm text-gray-700 font-medium">
                                            {done[index] ? 'Terminé' : 'À faire'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            {/* Modale de détails */}
            {showModal && modalExercise && modalItem && (
                <ExerciseDetailsModal
                    isOpen={showModal}
                    exercise={modalExercise}
                    sessionItem={modalItem}
                    onClose={closeExerciseModal}
                />
            )}
        </div>
    );
}