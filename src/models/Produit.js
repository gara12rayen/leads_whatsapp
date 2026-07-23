const db = require('../config/db');

const Produit = {
  getAllBySociete: async (societe_id) => {
    const [rows] = await db.query(
      'SELECT nom, quantite, prix, description FROM produits WHERE societe_id = ? AND quantite > 0',
      [societe_id]
    );
    return rows;
  },
};

module.exports = { Produit };