import express from 'express';
import cors from 'cors';
import { findResolution } from './services/resolutionService.js';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// Route API
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  
  try {
    const response = await findResolution(message);
    res.json({ response });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      response: "Une erreur s'est produite. Veuillez réessayer." 
    });
  }
});

// Ajout de la gestion du front-end
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Lancement du serveur
const PORT = 81;
app.listen(PORT, () => {
  console.log(`Server running on http://pc235.fcourtage1.local:${PORT}`);
});

// Exemple : Exécution de l'auto-apprentissage au démarrage
// import { autoLearn } from './services/autoLearning.js';
// const runAutoLearning = async () => {
//   try {
//     await autoLearn();
//     console.log('Auto-learning terminé avec succès');
//   } catch (error) {
//     console.error('Erreur dans l\'exécution de l\'auto-learning', error);
//   }
// };
// runAutoLearning();
