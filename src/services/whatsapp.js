const BASE_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
const TOKEN    = process.env.WHATSAPP_TOKEN;

// Send a plain text message
async function sendText(to, text) {
  const res = await fetch(BASE_URL, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`WhatsApp send failed: ${JSON.stringify(err)}`);
  }

  return res.json();
}

// Mark incoming message as read
async function markRead(messageId) {
  const res = await fetch(BASE_URL, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status:     'read',
      message_id: messageId,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`markRead failed: ${JSON.stringify(err)}`);
  }

  return res.json();
}

module.exports = { sendText, markRead };