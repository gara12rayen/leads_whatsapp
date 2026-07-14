import { useCallback, useMemo, useState } from 'react';
import { createProduit, deleteProduit, getProduits, getSocietes, updateProduit } from '../services/api.js';
import useFetch from '../hooks/useFetch.js';
import { KpiCard, ChartCanvas, EmptyState, Legend } from '../components/ui/index.js';

const formatNumber = (value) => new Intl.NumberFormat('fr-FR').format(Number(value || 0));
const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(value || 0));

const emptyForm = {
  nom: '',
  quantite: '',
  prix: '',
  description: '',
  societe_id: '',
};

export default function Produits() {
  const { data: produits = [], loading, error, refresh } = useFetch(getProduits, [], []);
  const { data: societes = [], loading: societeLoading } = useFetch(getSocietes, [], []);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const total = produits.length;
  const totalStock = useMemo(() => produits.reduce((sum, p) => sum + Number(p.quantite || 0), 0), [produits]);
  const totalValue = useMemo(() => produits.reduce((sum, p) => sum + Number(p.quantite || 0) * Number(p.prix || 0), 0), [produits]);
  const avgPrice = total ? Math.round(produits.reduce((sum, p) => sum + Number(p.prix || 0), 0) / total) : 0;
  const stockBySociete = useMemo(() => {
    return [...new Set(produits.map((item) => item.societe_nom || item.societe))].map((societe) => ({
      societe,
      quantity: produits.filter((item) => (item.societe_nom || item.societe) === societe).reduce((sum, item) => sum + Number(item.quantite || 0), 0),
    }));
  }, [produits]);

  const canSubmit = form.nom.trim() && form.societe_id && Number(form.quantite) >= 0 && Number(form.prix) >= 0;

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setStatusMessage('');
  }, []);

  const handleInput = useCallback((event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }, []);

  const handleEdit = useCallback((produit) => {
    setEditingId(produit.id);
    setForm({
      nom: produit.nom || '',
      quantite: produit.quantite?.toString() || '0',
      prix: produit.prix?.toString() || '0',
      description: produit.description || '',
      societe_id: produit.societe_id?.toString() || '',
    });
    setStatusMessage('');
    setFormError('');
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Confirmer la suppression de ce produit ?')) return;
    setSaving(true);
    setFormError('');
    setStatusMessage('');

    try {
      await deleteProduit(id);
      await refresh();
      if (editingId === id) {
        resetForm();
      }
      setStatusMessage('Produit supprimé avec succès.');
    } catch (fetchError) {
      setFormError(fetchError.message || 'Impossible de supprimer le produit.');
    } finally {
      setSaving(false);
    }
  }, [editingId, refresh, resetForm]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    setFormError('');
    setStatusMessage('');

    if (!canSubmit) {
      setFormError('Veuillez renseigner le nom, la société, la quantité et le prix.');
      return;
    }

    const payload = {
      nom: form.nom.trim(),
      quantite: Number(form.quantite),
      prix: Number(form.prix),
      description: form.description.trim() || null,
      societe_id: Number(form.societe_id),
    };

    setSaving(true);

    try {
      if (editingId) {
        await updateProduit(editingId, payload);
        setStatusMessage('Produit mis à jour avec succès.');
      } else {
        await createProduit(payload);
        setStatusMessage('Produit ajouté avec succès.');
      }
      resetForm();
      await refresh();
    } catch (fetchError) {
      setFormError(fetchError.message || 'Impossible de sauvegarder le produit.');
    } finally {
      setSaving(false);
    }
  }, [canSubmit, editingId, form, refresh, resetForm]);

  return (
    <div>
      <div className="topbar-actions">
        <button className="btn-refresh" onClick={refresh} disabled={loading || saving}>
          {loading ? 'Actualisation…' : 'Actualiser'}
        </button>
      </div>

      {error && <div className="error-banner">Erreur de chargement : {error}</div>}
      {!produits.length && loading && <EmptyState label="Chargement des produits…" />}

      <section className="kpi-grid">
        <KpiCard label="Produits actifs" value={formatNumber(total)} delta="toutes sociétés" />
        <KpiCard label="Unités en stock" value={formatNumber(totalStock)} delta="toutes références" />
        <KpiCard label="Valeur du stock" value={formatCurrency(totalValue)} delta="quantité × prix" />
        <KpiCard label="Prix moyen" value={formatCurrency(avgPrice)} delta="par produit" />
      </section>

      <section className="panel product-management-panel">
        <div className="panel-head">
          <div>
            <h2>Gestion des produits</h2>
            <p className="hint">Ajoutez, modifiez ou supprimez les produits directement depuis le tableau.</p>
          </div>
          <button className="btn-secondary" type="button" onClick={resetForm} disabled={saving}>
            Nouveau produit
          </button>
        </div>

        <form className="product-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="form-group">
              <span>Nom du produit</span>
              <input type="text" name="nom" value={form.nom} onChange={handleInput} placeholder="Nom du produit" />
            </label>
            <label className="form-group">
              <span>Société</span>
              <select name="societe_id" value={form.societe_id} onChange={handleInput} disabled={societeLoading}>
                <option value="">Choisir une société</option>
                {societes.map((societe) => (
                  <option key={societe.id} value={societe.id}>{societe.nom}</option>
                ))}
              </select>
            </label>
            <label className="form-group">
              <span>Quantité</span>
              <input type="number" name="quantite" value={form.quantite} onChange={handleInput} min="0" />
            </label>
            <label className="form-group">
              <span>Prix</span>
              <input type="number" name="prix" value={form.prix} onChange={handleInput} min="0" step="0.01" />
            </label>
            <label className="form-group form-fullwidth">
              <span>Description</span>
              <textarea name="description" value={form.description} onChange={handleInput} rows="2" placeholder="Description facultative" />
            </label>
          </div>

          {(formError || statusMessage) && (
            <div className={`form-message ${formError ? 'error' : 'success'}`}>
              {formError || statusMessage}
            </div>
          )}

          <div className="form-actions">
            <button className="btn-primary" type="submit" disabled={saving}>
              {editingId ? 'Mettre à jour le produit' : 'Ajouter le produit'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={resetForm} disabled={saving}>
                Annuler
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Tableau des produits</h2>
          <span className="hint">{total} produits</span>
        </div>
        <div className="table-wrap">
          <table className="table table-with-actions">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Société</th>
                <th>Quantité</th>
                <th>Prix</th>
                <th>Valeur stock</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {produits.map((product) => (
                <tr key={product.id}>
                  <td className="lead-name">{product.nom}</td>
                  <td className="lead-channel">{product.societe_nom || product.societe}</td>
                  <td className="num">{product.quantite}</td>
                  <td className="num">{formatCurrency(product.prix)}</td>
                  <td className="num">{formatCurrency(Number(product.quantite || 0) * Number(product.prix || 0))}</td>
                  <td>{product.description || '—'}</td>
                  <td className="actions-cell">
                    <button type="button" className="btn-secondary small" onClick={() => handleEdit(product)}>
                      Éditer
                    </button>
                    <button type="button" className="btn-danger small" onClick={() => handleDelete(product.id)} disabled={saving}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!produits.length && <EmptyState label="Aucun produit enregistré." />}
        </div>
      </section>
    </div>
  );
}
