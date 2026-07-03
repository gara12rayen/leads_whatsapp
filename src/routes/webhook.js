const express = require('express');
const crypto  = require('crypto');
const { handleIncomingMessage } = require('../services/bot');

const router = express.Router();
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

// ── Webhook verification (GET) ──────────────────────────────
router.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified by Meta');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ── Validate HMAC-SHA256 signature ──────────────────────────
function validateSignature(req) {
  // Bypass in test/dev mode
  if (process.env.NODE_ENV === 'test') return true;

  const sig = req.headers['x-hub-signature-256'] || '';
  const expected = 'sha256=' + crypto
    .createHmac('sha256', APP_SECRET)
    .update(req.rawBody)
    .digest('hex');

  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(sig), Buffer.from(expected)
  );
}

// ── Receive messages (POST) ─────────────────────────────────
router.post('/webhook', (req, res) => {
  if (!validateSignature(req)) return res.sendStatus(401);

  res.sendStatus(200);

  const body = req.body;
  if (body.object !== 'whatsapp_business_account') return;

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;

      if (value.messages) {
        const msg     = value.messages[0];
        const contact = value.contacts?.[0];
        handleIncomingMessage({
          phone:   msg.from,
          name:    contact?.profile?.name || 'Inconnu',
          content: msg.text?.body || '',
          ts:      msg.timestamp,
          msgId:   msg.id,
        }).catch(console.error);
      }

      if (value.statuses) {
        const s = value.statuses[0];
        console.log(`Status ${s.id}: ${s.status}`);
      }
    }
  }
});

module.exports = router;