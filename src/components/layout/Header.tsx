import { useAuth } from '../../contexts/AuthContext';
import { Dumbbell, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Header() {
  const { logout, profile } = useAuth();
  console.log("profile", profile);

  return (
    <header className="bg-white/90 backdrop-blur-xl border-b border-pastel-neutral-200/30 sticky top-0 z-40 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-pastel-blue-500 via-pastel-purple-500 to-pastel-blue-600 rounded-2xl flex items-center justify-center shadow-pastel group-hover:shadow-pastel-lg transition-all duration-300 group-hover:scale-105">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient-primary">Training Manager</span>
          </Link>

          <div className="flex items-center gap-4">
            {profile && (
              <div className="hidden sm:block text-right">
                <p className="text-sm text-pastel-neutral-600">
                  Bonjour <span className="text-pastel-neutral-800 font-semibold">{profile.given_name} {profile.family_name}</span>
                </p>
                <p className="text-xs text-pastel-neutral-500">{profile.email}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2.5 text-pastel-neutral-600 hover:text-pastel-rose-700 hover:bg-pastel-rose-50 rounded-xl transition-all duration-300 backdrop-blur-sm border border-transparent hover:border-pastel-rose-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}