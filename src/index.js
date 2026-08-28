require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { router: authRouter } = require('./routes/auth');
const numbersRouter = require('./routes/numbers');
const webhooksRouter = require('./routes/webhooks');
const paymentsRouter = require('./routes/payments');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // requis pour les webhooks Twilio (form-encoded)

app.get('/', (req, res) => res.json({ status: 'ok', service: 'onoff-clone-backend' }));

app.use('/auth', authRouter);
app.use('/numbers', numbersRouter);
app.use('/webhooks', webhooksRouter);
app.use('/payments', paymentsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Backend démarré sur http://localhost:${PORT}`));
