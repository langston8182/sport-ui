import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, ListChecks, CalendarDays, Timer } from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
    { to: '/exercises', icon: Dumbbell, label: 'Exercices' },
    { to: '/sessions', icon: ListChecks, label: 'Sessions' },
    { to: '/programs', icon: CalendarDays, label: 'Programmes' },
    { to: '/timer', icon: Timer, label: 'Chronomètre' },
];

export function Sidebar() {
    return (
        <aside className="w-64 bg-gradient-to-b from-slate-50 to-gray-100 border-r border-gray-200/50 h-[calc(100vh-4rem)] sticky top-16 hidden md:block shadow-sm">
            <nav className="p-6 space-y-2">
                {navItems.map(({ to, icon: Icon, label, exact }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={exact}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                isActive
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow-lg'
                                    : 'text-gray-700 hover:bg-white/80 hover:shadow-md'
                            }`
                        }
                    >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}