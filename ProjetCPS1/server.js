const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', apiRoutes);

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.stack);
    res.status(500).json({
        error: 'Erreur serveur',
        message: err.message
    });
});

// Start server
// Start server (HTTPS)
const fs = require('fs');
const https = require('https');
const http = require('http'); // [NEW] Module HTTP pour la redirection

try {
    const httpsOptions = {
        key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem'))
    };

    // 1. Serveur HTTPS Principal
    https.createServer(httpsOptions, app).listen(PORT, () => {
        console.log(`🔒 Serveur HTTPS démarré sur https://localhost:${PORT}`);

        // Afficher l'adresse IP locale pour l'accès mobile
        const { networkInterfaces } = require('os');
        const nets = networkInterfaces();
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                if (net.family === 'IPv4' && !net.internal) {
                    console.log(`📱 Accessible sur mobile via : https://${net.address}:${PORT}`);
                }
            }
        }
        console.log(`📊 Dashboard CA disponible sur https://localhost:${PORT}`);
        console.log(`⚠️  Note : Acceptez l'avertissement de sécurité (auto-signé) dans le navigateur.`);
    });

    // 2. Serveur HTTP de Redirection (Port 80 -> HTTPS Port)
    http.createServer((req, res) => {
        const host = req.headers.host.split(':')[0]; // Récupère l'IP ou le nom de domaine sans le port
        res.writeHead(301, { "Location": `https://${host}:${PORT}${req.url}` });
        res.end();
    }).listen(80, () => {
        console.log(`🔄 Redirection HTTP (Port 80) active vers HTTPS (Port ${PORT})`);
    }).on('error', (err) => {
        console.log(`⚠️  Impossible de lancer la redirection sur le port 80 (Déjà utilisé ou permission refusée).`);
        console.log(`   Accédez directement via https://...`);
    });

} catch (e) {
    console.error("❌ Erreur au démarrage HTTPS :", e.message);
    console.log("⚠️ Verifiez que les certificats sont bien dans le dossier 'certs'");
}
