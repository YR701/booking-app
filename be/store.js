// Author: Jenny Hua
const fs = require('fs/promises');
const { STORE_PATH } = require('./config');

async function ensureStore() {
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.mkdir(require('path').dirname(STORE_PATH), { recursive: true });
    await fs.writeFile(
      STORE_PATH,
      JSON.stringify({ users: [], slots: [] }, null, 2),
      'utf8',
    );
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(STORE_PATH, 'utf8');
  return JSON.parse(raw);
}

async function writeStore(store) {
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

module.exports = {
  ensureStore,
  readStore,
  writeStore,
};
