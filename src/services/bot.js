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

    // Save incoming Message
    await Message.create({
      conversation_id: conv.id,
      contenu:         content,
    });
    console.log('Message saved');

    // Mark as read
    if (process.env.WHATSAPP_TOKEN) {
      const { markRead } = require('./whatsapp');
      try {
        await markRead(msgId);
        console.log('Message marked as read');
      } catch (e) {
        console.warn('markRead failed:', e.message);
      }
    }

    // Generate AI reply
    if (process.env.GROQ_API_KEY) {

      // Load conversation history for context
      // FIX: LIMIT 10 avec ORDER BY ASC prenait les 10 PLUS ANCIENS messages.
      // On récupère les 10 plus récents (DESC) puis on les remet dans l'ordre chronologique.
      const db = require('../config/db');
      const [prevMessages] = await db.query(
        `SELECT contenu, idMessage FROM (
           SELECT contenu, idMessage FROM messages
           WHERE conversation_id = ?
           ORDER BY idMessage DESC
           LIMIT 10
         ) t ORDER BY idMessage ASC`,
        [conv.id]
      );

      // Build message history for Groq
      // NOTE: le mapping par index (pair/impair) suppose une alternance parfaite
      // prospect/bot. Si un envoi échoue ou si le prospect envoie 2 messages de suite,
      // l'alternance casse. Idéalement, ajoute une colonne `sender` ('prospect'|'bot')
      // à la table messages et remplace ce bloc par :
      // const history = prevMessages.map(m => ({
      //   role: m.sender === 'bot' ? 'assistant' : 'user',
      //   content: m.contenu,
      // }));
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

      // DEBUG: log de la structure complète pour diagnostiquer une réponse vide
      console.log('Groq raw choice:', JSON.stringify(completion.choices[0], null, 2));

      const aiReply = completion.choices?.[0]?.message?.content?.trim();

      // FIX: si Groq renvoie un contenu vide, on ne sauvegarde rien
      // et on n'appelle pas sendText avec un body vide (ce qui causait l'erreur 100).
      if (!aiReply) {
        console.error('Groq a renvoyé un contenu vide — envoi annulé');
        return;
      }

      console.log('Groq reply:', aiReply);

      // Save bot reply as Message
      await Message.create({
        conversation_id: conv.id,
        contenu:         aiReply,
      });

      // Send reply via WhatsApp
      if (process.env.WHATSAPP_TOKEN) {
        const { sendText } = require('./whatsapp');
        try {
          await sendText(phone, aiReply);
          console.log('Reply sent via WhatsApp');
        } catch (e) {
          console.warn('sendText failed:', e.message);
        }
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