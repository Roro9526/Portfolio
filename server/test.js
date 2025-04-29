import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('Serveur fonctionne ! 🚀');
});

app.listen(3000, () => {
  console.log('Serveur démarré sur http://localhost:3000');
  console.log('Serveur démarré sur http://localhost:3000');
});
