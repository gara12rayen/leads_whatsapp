const db = require('../config/db');

const Conversation = {
  create: async (prospect_id) => {
    const [result] = await db.query(
      'INSERT INTO conversations (dateDebut, statut, prospect_id) VALUES (NOW(), ?, ?)',
      ['EN_COURS', prospect_id]
    );
    return { id: result.insertId };
  },
  findByProspect: async (prospect_id) => {
    const [rows] = await db.query(
      'SELECT * FROM conversations WHERE prospect_id = ? ORDER BY dateDebut DESC LIMIT 1',
      [prospect_id]
    );
    return rows[0] || null;
  },
};

module.exports = { Conversation };