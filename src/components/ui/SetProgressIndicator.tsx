import { ProgressDot } from './ProgressDot';

interface SetProgressIndicatorProps {
    setsCompleted: boolean[];
    onToggleSet: (setIndex: number) => void;
    exerciseName: string;
}

export function SetProgressIndicator({ 
    setsCompleted, 
    onToggleSet, 
    exerciseName 
}: SetProgressIndicatorProps) {
    const totalSets = setsCompleted.length;
    const completedSets = setsCompleted.filter(Boolean).length;

    return (
        <div className="flex flex-col items-end gap-2">
            {/* Progress indicator */}
            <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-gray-600 mr-2">
                    {completedSets}/{totalSets}
                </span>
                <div className="flex gap-1.5">
                    {setsCompleted.map((completed, index) => (
                        <ProgressDot
                            key={index}
                            completed={completed}
                            onClick={() => onToggleSet(index)}
                            size="md"
                            label={`${exerciseName} - Série ${index + 1}`}
                            showCheck={true}
                        />
                    ))}
                </div>
            </div>
            
            {/* Subtle progress bar */}
            <div className="w-full max-w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }}
                />
            </div>
        </div>
    );
}