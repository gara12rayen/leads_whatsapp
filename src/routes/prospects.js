const express = require('express');
const db      = require('../config/db');
const router  = express.Router();

// GET /api/prospects — list all
router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        p.id, p.nomComplet, p.numTelephone, p.Email, p.statut,
        p.societe_id, p.created_at, p.updated_at,
        c.id        AS conv_id,
        c.statut    AS conv_statut,
        c.dateDebut AS conv_dateDebut,
        COUNT(m.idMessage) AS message_count
       FROM prospects p
       LEFT JOIN conversations c ON c.prospect_id = p.id
       LEFT JOIN messages m ON m.conversation_id = c.id
       GROUP BY
         p.id, p.nomComplet, p.numTelephone, p.Email, p.statut,
         p.societe_id, p.created_at, p.updated_at,
         c.id, c.statut, c.dateDebut
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/prospects/dashboard/kpis — MUST be before /:id
router.get('/dashboard/kpis', async (_req, res) => {
  try {
    const [[totals]] = await db.query(`
      SELECT
        COUNT(*)       AS total,
        SUM(statut = 1) AS qualifies
      FROM prospects
    `);
    res.json({
      total:     Number(totals.total),
      qualifies: Number(totals.qualifies) || 0,
      taux:      totals.total > 0
        ? Math.round((Number(totals.qualifies) || 0) / Number(totals.total) * 100)
        : 0,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/prospects/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM prospects WHERE id = ?',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/prospects/:id — update statut
router.patch('/:id', async (req, res) => {
  try {
    const statut = req.body?.statut;
    if (statut === undefined) {
      return res.status(400).json({ error: 'statut is required' });
    }
    await db.query(
      'UPDATE prospects SET statut = ? WHERE id = ?',
      [statut, req.params.id]
    );
    res.json({ updated: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;