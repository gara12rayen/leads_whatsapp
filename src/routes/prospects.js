const express  = require('express');
const db       = require('../config/db');
const router   = express.Router();

// GET /api/prospects — list all
router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, 
        c.id as conv_id, c.statut as conv_statut,
        COUNT(m.id) as message_count
       FROM prospects p
       LEFT JOIN conversations c ON c.prospect_id = p.id
       LEFT JOIN messages m ON m.conversation_id = c.id
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/prospects/:id
router.get('/:id', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM prospects WHERE id = ?', [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// PATCH /api/prospects/:id — update statut
router.patch('/:id', async (req, res) => {
  const { statut } = req.body;
  await db.query(
    'UPDATE prospects SET statut = ? WHERE id = ?',
    [statut, req.params.id]
  );
  res.json({ updated: true });
});

// GET /api/prospects/dashboard/kpis
router.get('/dashboard/kpis', async (_req, res) => {
  const [[totals]] = await db.query(`
    SELECT
      COUNT(*) as total,
      SUM(statut = 1) as qualifies
    FROM prospects`);
  res.json({
    total:      totals.total,
    qualifies:  totals.qualifies,
    taux:       totals.total > 0
      ? Math.round(totals.qualifies / totals.total * 100)
      : 0,
  });
});

module.exports = router;