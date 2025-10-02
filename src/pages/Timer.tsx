import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ArrowLeft, Timer as TimerIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Timer() {
    const navigate = useNavigate();
    const [time, setTime] = useState(0); // Temps en secondes
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState<'stopwatch' | 'countdown'>('stopwatch');
    const [countdownDuration, setCountdownDuration] = useState(300); // 5 minutes par défaut
    const [initialCountdown, setInitialCountdown] = useState(300);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRunning) {
            interval = setInterval(() => {
                if (mode === 'stopwatch') {
                    setTime((prevTime) => prevTime + 1);
                } else {
                    setTime((prevTime) => {
                        if (prevTime <= 1) {
                            setIsRunning(false);
                            playBeep();
                            return 0;
                        }
                        return prevTime - 1;
                    });
                }
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, mode]);

    const playBeep = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(() => {
                // Fallback si l'audio ne peut pas être joué
                console.log('Beep!');
            });
        }
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStart = () => {
        setIsRunning(true);
    };

    const handlePause = () => {
        setIsRunning(false);
    };

    const handleReset = () => {
        setIsRunning(false);
        if (mode === 'stopwatch') {
            setTime(0);
        } else {
            setTime(initialCountdown);
        }
    };

    const handleModeChange = (newMode: 'stopwatch' | 'countdown') => {
        setIsRunning(false);
        setMode(newMode);
        if (newMode === 'stopwatch') {
            setTime(0);
        } else {
            setTime(countdownDuration);
            setInitialCountdown(countdownDuration);
        }
    };

    const handleCountdownDurationChange = (minutes: number) => {
        const seconds = minutes * 60;
        setCountdownDuration(seconds);
        setInitialCountdown(seconds);
        if (!isRunning) {
            setTime(seconds);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pastel-blue-50 to-pastel-purple-50">
            <div className="max-w-lg mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Retour</span>
                        </button>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                            Chronomètre
                        </h1>
                    </div>
                    <button
                        onClick={() => navigate('/timer/tabata')}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-lg"
                    >
                        <TimerIcon className="w-4 h-4" />
                        <span>Tabata Timer</span>
                    </button>
                </div>

                {/* Mode Selector */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => handleModeChange('stopwatch')}
                            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                                mode === 'stopwatch'
                                    ? 'bg-gradient-to-r from-pastel-blue-500 to-pastel-purple-500 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Chronomètre
                        </button>
                        <button
                            onClick={() => handleModeChange('countdown')}
                            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                                mode === 'countdown'
                                    ? 'bg-gradient-to-r from-pastel-blue-500 to-pastel-purple-500 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Compte à rebours
                        </button>
                    </div>

                    {/* Countdown Duration Settings */}
                    {mode === 'countdown' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Durée (minutes)
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {[1, 2, 3, 5, 10, 15, 20, 30].map((minutes) => (
                                    <button
                                        key={minutes}
                                        onClick={() => handleCountdownDurationChange(minutes)}
                                        disabled={isRunning}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                            countdownDuration === minutes * 60
                                                ? 'bg-pastel-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {minutes}min
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timer Display */}
                    <div className="text-center mb-8">
                        <div className={`text-6xl font-mono font-bold mb-4 ${
                            mode === 'countdown' && time <= 10 && time > 0 
                                ? 'text-red-500 animate-pulse' 
                                : 'text-gray-800'
                        }`}>
                            {formatTime(time)}
                        </div>
                        
                        {mode === 'countdown' && (
                            <div className="text-sm text-gray-500">
                                {time === 0 ? 'Terminé !' : `${mode === 'countdown' ? 'Temps restant' : 'Temps écoulé'}`}
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-4">
                        {!isRunning ? (
                            <button
                                onClick={handleStart}
                                disabled={mode === 'countdown' && time === 0}
                                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <Play className="w-6 h-6" />
                                Démarrer
                            </button>
                        ) : (
                            <button
                                onClick={handlePause}
                                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                            >
                                <Pause className="w-6 h-6" />
                                Pause
                            </button>
                        )}
                        
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                        >
                            <RotateCcw className="w-6 h-6" />
                            Reset
                        </button>
                    </div>
                </div>

                {/* Progress Bar for Countdown */}
                {mode === 'countdown' && initialCountdown > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="mb-2 flex justify-between text-sm text-gray-600">
                            <span>Progression</span>
                            <span>{Math.round(((initialCountdown - time) / initialCountdown) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-pastel-blue-500 to-pastel-purple-500 h-3 rounded-full transition-all duration-1000"
                                style={{ width: `${((initialCountdown - time) / initialCountdown) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Audio element for beep */}
                <audio ref={audioRef}>
                    <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApOdyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXrTp66hVFApGn+DyvGMcBTeMz/LNeSsFJHfK8N2QQQsUXr" type="audio/wav" />
                </audio>
            </div>
        </div>
    );
}