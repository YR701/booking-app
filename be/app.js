// Author: Jenny Hua
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const ownersRoutes = require('./routes/owners');
const meRoutes = require('./routes/me');
const slotsRoutes = require('./routes/slots');
const requestRoutes = require('./routes/request');
const type3Routes = require('./routes/type3');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', ownersRoutes);
app.use('/api', meRoutes);
app.use('/api', slotsRoutes);
app.use('/api', requestRoutes);
app.use('/api', type3Routes);


module.exports = app;
