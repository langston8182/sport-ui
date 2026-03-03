import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useRestTimer } from '../../contexts/RestTimerContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { restTimer, stopRestTimer, expandRestTimer, minimizeRestTimer } = useRestTimer();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-blue-50 via-white to-pastel-purple-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full fade-in ${restTimer?.isMinimized ? 'pb-28 sm:pb-32' : ''}`}>
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {restTimer && !restTimer.isMinimized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-xs sm:max-w-sm text-center">
            <div className="mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Temps de repos</h3>
              <p className="text-gray-600 text-xs sm:text-sm break-words">
                {restTimer.exerciseName}
              </p>
              <p className="text-gray-500 text-xs">
                Série {restTimer.setNumber} terminée
              </p>
            </div>

            <div className="mb-4 sm:mb-6">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-mono font-bold text-blue-600 mb-3 sm:mb-4">
                {formatTime(restTimer.timeLeft)}
              </div>

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

            <div className="space-y-2 sm:space-y-3">
              {restTimer.timeLeft > 0 && (
                <button
                  onClick={minimizeRestTimer}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-base sm:text-lg"
                >
                  Minimiser le minuteur
                </button>
              )}

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

      {restTimer && restTimer.isMinimized && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4">
          <div className="mx-auto max-w-6xl bg-white border border-blue-200 rounded-xl shadow-2xl p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-semibold text-gray-900">Temps de repos en cours</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {restTimer.exerciseName} · Série {restTimer.setNumber}
                </p>
              </div>
              <span className={`text-2xl sm:text-3xl font-mono font-bold ${restTimer.timeLeft <= 10 ? 'text-red-500' : 'text-blue-600'}`}>
                {formatTime(restTimer.timeLeft)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={expandRestTimer}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-base sm:text-lg"
              >
                Ouvrir
              </button>
              <button
                onClick={stopRestTimer}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-base sm:text-lg"
              >
                Ignorer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}