import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const createConnection = async () => {
  try {
    const connection = await mysql.createConnection({
      host: '192.168.10.102',
      user: 'remote_user',
      password: 'neser_gfc75',
      database: 'bot_resolutions',
    });
    
    console.log('✅ Connexion à la base de données établie');
    return connection;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    throw error;
  }
};