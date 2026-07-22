const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

function formatDate(date) {
  return date.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// CSV : date une seule fois, en première ligne du fichier
function toCSV(prospects) {
  const exportDate = formatDate(new Date());

  const fields = [
    { label: 'Nom', value: 'nomComplet' },
    { label: 'Téléphone', value: 'numTelephone' },
    { label: 'Email', value: (row) => row.Email || '' },
    { label: 'Qualifié', value: (row) => (row.statut ? 'Oui' : 'Non') },
    { label: 'Statut conversation', value: (row) => row.conversation_statut || '' },
    { label: 'Score', value: (row) => (row.score !== null && row.score !== undefined ? row.score : '') },
  ];

  const parser = new Parser({ fields, delimiter: ';' });
  const dataCSV = parser.parse(prospects);

  // Ligne d'en-tête avec la date, avant les colonnes
  return `Export du ${exportDate}\n${dataCSV}`;
}

// PDF : un seul PDFDocument, écrit dans un buffer (pas de double-pipe)
function toPDFBuffer(prospects) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const exportDate = formatDate(new Date());

    doc.fontSize(16).text('Liste des prospects', { align: 'center' });
    doc.fontSize(9).fillColor('gray')
       .text(`Exporté le ${exportDate}`, { align: 'center' }); // une seule fois, en haut
    doc.fillColor('black');
    doc.moveDown();

    const cols = [
      { label: 'Nom', width: 110 },
      { label: 'Téléphone', width: 90 },
      { label: 'Email', width: 130 },
      { label: 'Qualifié', width: 55 },
      { label: 'Statut conv.', width: 65 },
      { label: 'Score', width: 45 },
    ];
    const startX = 30;
    let y = doc.y;

    const drawHeader = () => {
      doc.fontSize(10).font('Helvetica-Bold');
      let x = startX;
      cols.forEach((c) => {
        doc.text(c.label, x, y, { width: c.width });
        x += c.width;
      });
      y += 20;
      doc.font('Helvetica');
    };

    drawHeader();

    prospects.forEach((p) => {
      if (y > 750) {
        doc.addPage();
        y = 30;
        drawHeader();
      }
      let x = startX;
      const values = [
        p.nomComplet,
        p.numTelephone,
        p.Email || '-',
        p.statut ? 'Oui' : 'Non',
        p.conversation_statut || '-',
        p.score !== null && p.score !== undefined ? p.score : '-',
      ];
      values.forEach((val, i) => {
        doc.fontSize(9).text(String(val), x, y, { width: cols[i].width });
        x += cols[i].width;
      });
      y += 18;
    });

    doc.end();
  });
}

module.exports = { toCSV, toPDFBuffer };