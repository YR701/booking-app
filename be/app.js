// Author: Jenny Hua

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const ownersRoutes = require('./routes/owners');
const meRoutes = require('./routes/me');
const slotsRoutes = require('./routes/slots');
const requestRoutes = require('./routes/request');
const type2Routes = require('./routes/type2');
const type3Routes = require('./routes/type3');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', ownersRoutes);
app.use('/api', meRoutes);
app.use('/api', slotsRoutes);
app.use('/api', requestRoutes);
app.use('/api', type2Routes);
app.use('/api', type3Routes);

const staticRoots = [
  path.resolve(__dirname, '../../app'),
  path.resolve(__dirname, '../fe/dist'),
];
const staticRoot = staticRoots.find((candidate) => fs.existsSync(path.join(candidate, 'index.html')));

if (staticRoot) {
  app.use(express.static(staticRoot));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(staticRoot, 'index.html'));
  });
}

module.exports = app;