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
    blue: 'bg-gradient-to-br from-pastel-blue-100 to-pastel-blue-200 text-pastel-blue-700',
    green: 'bg-gradient-to-br from-pastel-green-100 to-pastel-green-200 text-pastel-green-700',
    orange: 'bg-gradient-to-br from-pastel-orange-100 to-pastel-orange-200 text-pastel-orange-700',
  };

  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <h1 className="text-5xl font-bold text-gradient-primary mb-4">Tableau de bord</h1>
        <p className="text-pastel-neutral-600 text-xl font-medium">Gérez vos exercices, sessions et programmes d'entraînement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cards.map(({ title, count, icon: Icon, to, color }) => (
          <Link
            key={title}
            to={to}
            className="card-pastel card-hover p-8 group slide-up"
            style={{ animationDelay: `${cards.indexOf(cards.find(c => c.title === title)!) * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-pastel-neutral-500 text-sm font-semibold mb-3 uppercase tracking-wider">{title}</p>
                <p className="text-4xl font-bold text-pastel-neutral-800 group-hover:text-pastel-blue-600 transition-colors duration-300">{count}</p>
                <p className="text-pastel-neutral-500 text-sm mt-2">élément{count > 1 ? 's' : ''}</p>
              </div>
              <div className={`w-16 h-16 rounded-2xl ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center shadow-soft group-hover:scale-110 group-hover:shadow-soft-lg transition-all duration-300`}>
                <Icon className="w-8 h-8" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card-pastel p-8 mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pastel-purple-400 to-pastel-purple-500 flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-pastel-neutral-800">Actions rapides</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {cards.map(({ title, createTo }) => (
            <Link
              key={createTo}
              to={createTo}
              className="flex items-center gap-4 p-6 border-2 border-dashed border-pastel-neutral-300/50 rounded-2xl hover:border-pastel-blue-400 hover:bg-gradient-to-br hover:from-pastel-blue-50 hover:to-pastel-purple-50/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-pastel-neutral-100 group-hover:bg-pastel-blue-100 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <Plus className="w-6 h-6 text-pastel-neutral-400 group-hover:text-pastel-blue-600" />
              </div>
              <div>
                <span className="text-pastel-neutral-700 group-hover:text-pastel-blue-700 font-semibold block">
                  Nouveau {title.slice(0, -1).toLowerCase()}
                </span>
                <span className="text-pastel-neutral-500 text-sm">
                  Créer rapidement
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}