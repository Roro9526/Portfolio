import { io } from 'socket.io-client';

// Détecter l'URL du serveur en fonction de l'environnement
const getServerUrl = () => {
    // Si une variable d'environnement est définie, l'utiliser
    if (import.meta.env.VITE_SERVER_URL) {
        return import.meta.env.VITE_SERVER_URL;
    }

    // Sinon, utiliser le même hôte que le frontend
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;

    // Si on est sur le port 30080 (K8s NodePort), le backend est sur 30001
    if (port === '30080') {
        return `${protocol}//${hostname}:30001`;
    }

    // Si on est sur le port 80 ou vide (Ingress / Production), on utilise le même hôte
    // L'Ingress s'occupera de router /socket.io vers le backend
    if (port === '80' || port === '') {
        return `${protocol}//${hostname}`;
    }

    // Par défaut (Docker/Local), port 3001
    return `${protocol}//${hostname}:3001`;
};

const SERVER_URL = getServerUrl();

console.log('Connecting to Socket.io server:', SERVER_URL);

export const socket = io(SERVER_URL, {
    autoConnect: false
});

export default socket;
