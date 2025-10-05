import { useState, useEffect } from 'react';
import { Music, ExternalLink, Volume2 } from 'lucide-react';

interface SpotifyPlayerProps {
  className?: string;
  showMiniPlayer?: boolean;
}

export function SpotifyPlayer({ className = '', showMiniPlayer = false }: SpotifyPlayerProps) {
  const [isSpotifyOpen, setIsSpotifyOpen] = useState(false);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Playlists de workout prédéfinies (vraies playlists Spotify populaires)
  const workoutPlaylists = [
    {
      id: 'cardio',
      name: 'Beast Mode',
      description: 'Hip-hop et électro intense pour le cardio',
      spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP',
      icon: '🔥'
    },
    {
      id: 'strength',
      name: 'Power Workout',
      description: 'Rock et métal pour la musculation',
      spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX32NsLKyzScr',
      icon: '💪'
    },
    {
      id: 'motivation',
      name: 'Motivation Mix',
      description: 'Les tubes qui donnent la motivation',
      spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX1tyCD9QhIWF',
      icon: '⚡'
    },
    {
      id: 'running',
      name: 'Running Hits',
      description: 'Parfait pour courir et le cardio',
      spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd',
      icon: '🏃'
    },
    {
      id: 'focus',
      name: 'Focus Flow',
      description: 'Concentration et régularité',
      spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWXLeA8Omikj7',
      icon: '🎯'
    },
    {
      id: 'recovery',
      name: 'Cool Down',
      description: 'Musiques relaxantes pour récupération',
      spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX4H7FFUM2osB',
      icon: '🧘'
    }
  ];

  // Vérifier si Spotify est disponible
  useEffect(() => {
    const checkSpotify = () => {
      // Vérifier si l'app Spotify est installée (approximatif)
      const userAgent = navigator.userAgent;
      const isSpotifyAvailable = 
        userAgent.includes('Spotify') || 
        window.location.href.includes('spotify') ||
        localStorage.getItem('spotifyAvailable') === 'true';
      
      setIsSpotifyOpen(isSpotifyAvailable);
    };

    checkSpotify();
  }, []);

  const openSpotifyPlaylist = (spotifyUrl: string) => {
    setIsLoading(true);
    
    // Créer un lien invisible pour tester l'app native
    const spotifyAppUrl = spotifyUrl.replace('https://open.spotify.com', 'spotify');
    
    // Fonction pour ouvrir le web en fallback
    const openWebFallback = () => {
      window.open(spotifyUrl, '_blank', 'noopener,noreferrer');
      setIsLoading(false);
    };

    // Détecter si on est sur mobile
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Sur mobile, essayer l'app native d'abord
      const startTime = Date.now();
      
      // Créer un lien invisible pour éviter le refresh de page
      const link = document.createElement('a');
      link.href = spotifyAppUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Écouter si la page perd le focus (app s'ouvre)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          // L'app s'est ouverte, nettoyer
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          clearTimeout(fallbackTimer);
          setIsLoading(false);
          document.body.removeChild(link);
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Timer de fallback vers le web
      const fallbackTimer = setTimeout(() => {
        const timeElapsed = Date.now() - startTime;
        if (timeElapsed < 2000) {
          // Si moins de 2s, l'app ne s'est probablement pas ouverte
          openWebFallback();
        } else {
          setIsLoading(false);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 1500);
      
      // Tenter d'ouvrir l'app
      try {
        link.click();
      } catch (e) {
        clearTimeout(fallbackTimer);
        openWebFallback();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }
    } else {
      // Sur desktop, ouvrir directement le web
      openWebFallback();
    }

    setShowPlaylistSelector(false);
    
    // Marquer Spotify comme disponible
    localStorage.setItem('spotifyAvailable', 'true');
    setIsSpotifyOpen(true);
  };

  const openSpotifyApp = () => {
    const spotifyUrl = 'https://open.spotify.com';
    const spotifyAppUrl = 'spotify://';
    
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Sur mobile, essayer l'app d'abord
      const link = document.createElement('a');
      link.href = spotifyAppUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      const fallbackTimer = setTimeout(() => {
        window.open(spotifyUrl, '_blank', 'noopener,noreferrer');
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 1500);
      
      const handleVisibilityChange = () => {
        if (document.hidden) {
          clearTimeout(fallbackTimer);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      try {
        link.click();
      } catch (e) {
        clearTimeout(fallbackTimer);
        window.open(spotifyUrl, '_blank', 'noopener,noreferrer');
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }
    } else {
      // Sur desktop, ouvrir directement le web
      window.open(spotifyUrl, '_blank', 'noopener,noreferrer');
    }

    setIsSpotifyOpen(true);
  };

  if (showMiniPlayer) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={() => setShowPlaylistSelector(true)}
          disabled={isLoading}
          className={`flex items-center gap-2 px-3 py-2 text-white rounded-lg transition-colors ${
            isLoading 
              ? 'bg-green-400 cursor-not-allowed' 
              : 'bg-green-500 hover:bg-green-600'
          }`}
          title="Choisir une playlist d'entraînement"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Music className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isLoading ? 'Ouverture...' : 'Musique'}
          </span>
        </button>
        
        {showPlaylistSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Playlists Workout</h3>
                    <p className="text-sm text-gray-600">Choisissez votre ambiance</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPlaylistSelector(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                {workoutPlaylists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => openSpotifyPlaylist(playlist.spotifyUrl)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group"
                  >
                    <div className="text-2xl">{playlist.icon}</div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-gray-900 group-hover:text-green-700">
                        {playlist.name}
                      </h4>
                      <p className="text-sm text-gray-600">{playlist.description}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={openSpotifyApp}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  <Music className="w-4 h-4" />
                  <span className="font-medium">Ouvrir Spotify</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
          <Music className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Spotify Workout</h3>
          <p className="text-gray-600">Musique pour votre entraînement</p>
        </div>
      </div>

      {!isSpotifyOpen ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            Prêt pour la musique ?
          </h4>
          <p className="text-gray-600 mb-6">
            Choisissez une playlist adaptée à votre entraînement
          </p>
          <button
            onClick={() => setShowPlaylistSelector(true)}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Choisir une playlist
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-700">
              <Volume2 className="w-4 h-4" />
              <span className="text-sm font-medium">Spotify est actif</span>
            </div>
            <p className="text-green-600 text-sm mt-1">
              Votre musique devrait être en cours de lecture
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowPlaylistSelector(true)}
              className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Music className="w-4 h-4" />
              <span className="text-sm font-medium">Changer</span>
            </button>
            <button
              onClick={openSpotifyApp}
              className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm font-medium">Ouvrir</span>
            </button>
          </div>
        </div>
      )}

      {showPlaylistSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Playlists Workout</h3>
                  <p className="text-sm text-gray-600">Choisissez votre ambiance</p>
                </div>
              </div>
              <button
                onClick={() => setShowPlaylistSelector(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {workoutPlaylists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => openSpotifyPlaylist(playlist.spotifyUrl)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group"
                >
                  <div className="text-2xl">{playlist.icon}</div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-gray-900 group-hover:text-green-700">
                      {playlist.name}
                    </h4>
                    <p className="text-sm text-gray-600">{playlist.description}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={openSpotifyApp}
                className="w-full flex items-center justify-center gap-2 p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <Music className="w-4 h-4" />
                <span className="font-medium">Ouvrir Spotify</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}