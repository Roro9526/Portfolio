import { createConnection } from '../config/database.js';

// Fonction pour récupérer tous les utilisateurs
export const getAllUsers = async () => {
  const connection = await createConnection();
  try {
    const [rows] = await connection.query('SELECT id, login, libelle, role FROM user');
    return rows;
  } finally {
    await connection.end();
  }
};

// Fonction pour mettre à jour le rôle d'un utilisateur
export const updateUserRole = async (id, role) => {
  const connection = await createConnection();
  try {
    await connection.query('UPDATE user SET role = ? WHERE id = ?', [role, id]);
  } finally {
    await connection.end();
  }
};
