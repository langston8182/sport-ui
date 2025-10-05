# 🎵 Configuration du Lecteur Spotify Intégré

Votre application sport dispose maintenant d'un **lecteur Spotify intégré** qui permet de lire la musique directement dans l'app sans ouvrir Spotify !

## 🚀 Configuration requise

### 1. Créer une Application Spotify

1. Allez sur [Spotify for Developers](https://developer.spotify.com/dashboard)
2. Connectez-vous avec votre compte Spotify
3. Cliquez sur **"Create an App"**
4. Remplissez les informations :
   - **App name** : "Sport App Player"
   - **App description** : "Lecteur musical intégré pour l'application sport"
   - **Website** : Votre URL d'application
   - **Redirect URI** : `http://localhost:5173/auth/spotify-callback` (pour dev)
   - Pour la production : `https://votre-domaine.com/auth/spotify-callback`

### 2. Configurer les Variables d'Environnement

Copiez le fichier `.env.spotify.example` vers `.env.local` :

```bash
cp .env.spotify.example .env.local
```

Puis modifiez `.env.local` avec vos vraies valeurs :

```env
VITE_SPOTIFY_CLIENT_ID=votre_client_id_spotify_ici
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/auth/spotify-callback
```

### 3. Récupérer votre Client ID

1. Dans le dashboard Spotify, cliquez sur votre app
2. Copiez le **Client ID**
3. Collez-le dans `VITE_SPOTIFY_CLIENT_ID`

## ✨ Fonctionnalités

### 🎧 **Lecteur Intégré Complet**
- **Contrôles complets** : Play/Pause/Skip/Précédent
- **Barre de progression** avec temps écoulé/restant
- **Contrôle du volume** avec bouton mute
- **Informations de la piste** : titre, artiste, pochette
- **Playlists rapides** : Beast Mode, Power Workout

### 📱 **Version Compacte** (pages d'entraînement)
- **Mini-lecteur** intégré dans SessionPlay, Timer, TabataTimer
- **Contrôles essentiels** : Play/Pause/Skip
- **Pochette et infos** de la piste actuelle
- **Design responsive** optimisé pour mobile

### 🔄 **Synchronisation**
- **État en temps réel** : synchronisé avec l'app Spotify
- **Multi-appareils** : contrôlez depuis l'app ou votre téléphone
- **Pas de rafraîchissement** : la musique continue pendant l'entraînement

## 🎵 **Comment l'utiliser**

### Première connexion
1. Cliquez sur **"Se connecter"** dans le lecteur Spotify
2. Autorisez l'application sur Spotify
3. Vous êtes redirigé vers votre app avec le lecteur actif

### Pendant l'entraînement
1. **Lancez une playlist** depuis l'app Spotify ou le lecteur intégré
2. **Contrôlez la musique** directement depuis votre page d'entraînement
3. **Changez de piste** sans quitter votre session
4. **Ajustez le volume** selon votre environnement

## 🛠️ **Dépannage**

### Lecteur ne se connecte pas
- Vérifiez que `VITE_SPOTIFY_CLIENT_ID` est correctement configuré
- Vérifiez que l'URL de redirection est identique dans Spotify et `.env.local`
- Essayez de vider le cache du navigateur

### Pas de son
- Vérifiez que Spotify est bien le périphérique de lecture sélectionné
- Vérifiez le volume dans le lecteur intégré
- Assurez-vous d'avoir Spotify Premium (requis pour l'API Web Playback)

### Token expiré
- Le token Spotify expire après 1 heure
- Reconnectez-vous simplement via le bouton "Se connecter"
- Le token est automatiquement sauvegardé dans le localStorage

## 🎯 **Avantages**

✅ **Pas de changement d'app** : musique directement dans votre app sport  
✅ **Contrôles rapides** : play/pause sans quitter votre entraînement  
✅ **Interface cohérente** : design intégré à votre app  
✅ **Playlists workout** : accès rapide aux meilleures playlists  
✅ **Responsive** : fonctionne parfaitement sur mobile et desktop  
✅ **Compatible WebView** : fonctionne dans votre app Android  

## 🚨 **Important**

- **Spotify Premium requis** : L'API Web Playback nécessite un abonnement Premium
- **HTTPS requis en production** : Spotify exige HTTPS pour les domaines publics
- **Même compte** : L'utilisateur doit être connecté au même compte Spotify

---

🎵 **Votre application est maintenant prête pour des entraînements avec une bande sonore parfaite !** 🏋️‍♂️