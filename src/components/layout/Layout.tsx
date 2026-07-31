import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar, BottomNav } from './Sidebar';
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

  const isUrgent = restTimer ? restTimer.timeLeft <= 10 && restTimer.timeLeft > 0 : false;
  const isDone = restTimer?.timeLeft === 0;
  const progress = restTimer ? restTimer.timeLeft / restTimer.totalTime : 0;
  const circumference = 2 * Math.PI * 52;

  return (
    <div className="min-h-screen bg-[#f4f5fb]">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 p-5 md:p-8 w-full fade-in ${restTimer?.isMinimized ? 'pb-40 md:pb-32' : 'pb-20 md:pb-0'}`}>
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* ── Rest timer modal ── */}
      {restTimer && !restTimer.isMinimized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(6px)' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-sm text-center animate-scale-in">

            {/* Header strip */}
            <div className={`-mx-6 sm:-mx-8 -mt-6 sm:-mt-8 px-6 sm:px-8 py-4 rounded-t-3xl mb-6 ${
              isDone ? 'bg-sport-500' : isUrgent ? 'bg-rose-500' : 'bg-brand-600'
            }`}>
              <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">Temps de repos</p>
              <h3 className="text-white font-display font-bold text-lg leading-tight mt-0.5 break-words">
                {restTimer.exerciseName}
              </h3>
              <p className="text-white/70 text-xs mt-0.5">Série {restTimer.setNumber} terminée</p>
            </div>

            {/* Timer ring */}
            <div className="relative w-36 h-36 mx-auto mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" stroke="currentColor" strokeWidth="7"
                        fill="none" className="text-gray-100" />
                <circle cx="60" cy="60" r="52" stroke="currentColor" strokeWidth="7"
                        fill="none" strokeLinecap="round"
                        className={`transition-all duration-1000 ${
                          isDone ? 'text-sport-500' : isUrgent ? 'text-rose-500' : 'text-brand-500'
                        }`}
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * progress} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-display font-black tabular-nums leading-none ${
                  isDone ? 'text-sport-500' : isUrgent ? 'text-rose-500' : 'text-brand-600'
                }`}>
                  {formatTime(restTimer.timeLeft)}
                </span>
                {isDone && <span className="text-sport-500 text-xs font-bold mt-1">Terminé !</span>}
                {isUrgent && <span className="text-rose-500 text-xs font-bold mt-1 animate-pulse">Prêt !</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {restTimer.timeLeft > 0 && (
                <button onClick={minimizeRestTimer} className="btn-primary w-full">
                  Minimiser
                </button>
              )}
              {isDone && (
                <button onClick={stopRestTimer} className="btn-success w-full">
                  Continuer l'entraînement →
                </button>
              )}
              <button onClick={stopRestTimer} className="btn-ghost w-full text-gray-400">
                Ignorer le repos
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />

      {/* ── Rest timer minimized bar ── */}
      {restTimer && restTimer.isMinimized && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 px-4 py-3">
          <div className="mx-auto max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-card-hover p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isUrgent ? 'bg-rose-500' : 'bg-brand-600'
            }`}>
              <span className={`text-sm font-display font-black text-white tabular-nums`}>
                {formatTime(restTimer.timeLeft)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-none">Repos en cours</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {restTimer.exerciseName} · Série {restTimer.setNumber}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={expandRestTimer} className="btn-primary py-2 px-4 text-xs">Ouvrir</button>
              <button onClick={stopRestTimer} className="btn-ghost py-2 px-3 text-xs">Ignorer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}