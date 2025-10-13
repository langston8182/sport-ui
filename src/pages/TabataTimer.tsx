import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, ArrowLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TabataTimer() {
    const navigate = useNavigate();
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-2 sm:py-4 md:py-8 px-2 sm:px-4">
            <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2X2/LFeSsFLIHO8tiJNwgZaLvt55" />

            <div className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto">
                <div className="flex flex-col gap-3 mb-4 sm:mb-6 md:mb-8">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm">Retour</span>
                        </button>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                            <Settings className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                            Tabata Timer
                        </h1>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/timer')}
                                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg text-sm sm:text-base"
                            >
                                <Clock className="w-4 h-4" />
                                <span>Chronomètre</span>
                            </button>
                        </div>
                    </div>
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

                <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-lg sm:shadow-2xl p-3 sm:p-4 md:p-6 lg:p-8 relative overflow-hidden">
                    <div
                        className={`absolute inset-0 transition-all duration-1000 ${
                            isResting ? 'bg-green-100' : 'bg-blue-100'
                        }`}
                        style={{ opacity: 0.3 }}
                    />

                    <div className="relative z-10">
                        <div className="text-center mb-4 sm:mb-6 md:mb-8">
                            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                                Round {currentRound} / {rounds}
                            </div>
                            <div
                                className={`text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-4 ${
                                    isResting ? 'text-green-600' : 'text-blue-600'
                                }`}
                            >
                                {isResting ? 'REPOS' : 'TRAVAIL'}
                            </div>
                        </div>

                        <div className="relative w-32 h-32 xs:w-40 xs:h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 mx-auto mb-4 sm:mb-6 md:mb-8">
                            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 120 120">
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="54"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                    className="text-gray-200"
                                />
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="54"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeDasharray={`${2 * Math.PI * 54}`}
                                    strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                                    className={`transition-all duration-1000 ${
                                        isResting ? 'text-green-500' : 'text-blue-500'
                                    }`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-gray-900">{timeLeft}</div>
                            </div>
                        </div>

                        <div className="flex flex-col xs:flex-row justify-center gap-2 sm:gap-3 md:gap-4">
                            {!isRunning ? (
                                <button
                                    onClick={handleStart}
                                    className="flex items-center justify-center gap-2 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                                >
                                    <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                                    Démarrer
                                </button>
                            ) : (
                                <button
                                    onClick={handlePause}
                                    className="flex items-center justify-center gap-2 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg sm:rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                                >
                                    <Pause className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                                    Pause
                                </button>
                            )}
                            <button
                                onClick={handleReset}
                                className="flex items-center justify-center gap-2 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg sm:rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                            >
                                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                                <span className="hidden xs:inline">Réinitialiser</span>
                                <span className="xs:hidden">Reset</span>
                            </button>
                        </div>

                        <div className="mt-4 sm:mt-6 md:mt-8 grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-4 text-center">
                            <div className="p-2 sm:p-3 md:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                                <div className="text-xs text-gray-600 mb-0.5 sm:mb-1">Travail</div>
                                <div className="text-sm sm:text-lg md:text-2xl font-bold text-gray-900">{workTime}s</div>
                            </div>
                            <div className="p-2 sm:p-3 md:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                                <div className="text-xs text-gray-600 mb-0.5 sm:mb-1">Repos</div>
                                <div className="text-sm sm:text-lg md:text-2xl font-bold text-gray-900">{restTime}s</div>
                            </div>
                            <div className="p-2 sm:p-3 md:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                                <div className="text-xs text-gray-600 mb-0.5 sm:mb-1">Total</div>
                                <div className="text-sm sm:text-lg md:text-2xl font-bold text-gray-900">{rounds}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
