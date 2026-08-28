const express = require('express');
const twilio = require('twilio');
const { requireAuth } = require('./auth');
const { numbers, genId } = require('../db');

const router = express.Router();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// GET /numbers/available?country=US&type=local
// Cherche des numéros disponibles à l'achat chez Twilio
router.get('/available', requireAuth, async (req, res) => {
  const { country = 'US', type = 'Local' } = req.query;
  try {
    const results = await client
      .availablePhoneNumbers(country)
      [type]({ smsEnabled: true, voiceEnabled: true, limit: 10 })
      .fetch()
      .catch(() => null);

    // L'API Twilio renvoie une liste directement via .list(), on utilise ça à la place :
    const list = await client
      .availablePhoneNumbers(country)
      [type]
      .list({ smsEnabled: true, voiceEnabled: true, limit: 10 });

    res.json(
      list.map(n => ({
        phoneNumber: n.phoneNumber,
        locality: n.locality,
        region: n.region,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur recherche numéros', details: err.message });
  }
});

// POST /numbers/purchase  { phoneNumber: "+15551234567" }
// Achète le numéro chez Twilio et le rattache à l'utilisateur connecté
router.post('/purchase', requireAuth, async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber requis' });

  try {
    const purchased = await client.incomingPhoneNumbers.create({
      phoneNumber,
      smsUrl: `${process.env.PUBLIC_BASE_URL}/webhooks/sms`,
      voiceUrl: `${process.env.PUBLIC_BASE_URL}/webhooks/voice`,
    });

    const id = genId();
    const record = {
      id,
      userId: req.userId,
      twilioSid: purchased.sid,
      phoneNumber: purchased.phoneNumber,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    numbers.set(id, record);

    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'achat du numéro", details: err.message });
  }
});

// GET /numbers/mine — liste des numéros de l'utilisateur connecté
router.get('/mine', requireAuth, (req, res) => {
  const mine = [...numbers.values()].filter(n => n.userId === req.userId);
  res.json(mine);
});

module.exports = router;
