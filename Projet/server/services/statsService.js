import { createConnection } from '../config/database.js';

export const getStats = async () => {
  const connection = await createConnection();
  
  try {
    // Total questions
    const [totalQuestions] = await connection.query(
      'SELECT COUNT(*) as count FROM requete'
    );

    // Validated questions
    const [validatedQuestions] = await connection.query(
      'SELECT COUNT(*) as count FROM requete WHERE validation = TRUE'
    );

    // Pending questions
    const [pendingQuestions] = await connection.query(
      'SELECT COUNT(*) as count FROM requete WHERE validation = FALSE'
    );

    // Feedback stats
    const [feedbackStats] = await connection.query(`
  SELECT
    SUM(CASE WHEN validation = 1 THEN 1 ELSE 0 END) AS positive,
    SUM(CASE WHEN validation = 0 THEN 1 ELSE 0 END) AS negative
  FROM requete
    `);

    // Daily questions for the last 7 days
    const [dailyQuestions] = await connection.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM reponseia
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Top categories
    const [topCategories] = await connection.query(`
SELECT category, COUNT(*) as count
FROM (
  SELECT 
    CASE
      WHEN LOWER(message) LIKE '%outlook%' THEN 'Outlook'
      WHEN LOWER(message) LIKE '%citrix%' THEN 'Citrix'
      WHEN LOWER(message) LIKE '%matériel%' OR LOWER(message) LIKE '%materiel%' THEN 'Matériel'
      WHEN LOWER(message) LIKE '%teams%' THEN 'Teams'
      WHEN LOWER(message) LIKE '%communicator%' THEN 'Communicator'
      ELSE 'Autres'
    END AS category
  FROM resolution
) AS subquery
GROUP BY category
ORDER BY count DESC
LIMIT 5;

    `);

    return {
      totalQuestions: totalQuestions[0].count,
      totalValidated: validatedQuestions[0].count,
      totalPending: pendingQuestions[0].count,
      feedbackStats: {
        positive: feedbackStats[0].positive || 0,
        negative: feedbackStats[0].negative || 0
      },
      dailyQuestions: dailyQuestions.map(item => ({
        date: item.date.toISOString().split('T')[0],
        count: item.count
      })),
      topCategories: topCategories.map(item => ({
        category: item.category,
        count: item.count
      }))
    };
  } finally {
    await connection.end();
  }
};