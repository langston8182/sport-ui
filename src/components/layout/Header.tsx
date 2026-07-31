import { useAuth } from '../../contexts/AuthContext';
import { Dumbbell, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Header() {
  const { logout, profile } = useAuth();

  const initials = profile
    ? `${profile.given_name?.[0] ?? ''}${profile.family_name?.[0] ?? ''}`.toUpperCase() || '?'
    : '?';

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40" style={{ boxShadow: '0 1px 0 0 #f3f4f6' }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-btn transition-all duration-300 group-hover:shadow-glow-brand group-hover:scale-105">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-display font-bold text-gray-900 tracking-tight">Training</span>
              <span className="text-base font-display font-bold text-brand-600 tracking-tight">Manager</span>
            </div>
          </Link>

          {/* ── Right side ── */}
          <div className="flex items-center gap-2">
            {profile && (
              <div className="hidden sm:flex items-center gap-3 pr-3 mr-1 border-r border-gray-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                  {initials}
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold text-gray-800 leading-none">
                    {profile.given_name} {profile.family_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-none">{profile.email}</p>
                </div>
              </div>
            )}
            <button onClick={logout} className="btn-ghost">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}