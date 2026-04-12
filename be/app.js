// Author: Jenny Hua
const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const ownersRoutes = require('./routes/owners');
const meRoutes = require('./routes/me');
const slotsRoutes = require('./routes/slots');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', ownersRoutes);
app.use('/api', meRoutes);
app.use('/api', slotsRoutes);

module.exports = app;
