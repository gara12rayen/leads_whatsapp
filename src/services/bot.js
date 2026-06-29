const { Prospect, Conversation } = require('../models/Prospect');
const Message   = require('../models/Message');
const { sendText, markRead } = require('./whatsapp');
const OpenAI    = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function handleIncomingMessage({ phone, name, content, ts, msgId }) {
  try {
    // 1. Find or create Prospect
    let prospect = await Prospect.findByPhone(phone);
    if (!prospect) {
      prospect = await Prospect.create({
        nomComplet:    name,
        numTelephone:  phone,
        Email:         '',
      });
      console.log(`New prospect created: ${prospect.id}`);
    }

    // 2. Find or open Conversation
    let conv = await Conversation.findByProspect(prospect.id);
    if (!conv) {
      conv = await Conversation.create(prospect.id);
    }

    // 3. Save incoming Message
    await Message.create({
      conversation_id: conv.id,
      contenu:         content,
    });

    // 4. Mark as read
    await markRead(msgId);

    // 5. Generate AI reply
    const aiReply = await generateReply(name, content);

    // 6. Save bot Message
    await Message.create({
      conversation_id: conv.id,
      contenu:         aiReply,
    });

    // 7. Send reply via WhatsApp
    await sendText(phone, aiReply);

  } catch (err) {
    console.error('handleIncomingMessage error:', err.message);
  }
}

async function generateReply(name, message) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: `Tu es un assistant commercial.
Qualifie le prospect ${name} en posant des questions
sur son besoin, budget et délai. Sois concis (2-3 phrases max).` },
      { role: 'user', content: message },
    ],
    max_tokens: 200,
  });
  return completion.choices[0].message.content;
}

module.exports = { handleIncomingMessage };