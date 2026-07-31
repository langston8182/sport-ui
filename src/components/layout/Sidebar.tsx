import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, ListChecks, CalendarDays, Timer, Clock, Scale, TrendingUp, Footprints } from 'lucide-react';

const navItems = [
  { to: '/',           icon: LayoutDashboard, label: 'Tableau de bord', exact: true, iconCls: 'bg-brand-100 text-brand-600' },
  { to: '/exercises',  icon: Dumbbell,        label: 'Exercices',       iconCls: 'bg-amber-100 text-amber-600' },
  { to: '/sessions',   icon: ListChecks,      label: 'Sessions',        iconCls: 'bg-sport-100 text-sport-600' },
  { to: '/programs',   icon: CalendarDays,    label: 'Programmes',      iconCls: 'bg-purple-100 text-purple-600' },
  { to: '/weight',     icon: Scale,           label: 'Suivi du Poids',  iconCls: 'bg-rose-100 text-rose-600' },
  { to: '/progression',  icon: TrendingUp,  label: 'Progression',     iconCls: 'bg-cyan-100 text-cyan-600' },
  { to: '/running-plan', icon: Footprints,  label: 'Plan 10 km',      iconCls: 'bg-sport-100 text-sport-600' },
];

const timerItems = [
  { to: '/timer',        icon: Clock,  label: 'Chronomètre',   iconCls: 'bg-orange-100 text-orange-600' },
  { to: '/timer/tabata', icon: Timer,  label: 'Tabata Timer',  iconCls: 'bg-red-100 text-red-600' },
];

const mobileNavItems = [
  { to: '/',             icon: LayoutDashboard, label: 'Tableau',    exact: true, iconCls: 'bg-brand-100 text-brand-600' },
  { to: '/exercises',    icon: Dumbbell,        label: 'Exercices',               iconCls: 'bg-amber-100 text-amber-600' },
  { to: '/sessions',     icon: ListChecks,      label: 'Sessions',                iconCls: 'bg-sport-100 text-sport-600' },
  { to: '/programs',     icon: CalendarDays,    label: 'Programmes',              iconCls: 'bg-purple-100 text-purple-600' },
  { to: '/running-plan', icon: Footprints,      label: 'Plan',                    iconCls: 'bg-sport-100 text-sport-600' },
];

export function BottomNav() {
  const allItems = mobileNavItems;
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100"
      style={{ boxShadow: '0 -1px 0 0 #f3f4f6' }}
    >
      <div className="flex justify-around w-full px-1">
        {allItems.map(({ to, icon: Icon, label, iconCls, ...rest }) => (
          <NavLink
            key={to}
            to={to}
            end={'exact' in rest ? (rest as { exact?: boolean }).exact : false}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[60px] flex-shrink-0 text-center transition-colors ${
                isActive ? 'text-brand-600' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isActive ? iconCls : ''
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-medium leading-none">{label.split(' ')[0]}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-100 h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col">
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pb-2 pt-1">Principal</p>
        {navItems.map(({ to, icon: Icon, label, exact, iconCls }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconCls}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span>{label}</span>
          </NavLink>
        ))}

        <div className="pt-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pb-2">Outils</p>
          {timerItems.map(({ to, icon: Icon, label, iconCls }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconCls}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="p-3 border-t border-gray-100">
        <div className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-brand-50 to-sport-50 border border-brand-100/50">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sport-500 animate-pulse flex-shrink-0" />
            <p className="text-xs font-bold text-brand-700">Training Manager</p>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">v1.0 · Prêt à s'entraîner 💪</p>
        </div>
      </div>
    </aside>
  );
}