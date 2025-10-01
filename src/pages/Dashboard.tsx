import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, ListChecks, CalendarDays, Plus } from 'lucide-react';
import { exercisesService } from '../services/exercises';
import { sessionsService } from '../services/sessions';
import { programsService } from '../services/programs';
import { Loader } from '../components/ui/Loader';

export function Dashboard() {
  const [counts, setCounts] = useState({
    exercises: 0,
    sessions: 0,
    programs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [exercises, sessions, programs] = await Promise.all([
          exercisesService.getAll(),
          sessionsService.getAll(),
          programsService.getAll(),
        ]);

        setCounts({
          exercises: Array.isArray(exercises) ? exercises.length : 0,
          sessions: Array.isArray(sessions) ? sessions.length : 0,
          programs: Array.isArray(programs) ? programs.length : 0,
        });
      } catch (error) {
        console.error('Failed to fetch counts:', error);
        setCounts({ exercises: 0, sessions: 0, programs: 0 });
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
  ];

  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700',
    green: 'bg-gradient-to-br from-emerald-100 to-green-200 text-emerald-700',
    orange: 'bg-gradient-to-br from-orange-100 to-amber-200 text-orange-700',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">Tableau de bord</h1>
        <p className="text-gray-600 text-lg">Gérez vos exercices, sessions et programmes d'entraînement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map(({ title, count, icon: Icon, to, color }) => (
          <Link
            key={title}
            to={to}
            className="card-gradient card-hover rounded-2xl p-8 group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wide">{title}</p>
                <p className="text-4xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{count}</p>
              </div>
              <div className={`w-16 h-16 rounded-2xl ${colorClasses[color]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="w-8 h-8" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card-gradient rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map(({ title, icon: Icon, createTo }) => (
            <Link
              key={createTo}
              to={createTo}
              className="flex items-center gap-4 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
              </div>
              <span className="text-gray-700 group-hover:text-blue-600 font-semibold">
                Nouveau {title.slice(0, -1).toLowerCase()}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}