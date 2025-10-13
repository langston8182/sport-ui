import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, ListChecks, CalendarDays, Plus, Clock, Timer, Scale } from 'lucide-react';
import { exercisesService } from '../services/exercises';
import { sessionsService } from '../services/sessions';
import { programsService } from '../services/programs';
import { weightsService } from '../services/weights';
import { Loader } from '../components/ui/Loader';

export function Dashboard() {
  const [counts, setCounts] = useState({
    exercises: 0,
    sessions: 0,
    programs: 0,
    weights: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [exercises, sessions, programs, weights] = await Promise.all([
          exercisesService.getAll(),
          sessionsService.getAll(),
          programsService.getAll(),
          weightsService.getAll(),
        ]);

        setCounts({
          exercises: Array.isArray(exercises) ? exercises.length : 0,
          sessions: Array.isArray(sessions) ? sessions.length : 0,
          programs: Array.isArray(programs) ? programs.length : 0,
          weights: Array.isArray(weights) ? weights.length : 0,
        });
      } catch (error) {
        console.error('Failed to fetch counts:', error);
        setCounts({ exercises: 0, sessions: 0, programs: 0, weights: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  if (loading) {
    return <Loader />;
  }

  const cards = [
    {
      title: 'Exercises',
      count: counts.exercises,
      icon: Dumbbell,
      to: '/exercises',
      createTo: '/exercises/new',
      color: 'blue',
    },
    {
      title: 'Sessions',
      count: counts.sessions,
      icon: ListChecks,
      to: '/sessions',
      createTo: '/sessions/new',
      color: 'green',
    },
    {
      title: 'Programs',
      count: counts.programs,
      icon: CalendarDays,
      to: '/programs',
      createTo: '/programs/new',
      color: 'orange',
    },
    {
      title: 'Suivi de poids',
      count: counts.weights,
      icon: Scale,
      to: '/weight',
      createTo: '/weight',
      color: 'purple',
    },
  ];

  const colorClasses = {
    blue: 'bg-gradient-to-br from-pastel-blue-100 to-pastel-blue-200 text-pastel-blue-700',
    green: 'bg-gradient-to-br from-pastel-green-100 to-pastel-green-200 text-pastel-green-700',
    orange: 'bg-gradient-to-br from-pastel-orange-100 to-pastel-orange-200 text-pastel-orange-700',
    purple: 'bg-gradient-to-br from-pastel-purple-100 to-pastel-purple-200 text-pastel-purple-700',
  };

  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <h1 className="text-5xl font-bold text-gradient-primary mb-4">Tableau de bord</h1>
        <p className="text-pastel-neutral-600 text-xl font-medium">Gérez vos exercices, sessions et programmes d'entraînement</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {cards.map(({ title, count, icon: Icon, to, color }) => (
          <Link
            key={title}
            to={to}
            className="card-pastel card-hover p-4 md:p-8 group slide-up"
            style={{ animationDelay: `${cards.indexOf(cards.find(c => c.title === title)!) * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-pastel-neutral-500 text-xs md:text-sm font-semibold mb-2 md:mb-3 uppercase tracking-wider">{title}</p>
                <p className="text-2xl md:text-4xl font-bold text-pastel-neutral-800 group-hover:text-pastel-blue-600 transition-colors duration-300">{count}</p>
                <p className="text-pastel-neutral-500 text-xs md:text-sm mt-1 md:mt-2">élément{count > 1 ? 's' : ''}</p>
              </div>
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center shadow-soft group-hover:scale-110 group-hover:shadow-soft-lg transition-all duration-300`}>
                <Icon className="w-6 h-6 md:w-8 md:h-8" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card-pastel p-4 md:p-8 mt-6 md:mt-8">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-pastel-purple-400 to-pastel-purple-500 flex items-center justify-center">
            <Plus className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <h2 className="text-lg md:text-2xl font-bold text-pastel-neutral-800">Actions rapides</h2>
        </div>
        
        <div className="grid grid-cols-3 gap-1.5 md:gap-4 lg:gap-6">
          {cards.filter(card => card.title !== 'Suivi de poids').map(({ title, createTo }) => (
            <Link
              key={createTo}
              to={createTo}
              className="flex flex-col items-center gap-1.5 md:gap-2 p-2 md:p-4 lg:p-6 border border-dashed border-pastel-neutral-300/50 rounded-md md:rounded-xl lg:rounded-2xl hover:border-pastel-blue-400 hover:bg-gradient-to-br hover:from-pastel-blue-50 hover:to-pastel-purple-50/50 transition-all duration-300 group"
            >
              <div className="w-6 h-6 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-sm md:rounded-lg lg:rounded-xl bg-pastel-neutral-100 group-hover:bg-pastel-blue-100 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <Plus className="w-3 h-3 md:w-5 md:h-5 lg:w-6 lg:h-6 text-pastel-neutral-400 group-hover:text-pastel-blue-600" />
              </div>
              <div className="text-center">
                <span className="text-pastel-neutral-700 group-hover:text-pastel-blue-700 font-medium block text-xs md:text-sm lg:text-base leading-tight">
                  {title.slice(0, -1)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="card-pastel p-8 mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pastel-orange-400 to-pastel-red-400 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-pastel-neutral-800">Outils d'entraînement</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Link
            to="/timer"
            className="flex items-center gap-3 md:gap-4 p-4 md:p-6 bg-gradient-to-br from-pastel-blue-50 to-pastel-blue-100 rounded-xl md:rounded-2xl hover:from-pastel-blue-100 hover:to-pastel-blue-200 transition-all duration-300 group border border-pastel-blue-200/50"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-pastel-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <span className="text-pastel-blue-700 font-semibold block text-base md:text-lg">
                Chronomètre
              </span>
              <span className="text-pastel-blue-600 text-xs md:text-sm">
                Chronométrage et compte à rebours
              </span>
            </div>
          </Link>
          
          <Link
            to="/timer/tabata"
            className="flex items-center gap-3 md:gap-4 p-4 md:p-6 bg-gradient-to-br from-pastel-orange-50 to-pastel-red-50 rounded-xl md:rounded-2xl hover:from-pastel-orange-100 hover:to-pastel-red-100 transition-all duration-300 group border border-pastel-orange-200/50"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-r from-pastel-orange-500 to-pastel-red-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
              <Timer className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <span className="text-pastel-orange-700 font-semibold block text-base md:text-lg">
                Tabata Timer
              </span>
              <span className="text-pastel-orange-600 text-xs md:text-sm">
                Entraînement par intervalles
              </span>
            </div>
          </Link>
          
          <Link
            to="/weight"
            className="flex items-center gap-3 md:gap-4 p-4 md:p-6 bg-gradient-to-br from-pastel-purple-50 to-pastel-purple-100 rounded-xl md:rounded-2xl hover:from-pastel-purple-100 hover:to-pastel-purple-200 transition-all duration-300 group border border-pastel-purple-200/50"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-r from-pastel-purple-500 to-pastel-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
              <Scale className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <span className="text-pastel-purple-700 font-semibold block text-base md:text-lg">
                Suivi de poids
              </span>
              <span className="text-pastel-purple-600 text-xs md:text-sm">
                Suivez votre progression
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}