import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Volume2, VolumeX } from 'lucide-react';

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
    });

    // Connecter le lecteur
    spotifyPlayer.connect();
    setPlayer(spotifyPlayer);

    // Mettre à jour la position toutes les secondes
    intervalRef.current = setInterval(() => {
      if (isPlaying) {
        setPosition(prev => prev + 1000);
      }
    }, 1000);
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

  // Lancer une playlist de workout
  const playWorkoutPlaylist = async (playlistId: string) => {
    if (!accessToken || !deviceId) return;

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
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

      if (response.ok) {
        console.log('Playlist started');
      }
    } catch (error) {
      console.error('Error playing playlist:', error);
    }
  };

  // Formatage du temps
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Si pas d'authentification
  if (!accessToken) {
    return (
      <div className={`bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white ${className}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Music className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold">Lecteur Spotify intégré</h3>
            <p className="text-green-100 text-sm">Écoutez directement dans l'app</p>
          </div>
          <button
            onClick={authenticateSpotify}
            className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // Version compacte pour les pages d'entraînement
  if (compact) {
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
          <div className="flex items-center justify-center py-2">
            <Music className="w-5 h-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-500">
              {isConnected ? 'Prêt à jouer' : 'Connexion...'}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Version complète
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-lg ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
          <Music className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Lecteur Spotify</h3>
          <p className="text-gray-600">
            {isConnected ? 'Connecté et prêt' : 'Connexion en cours...'}
          </p>
        </div>
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
          
          {/* Boutons de playlists rapides */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => playWorkoutPlaylist('37i9dQZF1DX76Wlfdnj7AP')}
              className="p-3 bg-red-100 hover:bg-red-200 rounded-xl text-red-700 font-medium transition-colors"
            >
              🔥 Beast Mode
            </button>
            <button
              onClick={() => playWorkoutPlaylist('37i9dQZF1DX32NsLKyzScr')}
              className="p-3 bg-blue-100 hover:bg-blue-200 rounded-xl text-blue-700 font-medium transition-colors"
            >
              💪 Power Workout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}