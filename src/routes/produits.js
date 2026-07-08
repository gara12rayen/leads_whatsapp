const express = require('express');
const db = require('../config/db');

const router = express.Router();

function toNumber(value) {
	if (value === undefined || value === null || value === '') return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : NaN;
}

function validateProduitPayload(body, partial = false) {
	const errors = [];
	const payload = {};

	if (!partial || body.nom !== undefined) {
		if (!body.nom || String(body.nom).trim() === '') {
			errors.push('nom is required');
		} else {
			payload.nom = String(body.nom).trim();
		}
	}

	if (!partial || body.quantite !== undefined) {
		const quantite = toNumber(body.quantite);
		if (!Number.isInteger(quantite) || quantite < 0) {
			errors.push('quantite must be a non-negative integer');
		} else {
			payload.quantite = quantite;
		}
	}

	if (!partial || body.prix !== undefined) {
		const prix = toNumber(body.prix);
		if (prix === null || Number.isNaN(prix) || prix < 0) {
			errors.push('prix must be a non-negative number');
		} else {
			payload.prix = prix;
		}
	}

	if (!partial || body.description !== undefined) {
		payload.description = body.description === undefined 
			? null 
			: String(body.description).trim() || null;
	}

	if (!partial || body.societe_id !== undefined) {
		const societeId = toNumber(body.societe_id);
		if (!Number.isInteger(societeId) || societeId <= 0) {
			errors.push('societe_id must be a positive integer');
		} else {
			payload.societe_id = societeId;
		}
	}

	return { errors, payload };
}

// GET /api/produits
router.get('/', async (req, res) => {
	try {
		const { societe_id } = req.query;
		const params = [];
		let where = '';

		if (societe_id !== undefined) {
			const parsedSocieteId = toNumber(societe_id);
			if (!Number.isInteger(parsedSocieteId) || parsedSocieteId <= 0) {
				return res.status(400).json({ error: 'societe_id must be a positive integer' });
			}
			where = 'WHERE p.societe_id = ?';
			params.push(parsedSocieteId);
		}

		const [rows] = await db.query(
			`SELECT p.id, p.nom, p.quantite, p.prix, p.description, p.societe_id, p.created_at, p.updated_at, s.nom AS societe_nom
			 FROM produits p
			 LEFT JOIN societes s ON s.id = p.societe_id
			 ${where}
			 ORDER BY p.created_at DESC`,
			params
		);

		res.json(rows);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// GET /api/produits/:id
router.get('/:id', async (req, res) => {
	try {
		const id = toNumber(req.params.id);
		if (!Number.isInteger(id) || id <= 0) {
			return res.status(400).json({ error: 'id must be a positive integer' });
		}

		const [rows] = await db.query(
			`SELECT p.id, p.nom, p.quantite, p.prix, p.description, p.societe_id, p.created_at, p.updated_at, s.nom AS societe_nom
			 FROM produits p
			 LEFT JOIN societes s ON s.id = p.societe_id
			 WHERE p.id = ?`,
			[id]
		);

		if (!rows[0]) {
			return res.status(404).json({ error: 'Produit not found' });
		}

		res.json(rows[0]);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// POST /api/produits
router.post('/', async (req, res) => {
	try {
		const { errors, payload } = validateProduitPayload(req.body, false);
		if (errors.length > 0) {
			return res.status(400).json({ errors });
		}

		const [result] = await db.query(
			`INSERT INTO produits (nom, quantite, prix, description, societe_id)
			 VALUES (?, ?, ?, ?, ?)`,
			[payload.nom, payload.quantite, payload.prix, payload.description, payload.societe_id]
		);

		res.status(201).json({
			message: 'Produit créé avec succès',
			produit: { id: result.insertId, ...payload }
		});
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// PUT /api/produits/:id
router.put('/:id', async (req, res) => {
	try {
		const id = toNumber(req.params.id);
		if (!Number.isInteger(id) || id <= 0) {
			return res.status(400).json({ error: 'id must be a positive integer' });
		}

		const { errors, payload } = validateProduitPayload(req.body, false);
		if (errors.length > 0) {
			return res.status(400).json({ errors });
		}

		const [result] = await db.query(
			`UPDATE produits SET nom = ?, quantite = ?, prix = ?, description = ?, societe_id = ? WHERE id = ?`,
			[payload.nom, payload.quantite, payload.prix, payload.description, payload.societe_id, id]
		);

		if (result.affectedRows === 0) {
			return res.status(404).json({ error: 'Produit not found' });
		}

		const [rows] = await db.query(
			`SELECT p.id, p.nom, p.quantite, p.prix, p.description, p.societe_id, p.created_at, p.updated_at, s.nom AS societe_nom
			 FROM produits p
			 LEFT JOIN societes s ON s.id = p.societe_id
			 WHERE p.id = ?`,
			[id]
		);

		res.json({
			message: 'Produit mis à jour avec succès',
			produit: rows[0]
		});
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// PATCH /api/produits/:id
router.patch('/:id', async (req, res) => {
	try {
		const id = toNumber(req.params.id);
		if (!Number.isInteger(id) || id <= 0) {
			return res.status(400).json({ error: 'id must be a positive integer' });
		}

		const { errors, payload } = validateProduitPayload(req.body, true);
		if (errors.length > 0) {
			return res.status(400).json({ errors });
		}

		const fields = [];
		const values = [];

		for (const key of ['nom', 'quantite', 'prix', 'description', 'societe_id']) {
			if (payload[key] !== undefined) {
				fields.push(`${key} = ?`);
				values.push(payload[key]);
			}
		}

		if (fields.length === 0) {
			return res.status(400).json({ error: 'at least one field is required' });
		}

		values.push(id);

		const [result] = await db.query(
			`UPDATE produits SET ${fields.join(', ')} WHERE id = ?`,
			values
		);

		if (result.affectedRows === 0) {
			return res.status(404).json({ error: 'Produit not found' });
		}

		const [rows] = await db.query(
			`SELECT p.id, p.nom, p.quantite, p.prix, p.description, p.societe_id, p.created_at, p.updated_at, s.nom AS societe_nom
			 FROM produits p
			 LEFT JOIN societes s ON s.id = p.societe_id
			 WHERE p.id = ?`,
			[id]
		);

		res.json({
			message: 'Produit mis à jour avec succès',
			produit: rows[0]
		});
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// DELETE /api/produits/:id
router.delete('/:id', async (req, res) => {
	try {
		const id = toNumber(req.params.id);
		if (!Number.isInteger(id) || id <= 0) {
			return res.status(400).json({ error: 'id must be a positive integer' });
		}

		const [result] = await db.query('DELETE FROM produits WHERE id = ?', [id]);

		if (result.affectedRows === 0) {
			return res.status(404).json({ error: 'Produit not found' });
		}

		res.json({ message: 'Suppression effectuée avec succès' });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

module.exports = router;