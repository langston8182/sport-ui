import { useAuth } from '../../contexts/AuthContext';
import { Dumbbell, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Header() {
  const { logout, profile } = useAuth();
  console.log("profile", profile);

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Training Manager</span>
          </Link>

          <div className="flex items-center gap-4">
            {profile && (
              <div className="hidden sm:block text-right">
                <p className="text-sm text-gray-300">
                  Bonjour <span className="text-gray font-semibold">{profile.given_name} {profile.family_name}</span>
                </p>
                <p className="text-xs text-gray-400">{profile.email}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-sm"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}