const { Prospect, Conversation } = require('../models/Prospect');
const Message = require('../models/Message');
const Groq = require('groq-sdk');



async function handleIncomingMessage({ phone, name, content, ts, msgId }) {
  console.log('=== handleIncomingMessage ===', { phone, name, content });
  try {

    // Find or create Prospect
    let prospect = await Prospect.findByPhone(phone);
    if (!prospect) {
      prospect = await Prospect.create({
        nomComplet:   name,
        numTelephone: phone,
        Email:        '',
      });
      console.log(`New prospect created: ${prospect.id}`);
    } else {
      console.log(`Existing prospect found: ${prospect.id}`);
    }

    // Find or open Conversation 
    let conv = await Conversation.findByProspect(prospect.id);
    if (!conv) {
      conv = await Conversation.create(prospect.id);
      console.log(`New conversation created: ${conv.id}`);
    }

    //Save incoming Message
    await Message.create({
      conversation_id: conv.id,
      contenu:         content,
    });
    console.log('Message saved');

    //Mark as read
    if (process.env.WHATSAPP_TOKEN) {
      const { markRead } = require('./whatsapp');
      await markRead(msgId).catch(e => console.warn('markRead failed:', e.message));
    }

    //Generate AI reply
    if (process.env.GROQ_API_KEY) {

      // Load conversation history for context
      const db = require('../config/db');
      const [prevMessages] = await db.query(
        `SELECT contenu, idMessage FROM messages
         WHERE conversation_id = ?
         ORDER BY idMessage ASC
         LIMIT 10`,
        [conv.id]
      );

      // Build message history for Groq
      const history = prevMessages.map((m, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: m.contenu,
      }));

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant commercial chaleureux et professionnel.
Tu qualifies le prospect ${name} en posant des questions sur :
1. Son besoin principal
2. Son budget
3. Son délai de décision
Réponds toujours en 2-3 phrases maximum. Sois naturel et humain.
Si le prospect a répondu à toutes les questions, résume et dis que l'équipe va le contacter.`,
          },
          ...history,
        ],
      });

      const aiReply = completion.choices[0].message.content;
      console.log('Groq reply:', aiReply);

      // Save bot reply as Message
      await Message.create({
        conversation_id: conv.id,
        contenu:         aiReply,
      });

      // Send reply via WhatsApp
      if (process.env.WHATSAPP_TOKEN) {
        const { sendText } = require('./whatsapp');
        await sendText(phone, aiReply)
          .catch(e => console.warn('sendText failed:', e.message));
        console.log('Reply sent via WhatsApp');
      } else {
        console.log('No WHATSAPP_TOKEN — reply saved to DB only');
      }

    } else {
      console.log('No GROQ_API_KEY — skipping AI reply');
    }

  } catch (err) {
    console.error('handleIncomingMessage error:', err.message);
  }
}


module.exports = { handleIncomingMessage };