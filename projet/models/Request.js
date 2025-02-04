import { createConnection } from '../config/database.js';

export const saveRequest = async (userMessage, solutionId) => {
  const connection = await createConnection();
  try {
    const [result] = await connection.query(
      'INSERT INTO requete (demande, solutionId, validation) VALUES (?, ?, ?)',
      [userMessage, solutionId, false]
    );
    return result.insertId;
  } finally {
    await connection.end();
  }
};