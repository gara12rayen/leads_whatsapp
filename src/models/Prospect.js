const db = require('../config/db');

const Prospect = {
  findByPhone: async (phone) => {
    const [rows] = await db.query(
      'SELECT * FROM prospects WHERE numTelephone = ?', [phone]
    );
    return rows[0] || null;
  },

  create: async ({ nomComplet, numTelephone, Email, societe_id }) => {
    const [result] = await db.query(
      `INSERT INTO prospects
        (nomComplet, numTelephone, Email, statut, societe_id)
       VALUES (?, ?, ?, ?, ?)`,
      [nomComplet, numTelephone, Email, false, societe_id || 1]
    );
    return { id: result.insertId, nomComplet, numTelephone };
  },

  setQualified: async (id) => {
    await db.query(
      'UPDATE prospects SET statut = ? WHERE id = ?', [true, id]
    );
  },

  // NOUVEAU : liste tous les prospects d'une société avec leur dernier score
  getAllWithScores: async (societe_id) => {
    const [rows] = await db.query(
      `SELECT
         p.id, p.nomComplet, p.numTelephone, p.Email, p.statut,
         c.id AS conversation_id, c.statut AS conversation_statut,
         i.score, i.created_at AS score_date
       FROM prospects p
       LEFT JOIN conversations c ON c.prospect_id = p.id
       LEFT JOIN interactions i ON i.conversation_id = c.id
       WHERE p.societe_id = ?
       ORDER BY p.id, i.created_at DESC`,
      [societe_id]
    );

    // ne garder que la ligne la plus récente (score le plus récent) par prospect
    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.id)) map.set(row.id, row);
    }
    return Array.from(map.values());
  },
};

module.exports = { Prospect };