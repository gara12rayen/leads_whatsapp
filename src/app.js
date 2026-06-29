require('dotenv').config();
const express = require('express');
const morgan  = require('morgan');

const webhookRoutes      = require('./routes/webhook');
const prospectRoutes     = require('./routes/prospects');
const conversationRoutes = require('./routes/conversations');

const app = express();

// ── Capture raw body for HMAC validation ─────────────────────
// Must come BEFORE express.json()
app.use((req, _res, next) => {
  let data = '';
  req.on('data', chunk => { data += chunk; });
  req.on('end',  () => { req.rawBody = data; next(); });
});
app.use(express.json());
app.use(morgan('dev'));

// ── Routes ───────────────────────────────────────────────────
app.use('/api', webhookRoutes);
app.use('/api/prospects', prospectRoutes);
app.use('/api/conversations', conversationRoutes);

app.get('/', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));