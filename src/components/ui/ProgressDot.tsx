import { Check } from 'lucide-react';

interface ProgressDotProps {
    completed: boolean;
    onClick: () => void;
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    showCheck?: boolean;
}

export function ProgressDot({ 
    completed, 
    onClick, 
    size = 'md', 
    label, 
    showCheck = true 
}: ProgressDotProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    const iconSizes = {
        sm: 'w-2.5 h-2.5',
        md: 'w-3.5 h-3.5',
        lg: 'w-5 h-5'
    };

    return (
        <button
            onClick={onClick}
            className={`
                relative group transition-all duration-300 ease-out
                ${sizeClasses[size]}
                ${completed 
                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/25' 
                    : 'bg-white border-2 border-gray-300 hover:border-gray-400 shadow-sm'
                }
                rounded-full flex items-center justify-center
                hover:scale-110 hover:shadow-lg
                ${completed ? 'hover:shadow-emerald-500/40' : 'hover:shadow-gray-500/20'}
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-1
            `}
            aria-label={label}
            title={label}
        >
            {/* Inner circle with subtle animation */}
            <div className={`
                transition-all duration-300 ease-out
                ${completed 
                    ? 'scale-100 opacity-100' 
                    : 'scale-0 opacity-0'
                }
            `}>
                {showCheck ? (
                    <Check className={`${iconSizes[size]} text-white`} strokeWidth={3} />
                ) : (
                    <div className={`
                        ${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'}
                        bg-white rounded-full
                    `} />
                )}
            </div>

            {/* Ripple effect on click */}
            <div className={`
                absolute inset-0 rounded-full
                ${completed ? 'bg-emerald-400' : 'bg-gray-400'}
                opacity-0 group-active:opacity-30 group-active:scale-150
                transition-all duration-200 ease-out
            `} />

            {/* Subtle glow for completed state */}
            {completed && (
                <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-20 blur-sm scale-150" />
            )}
        </button>
    );
}