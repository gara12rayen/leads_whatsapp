const Groq = require('groq-sdk');

/**
 * Analyse les messages d'un prospect avec un LLM et retourne un score qualifié.
 * @param {Groq} groq - Instance Groq initialisée
 * @param {string[]} prospectMessages - Tableau des messages du prospect
 * @returns {Promise<{score: number, status: string, intention: string, justification: string}>}
 */
async function calculateScoreWithLLM(groq, prospectMessages) {
  const conversationText = prospectMessages
    .map((msg, i) => `Message ${i + 1}: ${msg}`)
    .join('\n');

  const systemPrompt = `Tu es un expert en qualification commerciale.
Analyse les messages d'un prospect et évalue son niveau d'intérêt commercial sur une échelle de 0 à 100.

RÈGLES DE SCORING STRICTES :
- Score 70-100 (forte/CHAUDE) : Engagement FERME uniquement
  * "je prends", "je signe", "je confirme", "je veux acheter"
  * "envoyez le contrat", "comment payer", "je suis prêt à commander"
  * Budget + urgence + intention claire SANS hésitation

- Score 35-69 (moyenne/EN_COURS) : Intérêt réel mais pas d'engagement final
  * "je suis intéressé", "ça m'intéresse", "j'aimerais en savoir plus"
  * Budget mentionné mais avec question ("c'est possible ?", "combien ?")
  * Curiosité active avec implication

- Score 0-34 (faible/FERMEE) : Pas d'engagement
  * Simple question "c'est quoi ?", "comment ça marche ?"
  * Désintérêt, objection, "je vais réfléchir"

IMPORTANT :
- "Je suis intéressé" + question = 40-55 (moyenne, pas chaude)
- "Je suis intéressé" + "je prends" + budget = 70+ (chaude)
- Une question comme "c'est possible ?" ou "combien ?" = baisse le score de 10-15 points

Réponds UNIQUEMENT en JSON valide, sans texte autour, format exact :
{
  "score": nombre entre 0 et 100,
  "status": "faible" ou "moyenne" ou "forte",
  "intention": "achat" ou "information" ou "devis" ou "indetermine",
  "justification": "une phrase courte expliquant le score"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: conversationText },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    const score = Math.min(100, Math.max(0, Math.round(parsed.score ?? 0)));
    
    // Forcer le statut selon les seuils
    let status;
    if (score >= 70) {
      status = 'forte';
    } else if (score >= 35) {
      status = 'moyenne';
    } else {
      status = 'faible';
    }

    return {
      score,
      status,
      intention: parsed.intention ?? 'indetermine',
      justification: parsed.justification ?? '',
    };
  } catch (error) {
    console.warn('Scoring LLM échoué, fallback à un score neutre:', error.message);
    return { score: 40, status: 'moyenne', intention: 'indetermine', justification: 'analyse indisponible - score par défaut' };
  }
}

/**
 * Sauvegarde le score dans interactions et met à jour le statut de la conversation.
 * @param {object} db - Connexion/pool MySQL
 * @param {number} conversationId - ID de la conversation
 * @param {number} score - Score numérique (0-100)
 * @param {string} status - Statut textuel ('faible'|'moyenne'|'forte')
 */
async function saveScore(db, conversationId, score, status) {
  // 1. Met à jour ou crée le score dans interactions
  const [existing] = await db.query(
    `SELECT id FROM interactions WHERE conversation_id = ?`,
    [conversationId]
  );

  if (existing.length > 0) {
    await db.query(
      `UPDATE interactions SET score = ? WHERE conversation_id = ?`,
      [score, conversationId]
    );
  } else {
    await db.query(
      `INSERT INTO interactions (score, conversation_id) VALUES (?, ?)`,
      [score, conversationId]
    );
  }

  // 2. Met à jour le statut de la conversation
  // score >= 70  → CHAUDE (forte)
  // score 35-69  → EN_COURS (moyenne)  
  // score 0-34   → FERMEE (faible)
  let conversationStatus;
  if (score >= 70) {
    conversationStatus = 'CHAUDE';
  } else if (score >= 35) {
    conversationStatus = 'EN_COURS';
  } else {
    conversationStatus = 'FERMEE';
  }

  await db.query(
    `UPDATE conversations SET statut = ? WHERE id = ?`,
    [conversationStatus, conversationId]
  );
}

module.exports = {
  calculateScoreWithLLM,
  saveScore,
};