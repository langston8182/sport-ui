import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Volume2, VolumeX, LogOut } from 'lucide-react';

// Types pour Spotify Web Playback SDK
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

interface SpotifyTrack {
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  duration_ms: number;
}

interface SpotifyState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: SpotifyTrack;
  };
}

interface SpotifyWebPlayerProps {
  className?: string;
  compact?: boolean;
}

export function SpotifyWebPlayer({ className = '', compact = false }: SpotifyWebPlayerProps) {
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [changingPlaylist, setChangingPlaylist] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration Spotify depuis les variables d'environnement
  const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'demo_client_id';
  const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin;
  const SCOPES = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'playlist-read-private',
    'playlist-read-collaborative'
  ].join(' ');

  // Charger le SDK Spotify
  useEffect(() => {
    if (!window.Spotify) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Ne pas déconnecter le player lors du démontage pour permettre la réutilisation
    };
  }, [accessToken]);

  // Charger les playlists utilisateur quand connecté
  useEffect(() => {
    if (accessToken && isConnected) {
      fetchUserPlaylists();
    }
  }, [accessToken, isConnected]);

  // Gérer la progression de la position de lecture
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (isPlaying && isConnected) {
      intervalRef.current = setInterval(() => {
        setPosition(prev => {
          const newPosition = prev + 1000;
          // Mettre à jour l'état global aussi
          const globalState = (window as any).spotifyCurrentState;
          if (globalState) {
            (window as any).spotifyCurrentState = {
              ...globalState,
              position: newPosition,
              isPlaying: true
            };
          }
          return newPosition;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, isConnected]);

  // Synchroniser l'état avec les autres instances
  useEffect(() => {
    if (!isConnected) return;

    const syncInterval = setInterval(() => {
      const globalState = (window as any).spotifyCurrentState;
      if (globalState) {
        // Mettre à jour seulement si l'état a changé
        if (currentTrack?.name !== globalState.track?.name) {
          setCurrentTrack(globalState.track);
        }
        if (isPlaying !== globalState.isPlaying) {
          setIsPlaying(globalState.isPlaying);
        }
        // Synchroniser la position seulement si elle diffère significativement
        if (Math.abs(position - globalState.position) > 3000) { // Plus de 3 secondes d'écart
          setPosition(globalState.position);
        }
        if (duration !== globalState.duration) {
          setDuration(globalState.duration);
        }
      }
    }, 2000); // Vérifier toutes les 2 secondes

    return () => clearInterval(syncInterval);
  }, [isConnected, currentTrack, isPlaying, position, duration]);

  // Initialiser le lecteur Spotify
  const initializePlayer = () => {
    if (!accessToken) return;

    // Vérifier si un player existe déjà dans le stockage global
    const existingPlayer = (window as any).spotifyPlayerInstance;
    
    if (existingPlayer && existingPlayer.device_id) {
      console.log('Réutilisation du player existant');
      setPlayer(existingPlayer);
      setDeviceId(existingPlayer.device_id);
      setIsConnected(true);
      
      // Récupérer l'état actuel
      existingPlayer.getCurrentState().then((state: SpotifyState | null) => {
        if (state) {
          setCurrentTrack(state.track_window.current_track);
          setIsPlaying(!state.paused);
          setPosition(state.position);
          setDuration(state.duration);
        }
      });
      
      return;
    }

    const spotifyPlayer = new window.Spotify.Player({
      name: 'Sport App Player',
      getOAuthToken: (cb: (token: string) => void) => {
        cb(accessToken);
      },
      volume: volume
    });

    // Événements du lecteur
    spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
      console.log('Ready with Device ID', device_id);
      setDeviceId(device_id);
      setIsConnected(true);
      
      // Stocker le player globalement
      (window as any).spotifyPlayerInstance = spotifyPlayer;
      spotifyPlayer.device_id = device_id;
    });

    spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.log('Device ID has gone offline', device_id);
      setIsConnected(false);
      // Nettoyer le stockage global
      delete (window as any).spotifyPlayerInstance;
    });

    spotifyPlayer.addListener('player_state_changed', (state: SpotifyState | null) => {
      if (!state) return;

      setCurrentTrack(state.track_window.current_track);
      setIsPlaying(!state.paused);
      setPosition(state.position);
      setDuration(state.duration);
      
      // Stocker l'état global pour synchroniser toutes les instances
      (window as any).spotifyCurrentState = {
        track: state.track_window.current_track,
        isPlaying: !state.paused,
        position: state.position,
        duration: state.duration
      };
    });

    // Connecter le lecteur
    spotifyPlayer.connect();
    setPlayer(spotifyPlayer);
  };

  // Générer des codes PKCE
  const generateCodeVerifier = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const generateCodeChallenge = async (verifier: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  // Authentification Spotify avec PKCE
  const authenticateSpotify = async () => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Stocker le code verifier pour l'échange
    localStorage.setItem('spotify_code_verifier', codeVerifier);
    
    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=${encodeURIComponent(SCOPES)}&` +
      `code_challenge_method=S256&` +
      `code_challenge=${codeChallenge}&` +
      `show_dialog=true`;
    
    window.location.href = authUrl;
  };

  // Échanger le code d'autorisation contre un token
  const exchangeCodeForToken = async (code: string) => {
    const codeVerifier = localStorage.getItem('spotify_code_verifier');
    if (!codeVerifier) {
      console.error('Code verifier not found');
      return;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          code_verifier: codeVerifier,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.access_token);
        localStorage.setItem('spotify_access_token', data.access_token);
        localStorage.removeItem('spotify_code_verifier'); // Nettoyer
        
        // Nettoyer l'URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        console.error('Failed to exchange code for token');
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error);
    }
  };

  // Récupérer le token depuis l'URL (après authentification)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      exchangeCodeForToken(code);
    } else {
      const savedToken = localStorage.getItem('spotify_access_token');
      if (savedToken) {
        setAccessToken(savedToken);
      }
    }
  }, []);

  // Contrôles de lecture
  const togglePlayPause = () => {
    if (player) {
      player.togglePlay();
    }
  };

  const skipToNext = () => {
    if (player) {
      player.nextTrack();
    }
  };

  const skipToPrevious = () => {
    if (player) {
      player.previousTrack();
    }
  };

  const setPlayerVolume = (newVolume: number) => {
    if (player) {
      player.setVolume(newVolume);
      setVolume(newVolume);
    }
  };

  const toggleMute = () => {
    if (player) {
      const newVolume = isMuted ? volume : 0;
      player.setVolume(newVolume);
      setIsMuted(!isMuted);
    }
  };

  // Déconnexion de Spotify
  const disconnectSpotify = () => {
    // Déconnecter le player
    if (player) {
      player.disconnect();
    }
    
    // Nettoyer l'état local
    setPlayer(null);
    setDeviceId('');
    setCurrentTrack(null);
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
    setIsConnected(false);
    setAccessToken(null);
    
    // Nettoyer le stockage
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expiry');
    localStorage.removeItem('spotify_code_verifier');
    
    // Nettoyer le player global
    delete (window as any).spotifyPlayerInstance;
    
    // Nettoyer l'intervalle
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    console.log('Déconnecté de Spotify');
  };

  // Récupérer les playlists de l'utilisateur
  const fetchUserPlaylists = async () => {
    if (!accessToken) return;

    setLoadingPlaylists(true);
    try {
      const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrer pour ne garder que les playlists publiques et celles de l'utilisateur
        const filteredPlaylists = data.items.filter((playlist: any) => 
          playlist.public || playlist.owner.id
        );
        setUserPlaylists(filteredPlaylists);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  // Lancer une playlist de workout avec stratégies multiples
  const playWorkoutPlaylist = async (playlistId: string) => {
    if (!accessToken || !deviceId) return;

    setChangingPlaylist(true);
    console.log('Changement vers playlist:', playlistId);
    
    try {
      // Stratégie 1: Arrêt forcé + transfert de device + lecture
      console.log('Étape 1: Arrêt forcé...');
      await fetch(`https://api.spotify.com/v1/me/player/pause`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      // Attendre que l'arrêt soit effectif
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Étape 2: Forcer le transfert vers notre device
      console.log('Étape 2: Transfert device...');
      await fetch(`https://api.spotify.com/v1/me/player`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false
        })
      });
      
      // Attendre le transfert
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Étape 3: Lancer la nouvelle playlist
      console.log('Étape 3: Lancement playlist...');
      let response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          context_uri: `spotify:playlist:${playlistId}`,
          offset: { position: 0 },
          position_ms: 0
        })
      });

      // Si ça échoue, essayer sans device_id spécifique
      if (!response.ok) {
        console.log('Tentative 2: Sans device_id...');
        response = await fetch(`https://api.spotify.com/v1/me/player/play`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            context_uri: `spotify:playlist:${playlistId}`,
            offset: { position: 0 },
            position_ms: 0
          })
        });
      }

      if (response.ok) {
        console.log('✅ Playlist changée avec succès!');
        
        // Vérifier et forcer la mise à jour plusieurs fois pour s'assurer
        const updateState = async (attempt = 1) => {
          if (attempt > 3) return; // Max 3 tentatives
          
          if (player) {
            const state = await player.getCurrentState();
            if (state && state.track_window.current_track) {
              console.log(`Mise à jour état (tentative ${attempt}):`, state.track_window.current_track.name);
              setCurrentTrack(state.track_window.current_track);
              setIsPlaying(!state.paused);
              setPosition(state.position);
              setDuration(state.duration);
              
              // Mettre à jour l'état global pour toutes les instances
              (window as any).spotifyCurrentState = {
                track: state.track_window.current_track,
                isPlaying: !state.paused,
                position: state.position,
                duration: state.duration
              };
            } else {
              // Si pas d'état, réessayer après 1 seconde
              setTimeout(() => updateState(attempt + 1), 1000);
            }
          }
        };
        
        // Première mise à jour immédiate, puis retries
        setTimeout(() => updateState(1), 500);
        setTimeout(() => updateState(2), 2000);
        setTimeout(() => updateState(3), 4000);
      } else {
        const errorText = await response.text();
        console.error('❌ Échec changement playlist:', response.status, errorText);
        
        // Essayer une dernière fois avec une approche différente
        console.log('Dernière tentative: via Web Playback SDK...');
        if (player) {
          try {
            // Utiliser directement le SDK pour changer le contexte
            await fetch(`https://api.spotify.com/v1/me/player/queue?uri=spotify:playlist:${playlistId}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            console.log('Playlist ajoutée à la queue');
          } catch (queueError) {
            console.error('Échec ajout à la queue:', queueError);
          }
        }
      }
    } catch (error) {
      console.error('Error playing playlist:', error);
    } finally {
      setChangingPlaylist(false);
    }
  };

  // Formatage du temps
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Version compacte pour les pages d'entraînement
  if (compact) {
    // Si pas d'authentification en mode compact
    if (!accessToken) {
      return (
        <div className={`bg-gradient-to-br from-pastel-green-50 to-pastel-green-100 border border-pastel-green-200/50 rounded-lg p-2 md:p-3 ${className}`}>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-pastel-green-400 to-pastel-green-500 flex items-center justify-center">
              <Music className="w-3 h-3 md:w-4 md:h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium text-pastel-green-800 truncate">Spotify</p>
              <p className="text-xs text-pastel-green-600 truncate">Non connecté</p>
            </div>
            <button
              onClick={authenticateSpotify}
              className="bg-gradient-to-r from-pastel-green-500 to-pastel-green-600 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm font-semibold hover:from-pastel-green-600 hover:to-pastel-green-700 transition-all duration-300"
            >
              Connexion
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-3 shadow-sm ${className}`}>
        {currentTrack ? (
          <div className="flex items-center gap-3">
            <img
              src={currentTrack.album.images[2]?.url || currentTrack.album.images[0]?.url}
              alt={currentTrack.name}
              className="w-10 h-10 rounded-lg"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentTrack.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {currentTrack.artists.map(a => a.name).join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={skipToPrevious}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={togglePlayPause}
                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={skipToNext}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center">
              <Music className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">
                {isConnected ? 'Prêt à jouer' : 'Connexion...'}
              </span>
            </div>
            <button
              onClick={disconnectSpotify}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Version complète - Dashboard
  // Si pas d'authentification en version complète
  if (!accessToken) {
    return (
      <div className={`card-pastel p-6 md:p-8 bg-gradient-to-br from-pastel-green-50 to-pastel-green-100 border border-pastel-green-200/50 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-pastel-green-400 to-pastel-green-500 flex items-center justify-center shadow-lg">
            <Music className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-bold text-pastel-green-800">Lecteur Spotify intégré</h3>
            <p className="text-pastel-green-700 text-sm md:text-base">Écoutez directement dans l'app</p>
          </div>
          <button
            onClick={authenticateSpotify}
            className="bg-gradient-to-r from-pastel-green-500 to-pastel-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-pastel-green-600 hover:to-pastel-green-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // Version complète avec thème pastel harmonisé (connecté)
  return (
    <div className={`card-pastel p-6 md:p-8 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-pastel-green-400 to-pastel-green-500 flex items-center justify-center shadow-lg">
          <Music className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl md:text-2xl font-bold text-pastel-neutral-800">Lecteur Spotify</h3>
          <p className="text-pastel-neutral-600 text-sm md:text-base">
            {isConnected ? 'Connecté et prêt' : 'Connexion en cours...'}
          </p>
        </div>
        <button
          onClick={disconnectSpotify}
          className="px-3 py-1.5 text-sm text-pastel-red-600 hover:bg-pastel-red-50 rounded-lg transition-colors border border-pastel-red-200 hover:border-pastel-red-300"
          title="Se déconnecter de Spotify"
        >
          Se déconnecter
        </button>
      </div>

      {currentTrack ? (
        <div className="space-y-4">
          {/* Informations de la piste */}
          <div className="flex items-center gap-4">
            <img
              src={currentTrack.album.images[1]?.url || currentTrack.album.images[0]?.url}
              alt={currentTrack.name}
              className="w-16 h-16 rounded-xl"
            />
            <div className="flex-1">
              <h4 className="font-semibold text-lg text-gray-900">{currentTrack.name}</h4>
              <p className="text-gray-600">
                {currentTrack.artists.map(a => a.name).join(', ')}
              </p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(position / duration) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>{formatTime(position)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Contrôles */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={skipToPrevious}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            <button
              onClick={togglePlayPause}
              className="p-4 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <button
              onClick={skipToNext}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          {/* Contrôle du volume */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setPlayerVolume(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune musique en cours
          </h4>
          <p className="text-gray-600 mb-6">
            Ouvrez Spotify et lancez une playlist pour commencer
          </p>
          
          {/* Vos playlists */}
          {loadingPlaylists && (
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-gray-700 mb-3">Chargement de vos playlists...</h5>
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
              </div>
            </div>
          )}
          
          {!loadingPlaylists && userPlaylists.length > 0 && (
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-gray-700 mb-3">Vos playlists</h5>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {userPlaylists.slice(0, 10).map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => playWorkoutPlaylist(playlist.id)}
                    className="flex items-center gap-3 p-3 bg-pastel-neutral-50 hover:bg-pastel-green-50 rounded-lg text-left transition-colors border border-pastel-neutral-200 hover:border-pastel-green-300"
                  >
                    {playlist.images?.[0] && (
                      <img
                        src={playlist.images[0].url}
                        alt={playlist.name}
                        className="w-10 h-10 rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-pastel-neutral-800 truncate">{playlist.name}</p>
                      <p className="text-sm text-pastel-neutral-600 truncate">
                        {playlist.tracks.total} titres
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Indicateur de changement de playlist */}
          {changingPlaylist && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-blue-700">Changement de playlist...</span>
              </div>
            </div>
          )}

          {/* Playlists de motivation et workout */}
          <div>
            <h5 className="text-sm font-semibold text-pastel-neutral-700 mb-3">Motivation & Energy</h5>
            <div className="grid grid-cols-2 gap-3">
              {/* Playlists populaires pour le sport et la motivation */}
              <button
                onClick={() => playWorkoutPlaylist('37i9dQZF1DX76Wlfdnj7AP')}
                className="p-3 bg-gradient-to-br from-pastel-orange-50 to-pastel-orange-100 hover:from-pastel-orange-100 hover:to-pastel-orange-200 rounded-xl text-pastel-orange-700 font-medium transition-colors text-sm border border-pastel-orange-200 hover:border-pastel-orange-300"
              >
                🔥 Beast Mode
              </button>
              <button
                onClick={() => playWorkoutPlaylist('37i9dQZF1DX32NsLKyzScr')}
                className="p-3 bg-gradient-to-br from-pastel-blue-50 to-pastel-blue-100 hover:from-pastel-blue-100 hover:to-pastel-blue-200 rounded-xl text-pastel-blue-700 font-medium transition-colors text-sm border border-pastel-blue-200 hover:border-pastel-blue-300"
              >
                💪 Power Workout
              </button>
              <button
                onClick={() => playWorkoutPlaylist('37i9dQZF1DX1tyCD9QhIWF')}
                className="p-3 bg-gradient-to-br from-pastel-purple-50 to-pastel-purple-100 hover:from-pastel-purple-100 hover:to-pastel-purple-200 rounded-xl text-pastel-purple-700 font-medium transition-colors text-sm border border-pastel-purple-200 hover:border-pastel-purple-300"
              >
                ⚡ Motivation Mix
              </button>
              <button
                onClick={() => playWorkoutPlaylist('37i9dQZF1DWXLeA8Omikj7')}
                className="p-3 bg-gradient-to-br from-pastel-green-50 to-pastel-green-100 hover:from-pastel-green-100 hover:to-pastel-green-200 rounded-xl text-pastel-green-700 font-medium transition-colors text-sm border border-pastel-green-200 hover:border-pastel-green-300"
              >
                🏃 Cardio Hits
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}