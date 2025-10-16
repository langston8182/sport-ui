import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSessionProgress } from '../hooks/useSessionProgress';
import { useExerciseWeights } from '../hooks/useExerciseWeights';
import type { Session, Exercise, SessionItem } from '../types';
import ExerciseDetailsModal from '../components/sessions/ExerciseDetailsModal';
import { SetProgressIndicator } from '../components/ui/SetProgressIndicator';
import { ProgressDot } from '../components/ui/ProgressDot';
import { SetWeightInput } from '../components/sessions/SetWeightInput';



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
    
    // Hook pour gérer les poids d'exercices
    const {
        getWeightForSet,
        addWeight,
        removeWeight,
        isLoading: weightsLoading
    } = useExerciseWeights(session?.id || '');

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
                const wasCompleted = copy[setIndex];
                copy[setIndex] = !copy[setIndex];
                
                // Si on vient de compléter une série ET qu'il y a un temps de repos
                if (!wasCompleted && copy[setIndex]) {
                    const item = session.items[exerciseIndex];
                    const restTime = item.restSec || 0;
                    const totalSets = copy.length;
                    const completedSets = copy.filter(Boolean).length;
                    
                    // Démarrer le timer seulement si ce n'est pas la dernière série et qu'il y a un temps de repos
                    if (completedSets < totalSets && restTime > 0) {
                        startRestTimer(exerciseIndex, setIndex, restTime);
                    }
                }
                
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
    
    // Timer de repos
    const [restTimer, setRestTimer] = useState<{
        exerciseIndex: number;
        setIndex: number;
        timeLeft: number;
        totalTime: number;
        isActive: boolean;
    } | null>(null);
    const restTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    // Fonctions du timer de repos
    const startRestTimer = (exerciseIndex: number, setIndex: number, restTime: number) => {
        if (restTime > 0) {
            setRestTimer({
                exerciseIndex,
                setIndex,
                timeLeft: restTime,
                totalTime: restTime,
                isActive: true
            });
        }
    };

    const stopRestTimer = () => {
        setRestTimer(null);
        if (restTimerRef.current) {
            clearTimeout(restTimerRef.current);
            restTimerRef.current = null;
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
    };

    // Gestion du timer de repos
    useEffect(() => {
        if (restTimer && restTimer.isActive && restTimer.timeLeft > 0) {
            restTimerRef.current = setTimeout(() => {
                setRestTimer(prev => prev ? {
                    ...prev,
                    timeLeft: prev.timeLeft - 1
                } : null);
            }, 1000);
        } else if (restTimer && restTimer.timeLeft === 0) {
            // Timer terminé
            console.log('Temps de repos terminé !');
            setRestTimer(prev => prev ? { ...prev, isActive: false } : null);
            if (restTimerRef.current) {
                clearTimeout(restTimerRef.current);
                restTimerRef.current = null;
            }
        }
        
        return () => {
            if (restTimerRef.current) {
                clearTimeout(restTimerRef.current);
                restTimerRef.current = null;
            }
        };
    }, [restTimer]);

    // Fonction pour mettre à jour les notes d'un exercice


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
        <div className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-6">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
                {/* Title */}
                <div className="mb-3 sm:mb-4">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent break-words">
                        {session.name}
                    </h1>
                </div>
                
                {/* Action Buttons Row */}
                <div className="flex gap-2">
                    <button
                        className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors whitespace-nowrap"
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
                        className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors whitespace-nowrap"
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
            <div className="mb-3 sm:mb-4 text-sm sm:text-base text-gray-700">
                <span className="font-medium">{completedCount}/{session.items.length} exercices validés</span>
                {isCompleted && (
                    <span className="block sm:inline sm:ml-2 text-emerald-700 font-semibold mt-1 sm:mt-0">Séance terminée 🎉</span>
                )}
            </div>

            {/* Liste des exercices */}
            <ul className="space-y-2 sm:space-y-3">
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
                                p-3 sm:p-4 lg:p-5 rounded-lg sm:rounded-xl ${rowClasses} 
                                flex flex-col lg:flex-row gap-3 lg:gap-4 cursor-pointer
                                transition-all duration-300 ease-out
                                hover:scale-[1.01] sm:hover:scale-[1.02] hover:shadow-lg
                                ${done[index] ? 'hover:shadow-emerald-500/10' : 'hover:shadow-gray-500/10'}
                            `}
                            onClick={() => openExerciseModal(index)}
                        >
                            <div className="flex-1 lg:pr-4">
                                <div className="font-medium text-gray-900 text-sm sm:text-base">
                                    {ex ? ex.name : `Exercice #${index + 1}`}
                                </div>
                                <div className="text-gray-600 text-xs sm:text-sm mt-1">
                                    {formatSummary(item, ex)}
                                </div>
                                {item.restSec ? (
                                    <div className="text-gray-600 text-xs sm:text-sm">Repos {item.restSec}s</div>
                                ) : null}
                                
                                {/* Saisie de poids pour la série courante */}
                                {isReps && (
                                    <div className="mt-2 sm:mt-3" onClick={(e) => e.stopPropagation()}>
                                        {(() => {
                                            // Calculer quelle série est actuellement active
                                            const completedSets = multipleSets 
                                                ? setsProgress[index]?.filter(Boolean).length || 0 
                                                : (done[index] ? 1 : 0);
                                            const currentSetNumber = Math.min(completedSets + 1, item.sets || 1);
                                            const existingWeight = getWeightForSet(item.exerciseId, currentSetNumber);
                                            
                                            return (
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                                                        {multipleSets ? `Série ${currentSetNumber}:` : 'Charge:'}
                                                    </span>
                                                    <SetWeightInput
                                                        exerciseId={item.exerciseId}
                                                        sessionId={session.id}
                                                        setNumber={currentSetNumber}
                                                        defaultReps={item.reps || 0}
                                                        existingWeight={existingWeight}
                                                        onWeightSaved={addWeight}
                                                        onWeightDeleted={(weightId) => removeWeight(item.exerciseId, weightId)}
                                                        disabled={weightsLoading}
                                                    />
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}


                            </div>

                            {/* Validation */}
                            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 lg:self-center">
                                {multipleSets ? (
                                    <SetProgressIndicator
                                        setsCompleted={setsProgress[index]}
                                        onToggleSet={(setIndex) => handleToggleSetDone(index, setIndex)}
                                        exerciseName={ex ? ex.name : `Exercice #${index + 1}`}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3">
                                        <ProgressDot
                                            completed={!!done[index]}
                                            onClick={() => toggle(index)}
                                            size="lg"
                                            label={`${ex ? ex.name : `Exercice #${index + 1}`} - Terminé`}
                                            showCheck={true}
                                        />
                                        <span className="text-xs sm:text-sm text-gray-700 font-medium">
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

            {/* Timer de repos */}
            {restTimer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-xs sm:max-w-sm text-center">
                        <div className="mb-3 sm:mb-4">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Temps de repos</h3>
                            <p className="text-gray-600 text-xs sm:text-sm break-words">
                                {session.items[restTimer.exerciseIndex] && exercises[session.items[restTimer.exerciseIndex].exerciseId]?.name}
                            </p>
                            <p className="text-gray-500 text-xs">
                                Série {restTimer.setIndex + 1} terminée
                            </p>
                        </div>
                        
                        <div className="mb-4 sm:mb-6">
                            <div className="text-4xl sm:text-5xl lg:text-6xl font-mono font-bold text-blue-600 mb-3 sm:mb-4">
                                {formatTime(restTimer.timeLeft)}
                            </div>
                            
                            {/* Barre de progression circulaire */}
                            <div className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 mx-auto mb-3 sm:mb-4">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        className="text-gray-200"
                                    />
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeLinecap="round"
                                        className={`transition-all duration-1000 ${
                                            restTimer.timeLeft <= 10 ? 'text-red-500' : 'text-blue-500'
                                        }`}
                                        strokeDasharray={`${2 * Math.PI * 56}`}
                                        strokeDashoffset={`${2 * Math.PI * 56 * (restTimer.timeLeft / restTimer.totalTime)}`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`text-lg sm:text-xl lg:text-2xl font-bold ${
                                        restTimer.timeLeft <= 10 ? 'text-red-500' : 'text-blue-500'
                                    }`}>
                                        {Math.round((1 - restTimer.timeLeft / restTimer.totalTime) * 100)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <button
                                onClick={stopRestTimer}
                                className="flex-1 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                            >
                                Ignorer
                            </button>
                            {restTimer.timeLeft === 0 && (
                                <button
                                    onClick={stopRestTimer}
                                    className="flex-1 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm sm:text-base"
                                >
                                    Continuer
                                </button>
                            )}
                        </div>
                        
                        {restTimer.timeLeft <= 10 && restTimer.timeLeft > 0 && (
                            <p className="text-red-500 text-xs sm:text-sm mt-2 sm:mt-3 font-medium animate-pulse">
                                Préparez-vous !
                            </p>
                        )}
                        
                        {restTimer.timeLeft === 0 && (
                            <p className="text-green-600 text-sm sm:text-base lg:text-lg mt-2 sm:mt-3 font-bold animate-bounce">
                                🎉 Repos terminé !
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}