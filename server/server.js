import express from 'express';
import cors from 'cors';
import { findResolution } from './services/resolutionService.js';
import { authenticateUser } from './services/authService.js';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import session from 'express-session'; // Importer express-session
import { getStats } from './services/statsService.js';
import { getAllUsers, updateUserRole } from './services/userService.js';
import { getHistoryByUser } from './services/historyService.js';
import { getHistoryAdmin } from './services/historyAdmin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.use(session({
  secret: 'FCOURTAGE1',  // Change cela par un secret sécurisé
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: true,  // Mettre à `true` uniquement si tu utilises HTTPS
    httpOnly: true,  // Empêcher l'accès aux cookies côté client
    maxAge: 24 * 60 * 60 * 1000  // Durée de validité de la session en ms
  }
}));

// Chargement des certificats SSL
const SSL_KEY_PATH = '../certs/wildcard_francecourtage_fr.key';
const SSL_CERT_PATH = '../certs/wildcard_francecourtage_fr.cer';
const SSL_CA_PATH = '../certs/GandiCert.pem';

const sslOptions = {
  key: fs.readFileSync(SSL_KEY_PATH),
  cert: fs.readFileSync(SSL_CERT_PATH),
  ca: fs.readFileSync(SSL_CA_PATH),
};



// Routes API
app.post('/api/chat', async (req, res) => {

  const userId = req.body.iduser; 
  console.log('User ID:', userId);

  const { message } = req.body;
  
  try {
    console.log('Received chat request with message:', message);
    const response = await findResolution(message,userId);
    console.log('Sending response:', response);
    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ 
      response: "Une erreur s'est produite. Veuillez réessayer." 
    });
  }
});




app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Nom d\'utilisateur et mot de passe requis' 
    });
  }
  
  try {
    const result = await authenticateUser(username, password);

    if (result.success) {
      console.log('Authentication successful for user:', username);
      req.session.userId = result.user.iduser;
      req.session.userGroups = result.user.groups;
      console.log('Authentication successful for user:',req.session.userId);
      res.json(result);
    } else {
      console.log('Authentication failed for user:', username);
      res.status(401).json(result);
    }

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});





app.get('/api/stats', async (req, res) => {
  console.log('🟡 Checking userGroups in session:', req.session.userGroups);
  
  // if (!req.session.userGroups || !req.session.userGroups.includes('admin')) {
  //   return res.status(403).json({ message: 'Accès interdit : Vous devez être un admin.' });
  // }

  try {
    console.log('📊 Tentative de récupération des statistiques...'); 
    const stats = await getStats();
    console.log('📊 Statistiques récupérées :', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});




app.get('/api/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
});





// Route pour mettre à jour le rôle d'un utilisateur
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    await updateUserRole(id, role);
    res.json({ success: true, message: 'Rôle mis à jour avec succès' });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du rôle de l\'utilisateur :', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du rôle de l\'utilisateur' });
  }
});



app.get('/api/history/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const history = await getHistoryByUser(userId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique.' });
  }
});


app.get('/api/histadmin', async (req, res) => {
  try {
    const history = await getHistoryAdmin();  // Vérifie cette fonction
    res.json(history);  // Renvoie un tableau JSON
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique.' });
  }
});








// Servir les fichiers statiques du build React
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Démarrage du serveur HTTPS
const HTTPS_PORT = 443;
https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
  console.log(`✅ Serveur HTTPS démarré sur https://sos.francecourtage.fr:${HTTPS_PORT}`);
});

// Serveur HTTP avec redirection vers HTTPS
const httpApp = express();
httpApp.use((req, res) => {
  res.redirect(`https://${req.headers.host}${req.url}`);
  console.log(`https://${req.headers.host}${req.url}`);
});
const HTTP_PORT = 80;
httpApp.listen(HTTP_PORT, () => {
  console.log(`🔄 Redirection HTTP -> HTTPS activée sur http://localhost:${HTTP_PORT}`);
});
