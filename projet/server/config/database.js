import mysql from 'mysql2/promise';

export const createConnection = async () => {
  return await mysql.createConnection({
    host: '192.168.11.31',
    user: 'remote_user',
    password: 'neser_gfc75',
    database: 'bot_resolutions',
    charset: 'utf8mb4' // Spécification explicite de l'encodage

  });
};