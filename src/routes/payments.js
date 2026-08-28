const express = require('express');
const axios = require('axios');
const { requireAuth } = require('./auth');
const { payments, genId } = require('../db');

const router = express.Router();

// POST /payments/init  { amount: 2000, description: "Abonnement numéro virtuel" }
// Initialise un paiement Mobile Money via CinetPay et renvoie l'URL de paiement
router.post('/init', requireAuth, async (req, res) => {
  const { amount, description = 'Abonnement Mienmoh SaaS' } = req.body;
  if (!amount) return res.status(400).json({ error: 'amount requis (FCFA)' });

  const transactionId = genId();

  try {
    const response = await axios.post('https://api-checkout.cinetpay.com/v2/payment', {
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId,
      amount,
      currency: 'XOF',
      description,
      notify_url: `${process.env.PUBLIC_BASE_URL}/payments/webhook`,
      return_url: `${process.env.PUBLIC_BASE_URL}/payments/return`,
      channels: 'ALL', // Orange Money, MTN, Moov, Wave, carte bancaire
    });

    payments.set(transactionId, {
      userId: req.userId,
      amount,
      status: 'pending',
      provider: 'cinetpay',
    });

    res.json({ transactionId, paymentUrl: response.data.data.payment_url });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Erreur initialisation paiement' });
  }
});

// POST /payments/webhook — CinetPay notifie ici le résultat du paiement
router.post('/webhook', (req, res) => {
  const { cpm_trans_id, cpm_result } = req.body; // cpm_result === '00' => succès
  const record = payments.get(cpm_trans_id);
  if (record) {
    record.status = cpm_result === '00' ? 'paid' : 'failed';
    // TODO : si "paid", activer l'abonnement / le numéro correspondant
  }
  res.sendStatus(200);
});

module.exports = router;
