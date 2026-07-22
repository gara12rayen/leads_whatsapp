const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { Prospect } = require('../models/prospect');
const { toCSV, toPDFBuffer } = require('../services/export');

const EXPORT_DIR = path.join(__dirname, '..', 'exports');
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });

function buildFilename(format) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  return `prospects_${stamp}.${format}`;
}

router.get('/export', async (req, res) => {
  try {
    const format = req.query.format === 'pdf' ? 'pdf' : 'csv';
    const societeId = req.user?.societeId || 1;
    const prospects = await Prospect.getAllWithScores(societeId);

    if (prospects.length === 0) {
      return res.status(404).json({ error: 'Aucun prospect à exporter' });
    }

    const filename = buildFilename(format);
    const filepath = path.join(EXPORT_DIR, filename);

    if (format === 'csv') {
      const csv = '\uFEFF' + toCSV(prospects);
      fs.writeFileSync(filepath, csv, 'utf8');
      res.header('Content-Type', 'text/csv; charset=utf-8');
      return res.attachment(filename).send(csv);
    }

    // PDF : généré en buffer une seule fois, sauvegardé, puis envoyé
    const buffer = await toPDFBuffer(prospects);
    fs.writeFileSync(filepath, buffer);
    res.header('Content-Type', 'application/pdf');
    return res.attachment(filename).send(buffer);

  } catch (err) {
    console.error('Erreur export prospects:', err);
    res.status(500).json({ error: "Erreur lors de l'export" });
  }
});

router.get('/export/history', (req, res) => {
  const files = fs.readdirSync(EXPORT_DIR)
    .filter(f => f.endsWith('.csv') || f.endsWith('.pdf'))
    .map(f => {
      const stats = fs.statSync(path.join(EXPORT_DIR, f));
      return { filename: f, date: stats.mtime, size: stats.size };
    })
    .sort((a, b) => b.date - a.date);
  res.json(files);
});

module.exports = router;