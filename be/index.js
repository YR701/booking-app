// Author: Jenny Hua
const app = require('./app');
const { PORT } = require('./config');

app.listen(PORT, () => {
  console.log(`Booking API listening on http://localhost:${PORT}`);
});
