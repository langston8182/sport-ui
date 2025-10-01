import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

export default function TabataTimer() {
    const [workTime, setWorkTime] = useState(20);
    const [restTime, setRestTime] = useState(10);
    const [rounds, setRounds] = useState(8);
    const [currentRound, setCurrentRound] = useState(1);
    const [timeLeft, setTimeLeft] = useState(workTime);
    const [isRunning, setIsRunning] = useState(false);
    const [isResting, setIsResting] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (isRunning && timeLeft === 0) {
            playBeep();

            if (isResting) {
                if (currentRound < rounds) {
                    setCurrentRound((r) => r + 1);
                    setTimeLeft(workTime);
                    setIsResting(false);
                } else {
                    setIsRunning(false);
                    setTimeLeft(workTime);
                    setIsResting(false);
                    setCurrentRound(1);
                }
            } else {
                setTimeLeft(restTime);
                setIsResting(true);
            }
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, timeLeft, isResting, workTime, restTime, rounds, currentRound]);

    const playBeep = () => {
        if (audioRef.current) {
            audioRef.current.play();
        }
    };

    const handleStart = () => {
        setIsRunning(true);
    };

    const handlePause = () => {
        setIsRunning(false);
    };

    const handleReset = () => {
        setIsRunning(false);
        setCurrentRound(1);
        setTimeLeft(workTime);
        setIsResting(false);
    };

    const handleSettingsChange = (newWorkTime: number, newRestTime: number, newRounds: number) => {
        setWorkTime(newWorkTime);
        setRestTime(newRestTime);
        setRounds(newRounds);
        setTimeLeft(newWorkTime);
        setCurrentRound(1);
        setIsResting(false);
        setIsRunning(false);
        setShowSettings(false);
    };

    const progress = isResting
        ? ((restTime - timeLeft) / restTime) * 100
        : ((workTime - timeLeft) / workTime) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
            <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt55" />

            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Chronomètre Tabata</h1>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    >
                        <Settings className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {showSettings && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Paramètres</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Temps de travail (secondes)
                                </label>
                                <input
                                    type="number"
                                    min="5"
                                    max="300"
                                    value={workTime}
                                    onChange={(e) => setWorkTime(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Temps de repos (secondes)
                                </label>
                                <input
                                    type="number"
                                    min="5"
                                    max="300"
                                    value={restTime}
                                    onChange={(e) => setRestTime(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre de rounds
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={rounds}
                                    onChange={(e) => setRounds(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                onClick={() => handleSettingsChange(workTime, restTime, rounds)}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                Appliquer
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-3xl shadow-2xl p-8 relative overflow-hidden">
                    <div
                        className={`absolute inset-0 transition-all duration-1000 ${
                            isResting ? 'bg-green-100' : 'bg-blue-100'
                        }`}
                        style={{ opacity: 0.3 }}
                    />

                    <div className="relative z-10">
                        <div className="text-center mb-8">
                            <div className="text-sm font-medium text-gray-600 mb-2">
                                Round {currentRound} / {rounds}
                            </div>
                            <div
                                className={`text-2xl font-bold mb-4 ${
                                    isResting ? 'text-green-600' : 'text-blue-600'
                                }`}
                            >
                                {isResting ? 'REPOS' : 'TRAVAIL'}
                            </div>
                        </div>

                        <div className="relative w-64 h-64 mx-auto mb-8">
                            <svg className="transform -rotate-90 w-64 h-64">
                                <circle
                                    cx="128"
                                    cy="128"
                                    r="120"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    className="text-gray-200"
                                />
                                <circle
                                    cx="128"
                                    cy="128"
                                    r="120"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${2 * Math.PI * 120}`}
                                    strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                                    className={`transition-all duration-1000 ${
                                        isResting ? 'text-green-500' : 'text-blue-500'
                                    }`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-7xl font-bold text-gray-900">{timeLeft}</div>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4">
                            {!isRunning ? (
                                <button
                                    onClick={handleStart}
                                    className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <Play className="w-6 h-6" />
                                    Démarrer
                                </button>
                            ) : (
                                <button
                                    onClick={handlePause}
                                    className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <Pause className="w-6 h-6" />
                                    Pause
                                </button>
                            )}
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <RotateCcw className="w-6 h-6" />
                                Réinitialiser
                            </button>
                        </div>

                        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="text-sm text-gray-600 mb-1">Travail</div>
                                <div className="text-2xl font-bold text-gray-900">{workTime}s</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="text-sm text-gray-600 mb-1">Repos</div>
                                <div className="text-2xl font-bold text-gray-900">{restTime}s</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="text-sm text-gray-600 mb-1">Total</div>
                                <div className="text-2xl font-bold text-gray-900">{rounds}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
