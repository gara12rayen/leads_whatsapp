const ENDPOINTS = {
  dashboard: '/api/dashboard/summary',
  prospects: '/api/dashboard/prospects',
  conversations: '/api/dashboard/conversations',
  produits: '/api/produits',
  societes: '/api/dashboard/societes',
};

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const content = await response.text();
    let message = `Erreur ${response.status}`;
    try {
      const json = JSON.parse(content);
      message = json.error || json.message || message;
    } catch (_error) {
      // use default message
    }
    throw new Error(message);
  }
  return response.json();
}

async function postJson(url, body) {
  return fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function putJson(url, body) {
  return fetchJson(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function deleteJson(url) {
  return fetchJson(url, { method: 'DELETE' });
}

export function getDashboard() {
  return fetchJson(ENDPOINTS.dashboard);
}

export function getProspects() {
  return fetchJson(ENDPOINTS.prospects);
}

export function getConversations() {
  return fetchJson(ENDPOINTS.conversations);
}

export function getProduits() {
  return fetchJson(ENDPOINTS.produits);
}

export function createProduit(produit) {
  return postJson(ENDPOINTS.produits, produit);
}

export function updateProduit(id, produit) {
  return putJson(`${ENDPOINTS.produits}/${id}`, produit);
}

export function deleteProduit(id) {
  return deleteJson(`${ENDPOINTS.produits}/${id}`);
}

export function getSocietes() {
  return fetchJson(ENDPOINTS.societes);
}
