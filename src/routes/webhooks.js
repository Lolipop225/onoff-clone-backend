const express = require('express');
const { messages, numbers, genId } = require('../db');

const router = express.Router();

// Twilio appelle cette URL à chaque SMS reçu sur un numéro acheté
// (configurée automatiquement lors de l'achat, voir numbers.js -> smsUrl)
router.post('/sms', (req, res) => {
  const { From, To, Body } = req.body;

  const target = [...numbers.values()].find(n => n.phoneNumber === To);
  if (target) {
    messages.push({
      id: genId(),
      numberId: target.id,
      from: From,
      to: To,
      body: Body,
      direction: 'inbound',
      createdAt: new Date().toISOString(),
    });
    // TODO : envoyer une notification push à l'utilisateur (Firebase Cloud Messaging / Expo Push)
  }

  // Réponse TwiML vide = ne pas répondre automatiquement au SMS
  res.set('Content-Type', 'text/xml');
  res.send('<Response></Response>');
});

// Twilio appelle cette URL à chaque appel entrant sur un numéro acheté
router.post('/voice', (req, res) => {
  const twiml = `
    <Response>
      <Say language="fr-FR">Bienvenue. Redirection de votre appel.</Say>
      <Dial>
        <Client>${req.body.To || 'default'}</Client>
      </Dial>
    </Response>
  `;
  res.set('Content-Type', 'text/xml');
  res.send(twiml);
});

module.exports = router;
