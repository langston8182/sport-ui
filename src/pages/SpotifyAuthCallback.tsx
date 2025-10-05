import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music } from 'lucide-react';

export function SpotifyAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Récupérer les paramètres de l'URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        console.error('Spotify auth error:', error);
        // Rediriger vers le dashboard avec une erreur
        navigate('/?spotify_error=' + error);
        return;
      }

      if (code) {
        try {
          // Échanger le code contre un token
          const codeVerifier = localStorage.getItem('spotify_code_verifier');
          if (!codeVerifier) {
            throw new Error('Code verifier not found');
          }

          const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
          const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI + '/auth/spotify';

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
            
            // Sauvegarder le token
            localStorage.setItem('spotify_access_token', data.access_token);
            
            // Calculer l'expiration
            const expirationTime = Date.now() + (data.expires_in * 1000);
            localStorage.setItem('spotify_token_expiry', expirationTime.toString());
            
            // Nettoyer le code verifier
            localStorage.removeItem('spotify_code_verifier');

            // Rediriger vers le dashboard avec succès
            navigate('/?spotify_connected=true');
          } else {
            throw new Error('Failed to exchange code for token');
          }
        } catch (error) {
          console.error('Error during token exchange:', error);
          navigate('/?spotify_error=token_exchange_failed');
        }
      } else {
        // Pas de code, rediriger vers le dashboard
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Music className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion Spotify</h2>
        <p className="text-gray-600 mb-4">Configuration de votre lecteur musical...</p>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </div>
    </div>
  );
}