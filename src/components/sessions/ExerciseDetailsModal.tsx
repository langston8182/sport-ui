import { Exercise, SessionItem } from '../../types';
import { Modal } from '../ui/Modal';
import {
    getResponsiveImageUrl,
    getResponsiveImageSrcSet,
} from '../../services/imageUpload';

interface ExerciseDetailsModalProps {
    isOpen: boolean;
    exercise: Exercise;
    sessionItem: SessionItem;
    onClose: () => void;
}

export function ExerciseDetailsModal({
                                         isOpen,
                                         exercise,
                                         sessionItem,
                                         onClose,
                                     }: ExerciseDetailsModalProps) {
    if (!isOpen) return null;

    const isReps = exercise.mode === 'reps';
    const sets = sessionItem.sets || 1;
    const reps = sessionItem.reps || 10;
    const duration = sessionItem.durationSec || 30;
    const rest = sessionItem.restSec || 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={exercise.name} size="lg">
            <div className="space-y-6">
                {/* Image */}
                <div className="w-full">
                    <img
                        src={getResponsiveImageUrl(exercise.imageKeyOriginal)}
                        srcSet={getResponsiveImageSrcSet(exercise.imageKeyOriginal)}
                        alt={exercise.name}
                        className="w-full h-56 object-cover rounded-xl border border-gray-200"
                    />
                </div>

                {/* Résumé */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {isReps ? (
                        <>
                            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                <div className="text-xs text-gray-600 mb-1">Séries</div>
                                <div className="text-lg font-semibold text-gray-900">{sets}</div>
                            </div>
                            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                <div className="text-xs text-gray-600 mb-1">Répétitions</div>
                                <div className="text-lg font-semibold text-gray-900">{reps}</div>
                            </div>
                            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                <div className="text-xs text-gray-600 mb-1">Repos (sec)</div>
                                <div className="text-lg font-semibold text-gray-900">{rest}</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                <div className="text-xs text-gray-600 mb-1">Durée (sec)</div>
                                <div className="text-lg font-semibold text-gray-900">{duration}</div>
                            </div>
                            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                <div className="text-xs text-gray-600 mb-1">Repos (sec)</div>
                                <div className="text-lg font-semibold text-gray-900">{rest}</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Description */}
                {exercise.description && (
                    <div>
                        <div className="text-sm text-gray-600 mb-1">Description</div>
                        <p className="text-gray-800 whitespace-pre-line">{exercise.description}</p>
                    </div>
                )}

                {/* Notes de séance */}
                {sessionItem.notes && (
                    <div>
                        <div className="text-sm text-gray-600 mb-1">Notes de séance</div>
                        <p className="text-gray-800 whitespace-pre-line">{sessionItem.notes}</p>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default ExerciseDetailsModal;