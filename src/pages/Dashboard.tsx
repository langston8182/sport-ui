import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, ListChecks, CalendarDays, Plus, Clock, Timer, Scale } from 'lucide-react';
import { exercisesService } from '../services/exercises';
import { sessionsService } from '../services/sessions';
import { programsService } from '../services/programs';
import { weightsService } from '../services/weights';
import { Loader } from '../components/ui/Loader';
import { Program } from '../types';

const env = import.meta.env as Record<string, string | undefined>;
const DEFAULT_HOME_LATITUDE = 45.102417;
const DEFAULT_HOME_LONGITUDE = -0.385333;
const DEFAULT_HOME_RADIUS_METERS = 120;

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = env[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return undefined;
}

function hasEnvValue(key: string): boolean {
  const value = env[key];
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function parseEnvNumber(raw: string | undefined): number {
  if (!raw) return Number.NaN;
  return Number.parseFloat(raw.replace(',', '.'));
}

const HOME_PREFIX = (readEnv('VITE_HOME_PROGRAM_PREFIX', 'EXPO_PUBLIC_HOME_PROGRAM_PREFIX') || 'Maison')
  .trim()
  .toLowerCase();
const HOME_LATITUDE = parseEnvNumber(
  readEnv('VITE_HOME_LATITUDE', 'EXPO_PUBLIC_HOME_LATITUDE') ?? String(DEFAULT_HOME_LATITUDE)
);
const HOME_LONGITUDE = parseEnvNumber(
  readEnv('VITE_HOME_LONGITUDE', 'EXPO_PUBLIC_HOME_LONGITUDE') ?? String(DEFAULT_HOME_LONGITUDE)
);
const HOME_RADIUS_METERS = parseEnvNumber(
  readEnv('VITE_HOME_RADIUS_METERS', 'EXPO_PUBLIC_HOME_RADIUS_METERS') ?? String(DEFAULT_HOME_RADIUS_METERS)
);
const HOME_ENV_SOURCE =
  hasEnvValue('VITE_HOME_LATITUDE') && hasEnvValue('VITE_HOME_LONGITUDE')
    ? 'VITE_*'
    : (hasEnvValue('EXPO_PUBLIC_HOME_LATITUDE') && hasEnvValue('EXPO_PUBLIC_HOME_LONGITUDE')
      ? 'EXPO_PUBLIC_*'
      : 'fallback');

const CURRENT_PROGRAM_ID_KEY = 'currentProgramId';
const CURRENT_HOME_PROGRAM_ID_KEY = 'currentHomeProgramId';
const CURRENT_AWAY_PROGRAM_ID_KEY = 'currentAwayProgramId';
const LOCATION_CONTEXT_KEY = 'dashboardLocationContext';

type DetectResult = {
  value: boolean | null;
  error: string | null;
};

function readStoredLocationContext(): boolean | null {
  const raw = localStorage.getItem(LOCATION_CONTEXT_KEY);
  if (raw === 'home') return true;
  if (raw === 'away') return false;
  return null;
}

function storeLocationContext(value: boolean | null): void {
  if (value === true) {
    localStorage.setItem(LOCATION_CONTEXT_KEY, 'home');
    return;
  }

  if (value === false) {
    localStorage.setItem(LOCATION_CONTEXT_KEY, 'away');
    return;
  }

  localStorage.removeItem(LOCATION_CONTEXT_KEY);
}

function hasHomeCoordinates() {
  return Number.isFinite(HOME_LATITUDE) && Number.isFinite(HOME_LONGITUDE);
}

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function isHomeProgram(program: Program): boolean {
  return program.name.trim().toLowerCase().startsWith(HOME_PREFIX);
}

function resolveCurrentProgram(programs: Program[], isAtHome: boolean | null): Program | null {
  if (programs.length === 0) return null;

  const storedProgramId = localStorage.getItem(CURRENT_PROGRAM_ID_KEY);
  const storedHomeProgramId = localStorage.getItem(CURRENT_HOME_PROGRAM_ID_KEY);
  const storedAwayProgramId = localStorage.getItem(CURRENT_AWAY_PROGRAM_ID_KEY);

  if (isAtHome === null) {
    return (
      programs.find((program) => program.id === storedProgramId) ||
      programs[0] ||
      null
    );
  }

  const homePrograms = programs.filter((program) => isHomeProgram(program));
  const awayPrograms = programs.filter((program) => !isHomeProgram(program));
  const matchingPrograms = isAtHome
    ? (homePrograms.length > 0 ? homePrograms : programs)
    : (awayPrograms.length > 0 ? awayPrograms : programs);

  const preferredId = isAtHome ? storedHomeProgramId : storedAwayProgramId;

  return (
    matchingPrograms.find((program) => program.id === preferredId) ||
    matchingPrograms.find((program) => program.id === storedProgramId) ||
    matchingPrograms[0] ||
    null
  );
}

async function detectAtHome(): Promise<DetectResult> {
  if (!window.isSecureContext) {
    return {
      value: null,
      error: 'Geolocalisation bloquee: page non securisee (HTTPS requis, sauf localhost).',
    };
  }

  if (!hasHomeCoordinates()) {
    return {
      value: null,
      error: 'Coordonnees domicile manquantes (VITE_HOME_LATITUDE / VITE_HOME_LONGITUDE). Redemarre Expo avec cache vide apres modification des fichiers .env.',
    };
  }

  if (!navigator.geolocation) {
    return {
      value: null,
      error: 'Geolocalisation indisponible dans ce navigateur/conteneur.',
    };
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60000,
      });
    });

    const { latitude, longitude } = position.coords;
    const distanceMeters = haversineDistanceMeters(
      latitude,
      longitude,
      HOME_LATITUDE,
      HOME_LONGITUDE
    );

    return {
      value: distanceMeters <= HOME_RADIUS_METERS,
      error: null,
    };
  } catch (error) {
    const geoError = error as GeolocationPositionError;

    if (geoError?.code === 1) {
      return { value: null, error: 'Permission de geolocalisation refusee par le navigateur.' };
    }

    if (geoError?.code === 2) {
      return { value: null, error: 'Position indisponible (GPS/reseau).'};
    }

    if (geoError?.code === 3) {
      return { value: null, error: 'Detection de position trop longue (timeout).'};
    }

    return { value: null, error: 'Echec de geolocalisation (erreur inconnue).'};
  }
}

export function Dashboard() {
  const [counts, setCounts] = useState({
    exercises: 0,
    sessions: 0,
    programs: 0,
    weights: 0,
  });
  const [currentProgram, setCurrentProgram] = useState<Program | null>(null);
  const [isAtHome, setIsAtHome] = useState<boolean | null>(() => readStoredLocationContext());
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const locationContext = (() => {
    const geolocationAvailable = typeof navigator !== 'undefined' && !!navigator.geolocation;

    if (!hasHomeCoordinates()) {
      return {
        label: 'Position: domicile non configure',
        chipClass: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300/60',
      };
    }

    if (!geolocationAvailable) {
      return {
        label: 'Position: geolocalisation indisponible',
        chipClass: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300/60',
      };
    }

    if (isAtHome === true) {
      return {
        label: 'Position: maison',
        chipClass: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200/70',
      };
    }

    if (isAtHome === false) {
      return {
        label: 'Position: exterieur',
        chipClass: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200/70',
      };
    }

    return {
      label: 'Position: inconnue',
      chipClass: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200/70',
    };
  })();

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

        const programList = Array.isArray(programs) ? programs : [];
        const resolvedCurrentProgram = resolveCurrentProgram(programList, isAtHome);

        setCurrentProgram(resolvedCurrentProgram);
      } catch (error) {
        console.error('Failed to fetch counts:', error);
        setCounts({ exercises: 0, sessions: 0, programs: 0, weights: 0 });
        setCurrentProgram(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [isAtHome]);

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    setLocationError(null);

    const result = await detectAtHome();
    setIsAtHome(result.value);
    storeLocationContext(result.value);
    setLocationError(result.error);
    setDetectingLocation(false);
  };

  useEffect(() => {
    void handleDetectLocation();
  }, []);

  const setManualLocationContext = (value: boolean) => {
    setIsAtHome(value);
    storeLocationContext(value);
  };

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
        <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-pastel-purple-400 to-pastel-purple-500 flex items-center justify-center">
              <Plus className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <h2 className="text-lg md:text-2xl font-bold text-pastel-neutral-800">Actions rapides</h2>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void handleDetectLocation()}
              disabled={detectingLocation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-fit"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {detectingLocation ? 'Détection...' : (isAtHome === null ? 'Détecter ma position' : 'Actualiser position')}
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setManualLocationContext(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  isAtHome === true
                    ? 'bg-sport-100 text-sport-800 border-sport-300'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-sport-50 hover:border-sport-300 hover:text-sport-700'
                }`}
              >
                🏠 Maison
              </button>
              <button
                type="button"
                onClick={() => setManualLocationContext(false)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  isAtHome === false
                    ? 'bg-brand-100 text-brand-800 border-brand-300'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700'
                }`}
              >
                🌳 Extérieur
              </button>
            </div>
          </div>

          {locationError && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 w-full md:w-fit">
              {locationError}
            </p>
          )}

        </div>
        
        <div className="grid grid-cols-1 gap-1.5 md:gap-4 lg:gap-6">
          {currentProgram && (
            <Link
              to={`/programs/${currentProgram.id}?mode=view`}
              onClick={() => {
                localStorage.setItem(CURRENT_PROGRAM_ID_KEY, currentProgram.id);
                if (isAtHome === true) {
                  localStorage.setItem(CURRENT_HOME_PROGRAM_ID_KEY, currentProgram.id);
                }
                if (isAtHome === false) {
                  localStorage.setItem(CURRENT_AWAY_PROGRAM_ID_KEY, currentProgram.id);
                }
              }}
              className="flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 lg:p-6 border border-dashed border-pastel-neutral-300/50 rounded-md md:rounded-xl lg:rounded-2xl hover:border-pastel-blue-400 hover:bg-gradient-to-br hover:from-pastel-blue-50 hover:to-pastel-purple-50/50 transition-all duration-300 group"
            >
              <div className="w-6 h-6 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-sm md:rounded-lg lg:rounded-xl bg-pastel-neutral-100 group-hover:bg-pastel-blue-100 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <CalendarDays className="w-3 h-3 md:w-5 md:h-5 lg:w-6 lg:h-6 text-pastel-neutral-400 group-hover:text-pastel-blue-600" />
              </div>
              <div className="text-center">
                <span className="text-pastel-neutral-700 group-hover:text-pastel-blue-700 font-medium block text-xs md:text-sm lg:text-base leading-tight">
                  Programme en cours
                </span>
                <span className="text-pastel-neutral-500 block text-[10px] md:text-xs mt-0.5 leading-snug break-words">
                  {currentProgram.name}
                </span>
              </div>
            </Link>
          )}

          {!currentProgram && (
            <div className="p-3 md:p-4 text-center text-pastel-neutral-500 text-xs md:text-sm border border-dashed border-pastel-neutral-300/50 rounded-md md:rounded-xl lg:rounded-2xl">
              Aucun programme en cours
            </div>
          )}
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