import { useState, useMemo, useEffect, useCallback } from 'react';
import { Flag, CheckCircle2, Circle, ChevronDown, ChevronUp, Footprints, Zap, FlaskConical, Search } from 'lucide-react';
import { runningPlanService, PlanSession } from '../services/runningPlan';
import { Loader } from '../components/ui/Loader';
import { useToast } from '../components/ui/Toast';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupByWeek(sessions: PlanSession[]): Map<number, PlanSession[]> {
  const map = new Map<number, PlanSession[]>();
  for (const s of sessions) {
    if (!map.has(s.week)) map.set(s.week, []);
    map.get(s.week)!.push(s);
  }
  return map;
}

const TYPE_META = {
  endurance:  { label: 'Endurance',  icon: Footprints,   cls: 'bg-sport-100 text-sport-700', dot: 'bg-sport-400' },
  fractionné: { label: 'Fractionné', icon: Zap,          cls: 'bg-brand-100 text-brand-700', dot: 'bg-brand-400' },
  test:       { label: 'Test',       icon: FlaskConical, cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  autre:      { label: 'Autre',      icon: Footprints,   cls: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function RunningPlan() {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<PlanSession[]>([]);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [loadingApi, setLoadingApi] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Load plan + done state from API
  useEffect(() => {
    runningPlanService.getPlan()
      .then(({ sessions: s, doneIds: ids }) => {
        setSessions(s);
        setDoneIds(new Set(ids));
        // Auto-open first non-fully-done week
        const grouped = groupByWeek(s);
        for (const [w, ws] of grouped) {
          if (ws.some((x) => !ids.includes(x.sessionId))) {
            setExpandedWeeks(new Set([w]));
            break;
          }
        }
      })
      .catch(() => showToast('Impossible de charger le plan', 'error'))
      .finally(() => setLoadingApi(false));
  }, []);

  const toggleDone = useCallback(async (sessionId: string) => {
    const newDone = !doneIds.has(sessionId);
    setDoneIds((prev) => {
      const next = new Set(prev);
      newDone ? next.add(sessionId) : next.delete(sessionId);
      return next;
    });
    setTogglingId(sessionId);
    try {
      await runningPlanService.setDone(sessionId, newDone);
    } catch {
      setDoneIds((prev) => {
        const next = new Set(prev);
        newDone ? next.delete(sessionId) : next.add(sessionId);
        return next;
      });
      showToast('Impossible de sauvegarder', 'error');
    } finally {
      setTogglingId(null);
    }
  }, [doneIds, showToast]);

  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));
  const [filter, setFilter] = useState<'all' | 'done' | 'todo'>('all');
  const [search, setSearch] = useState('');

  const totalSessions = sessions.length;
  const doneSessions  = doneIds.size;
  const progressPct   = totalSessions > 0 ? Math.round((doneSessions / totalSessions) * 100) : 0;

  const weeks = useMemo(() => {
    const grouped = groupByWeek(sessions);
    return Array.from(grouped.entries()).map(([week, ws]) => {
      const filtered = ws.filter((s) => {
        const isDone = doneIds.has(s.sessionId);
        const matchFilter =
          filter === 'all'  ? true :
          filter === 'done' ? isDone : !isDone;
        const matchSearch = search
          ? s.description.toLowerCase().includes(search.toLowerCase())
          : true;
        return matchFilter && matchSearch;
      });
      return {
        week,
        sessions: filtered,
        allDone: ws.every((s) => doneIds.has(s.sessionId)),
      };
    }).filter((w) => w.sessions.length > 0);
  }, [sessions, filter, search, doneIds]);


  const toggleWeek = (week: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      next.has(week) ? next.delete(week) : next.add(week);
      return next;
    });
  };

  if (loadingApi) return <Loader />;

  return (
    <div className="space-y-6 fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sport-400 to-brand-500 flex items-center justify-center shadow-btn">
              <Footprints className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Plan 10 km</h1>
          </div>
          <p className="text-gray-500 text-sm ml-11">52 semaines · Objectif 55 min · 2 séances / semaine</p>
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge-success">{doneSessions} faites</span>
          <span className="badge-neutral">{totalSessions - doneSessions} restantes</span>
          <span className="badge-primary">{progressPct}% complété</span>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="card-pastel p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Progression globale</span>
          <span className="text-sm font-bold text-brand-600">{progressPct}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sport-400 to-brand-500 rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400">Semaine 1</span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Flag className="w-3 h-3 text-amber-500" /> 10 km · 52 semaines
          </span>
        </div>
      </div>

      {/* ── Légende + Filtres ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une séance..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-pastel pl-9"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex rounded-xl border border-gray-200 bg-white p-1 gap-0.5 self-start sm:self-auto flex-shrink-0">
          {(['all', 'todo', 'done'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filter === f
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'Tout' : f === 'todo' ? 'À faire' : 'Faites'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Légende types ── */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(TYPE_META) as [keyof typeof TYPE_META, typeof TYPE_META[keyof typeof TYPE_META]][]).map(([key, meta]) => (
          <span key={key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        ))}
      </div>

      {/* ── Weeks list ── */}
      <div className="space-y-3">
        {weeks.length === 0 && (
          <div className="card-pastel p-10 text-center text-gray-400 text-sm">
            Aucune séance ne correspond à vos critères.
          </div>
        )}

        {weeks.map(({ week, sessions, allDone }) => {
          const isOpen = expandedWeeks.has(week);
          const weekDone = sessions.filter((s) => doneIds.has(s.sessionId)).length;

          return (
            <div key={week} className="card-pastel overflow-hidden">
              {/* Week header — clickable */}
              <button
                type="button"
                onClick={() => toggleWeek(week)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {allDone ? (
                    <CheckCircle2 className="w-5 h-5 text-sport-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm font-bold ${allDone ? 'text-gray-400' : 'text-gray-900'}`}>
                    Semaine {week}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {weekDone}/{sessions.length} séance{sessions.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Mini progress dots */}
                  <div className="hidden sm:flex gap-1">
                    {sessions.map((s) => (
                      <span
                        key={s.sessionId}
                        className={`w-2 h-2 rounded-full ${doneIds.has(s.sessionId) ? 'bg-sport-400' : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />
                  }
                </div>
              </button>

              {/* Sessions */}
              {isOpen && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {sessions.map((s) => {
                    const isDone = doneIds.has(s.sessionId);
                    const isToggling = togglingId === s.sessionId;
                    const meta = TYPE_META[s.type];
                    const TypeIcon = meta.icon;
                    return (
                      <div
                        key={s.sessionId}
                        className={`flex items-start gap-3 px-4 py-3.5 transition-colors ${
                          isDone ? 'bg-gray-50/50' : 'bg-white hover:bg-gray-50/30'
                        }`}
                      >
                        {/* Toggle button */}
                        <button
                          type="button"
                          onClick={() => void toggleDone(s.sessionId)}
                          disabled={isToggling}
                          className="flex-shrink-0 mt-0.5 transition-transform active:scale-90 disabled:opacity-50"
                          aria-label={isDone ? 'Marquer comme non faite' : 'Marquer comme faite'}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-sport-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300 hover:text-sport-400 transition-colors" />
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDone ? 'text-gray-400' : 'text-gray-500'}`}>
                              Séance {s.session}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.cls}`}>
                              <TypeIcon className="w-2.5 h-2.5" />
                              {meta.label}
                            </span>
                          </div>
                          <p className={`text-sm leading-snug ${isDone ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>
                            {s.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
