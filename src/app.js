require('dotenv').config();
const express = require('express');
const morgan  = require('morgan');

const webhookRoutes      = require('./routes/webhook');
const prospectRoutes     = require('./routes/prospects');
const conversationRoutes = require('./routes/conversations');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Save raw body separately for HMAC (webhook only)
app.use((req, _res, next) => {
  req.rawBody = JSON.stringify(req.body);
  next();
});

app.use('/api', webhookRoutes);
app.use('/api/prospects', prospectRoutes);
app.use('/api/conversations', conversationRoutes);

app.get('/', (_req, res) => res.json({ status: 'jwk bhyyyyy ' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));