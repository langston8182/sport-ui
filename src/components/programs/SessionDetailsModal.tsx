import { Session, Exercise } from '../../types';
import { Modal } from '../ui/Modal';
import { getResponsiveImageUrl, getResponsiveImageSrcSet } from '../../services/imageUpload';

interface SessionDetailsModalProps {
    isOpen: boolean;
    session: Session | null;
    exercises: Record<string, Exercise>;
    onClose: () => void;
}

export function SessionDetailsModal({
                                        isOpen,
                                        session,
                                        exercises,
                                        onClose,
                                    }: SessionDetailsModalProps) {
    // ne rien afficher si le modal est fermé ou si aucune session n’est sélectionnée
    if (!isOpen || !session) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={session.name} size="lg">
            <div className="space-y-6">
                <p className="text-sm text-gray-600">
                    {session.items.length} {session.items.length === 1 ? 'exercise' : 'exercises'}
                </p>
                {session.items.length === 0 ? (
                    <p className="text-gray-500">No exercises in this session</p>
                ) : (
                    <div className="space-y-3">
                        {session.items.map((item, index) => {
                            const exercise = exercises[item.exerciseId];
                            if (!exercise) {
                                return (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <p className="text-sm text-gray-500">Unknown exercise</p>
                                    </div>
                                );
                            }
                            return (
                                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-start gap-4">
                                        <img
                                            src={getResponsiveImageUrl(exercise.imageKeyOriginal)}
                                            srcSet={getResponsiveImageSrcSet(exercise.imageKeyOriginal)}
                                            sizes="64px"
                                            alt={exercise.name}
                                            className="w-16 h-16 object-cover rounded-lg"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900 mb-3">{exercise.name}</h3>
                                            {exercise.mode === 'reps' ? (
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1">Sets</label>
                                                        <p className="text-gray-900 font-semibold">{item.sets || 3}</p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1">Reps</label>
                                                        <p className="text-gray-900 font-semibold">{item.reps || 10}</p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1">Rest (sec)</label>
                                                        <p className="text-gray-900 font-semibold">{item.restSec}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1">Duration (sec)</label>
                                                        <p className="text-gray-900 font-semibold">{item.durationSec || 30}</p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1">Rest (sec)</label>
                                                        <p className="text-gray-900 font-semibold">{item.restSec}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {item.notes && (
                                                <div className="mt-3">
                                                    <label className="block text-xs text-gray-600 mb-1">Notes</label>
                                                    <p className="text-gray-700 text-sm">{item.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Modal>
    );
}