require('dotenv').config();
const express = require('express');
const morgan  = require('morgan');

const webhookRoutes      = require('./routes/webhook');
const prospectRoutes     = require('./routes/prospects');
const conversationRoutes = require('./routes/conversations');

const app = express();

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf; // Buffer brut, capturé AVANT le parsing
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api', webhookRoutes);
app.use('/api/prospects', prospectRoutes);
app.use('/api/conversations', conversationRoutes);

app.get('/', (_req, res) => res.json({ status: 'jwk bhyyyyy ' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));