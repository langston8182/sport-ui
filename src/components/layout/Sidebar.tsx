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
        <aside className="w-64 bg-gradient-to-b from-white/95 via-pastel-blue-50/50 to-pastel-purple-50/30 border-r border-pastel-neutral-200/30 h-[calc(100vh-4.5rem)] sticky top-18 hidden md:block shadow-soft backdrop-blur-sm">
            <nav className="p-6 space-y-2">
                <div className="mb-8">
                    <h2 className="text-xs font-semibold text-pastel-neutral-500 uppercase tracking-wider mb-3">Navigation</h2>
                </div>
                {navItems.map(({ to, icon: Icon, label, exact }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={exact}
                        className={({ isActive }) =>
                            `nav-item ${
                                isActive
                                    ? 'nav-item-active'
                                    : ''
                            }`
                        }
                    >
                        <div className={`p-2 rounded-lg transition-all duration-300 ${
                            'group-hover:bg-pastel-blue-100/50'
                        }`}>
                            <Icon className="w-5 h-5 flex-shrink-0" />
                        </div>
                        <span className="font-medium">{label}</span>
                    </NavLink>
                ))}
                
                <div className="mt-8 pt-6 border-t border-pastel-neutral-200/50">
                    <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-pastel-blue-50 to-pastel-purple-50 border border-pastel-blue-200/30">
                        <p className="text-xs text-pastel-neutral-600 font-medium">Training Manager</p>
                        <p className="text-xs text-pastel-neutral-500 mt-1">Version 1.0</p>
                    </div>
                </div>
            </nav>
        </aside>
    );
}