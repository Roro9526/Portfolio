# Loup-Garou - Jeu Multijoueur 🐺

Application web multijoueur du célèbre jeu Loup-Garou avec gestion des parties en temps réel.

## 🎮 Fonctionnalités

- **Création/Jonction de parties** avec codes uniques
- **6 rôles jouables** : Villageois, Loup-Garou, Voyante, Sorcière, Cupidon, Chasseur
- **Phases de jeu** : Cycles jour/nuit avec actions spécifiques
- **Votes et éliminations** en temps réel
- **Interface moderne** avec animations et thème sombre
- **Multijoueur** via WebSocket (Socket.io)

## 🛠️ Technologies

### Backend
- Node.js + Express
- Socket.io (communication temps réel)
- ES Modules

### Frontend
- React 18
- React Router
- Socket.io Client
- Vite
- CSS moderne avec animations

## 📦 Installation

### Prérequis
- Node.js 18+
- npm ou yarn

### Installation locale

1. **Cloner le projet**
```bash
cd "projet doc"
```

2. **Installer le backend**
```bash
cd backend
npm install
```

3. **Installer le frontend**
```bash
cd ../frontend
npm install
```

## 🚀 Lancement

### Mode développement

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Le serveur démarre sur `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
L'application est accessible sur `http://localhost:5173`

### Mode production avec Docker

**Lancer toute l'application:**
```bash
docker-compose up --build
```

**Arrêter l'application:**
```bash
docker-compose down
```

L'application sera accessible sur:
- Frontend: `http://localhost`
- Backend: `http://localhost:3001`

## 🎯 Comment jouer

1. **Créer une partie**
   - Entrez votre nom
   - Cliquez sur "Créer une partie"
   - Partagez le code avec vos amis

2. **Rejoindre une partie**
   - Entrez votre nom
   - Saisissez le code de la partie
   - Cliquez sur "Rejoindre"

3. **Configuration**
   - L'hôte configure les rôles
   - Minimum 4 joueurs requis
   - Le nombre de rôles doit correspondre au nombre de joueurs

4. **Jouer**
   - Chaque joueur reçoit un rôle secret
   - Suivez les instructions selon votre rôle
   - Participez aux votes jour/nuit
   - Éliminez tous les loups ou tous les villageois pour gagner !

## 📝 Rôles

| Rôle | Camp | Capacité |
|------|------|----------|
| 🐺 **Loup-Garou** | Loups | Vote pour tuer un villageois chaque nuit |
| 🔮 **Voyante** | Village | Découvre l'identité d'un joueur chaque nuit |
| 🧪 **Sorcière** | Village | 2 potions (vie/mort) utilisables 1 fois |
| 💘 **Cupidon** | Village | Désigne 2 amoureux au 1er tour |
| 🏹 **Chasseur** | Village | Tue un joueur en mourant |
| 👤 **Villageois** | Village | Aucune capacité spéciale |

## 🌐 Architecture

```
loup-garou/
├── backend/
│   ├── server.js           # Serveur Express + Socket.io
│   ├── game/
│   │   ├── GameManager.js  # Gestion des parties
│   │   ├── GameLogic.js    # Logique du jeu
│   │   └── roles.js        # Définitions des rôles
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/          # HomePage, LobbyPage, GamePage
│   │   ├── components/     # PlayerCard, GameOverModal
│   │   ├── hooks/          # useSocket
│   │   └── services/       # Socket.io client
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml
```

## 🔧 Variables d'environnement

### Backend
- `PORT` : Port du serveur (défaut: 3001)
- `NODE_ENV` : Environnement (development/production)

### Frontend
- `VITE_SERVER_URL` : URL du serveur backend (défaut: http://localhost:3001)

## 📱 Réseau local

Pour jouer sur votre réseau local:

1. Trouvez votre adresse IP locale:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`

2. Modifiez `frontend/src/services/socket.js`:
```javascript
const SERVER_URL = 'http://VOTRE_IP:3001';
```

3. Partagez l'URL avec vos amis: `http://VOTRE_IP:5173`

## 🐛 Dépannage

**Le serveur ne démarre pas:**
- Vérifiez que le port 3001 n'est pas utilisé
- Assurez-vous que les dépendances sont installées

**Problème de connexion Socket.io:**
- Vérifiez que le backend est lancé
- Vérifiez l'URL dans `socket.js`
- Consultez la console du navigateur

**Docker ne build pas:**
- Assurez-vous que Docker est installé et lancé
- Vérifiez les logs avec `docker-compose logs`

## 🤝 Contribution

Contributions bienvenues ! N'hésitez pas à ouvrir des issues ou des pull requests.

## 📜 Licence

MIT

## 👨‍💻 Auteur

Créé avec ❤️ pour jouer avec vos amis !

---

**Bon jeu ! 🐺🌙**
