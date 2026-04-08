const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'comp307-booking-secret';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const STORE_PATH = path.join(__dirname, 'data', 'store.json');

app.use(cors());
app.use(express.json());

function isMcGillEmail(email = '') {
  return /@(mail\.)?mcgill\.ca$/i.test(email.trim());
}

function isOwnerEmail(email = '') {
  return /@mcgill\.ca$/i.test(email.trim());
}

async function ensureStore() {
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
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

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function buildToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
}

function buildMailto(email, subject, body) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    body,
  )}`;
}

function formatSlot(store, slot) {
  const owner = store.users.find((user) => user.id === slot.ownerId);
  const bookedBy = slot.bookedByUserId
    ? store.users.find((user) => user.id === slot.bookedByUserId)
    : null;

  return {
    id: slot.id,
    title: slot.title,
    start: slot.start,
    end: slot.end,
    location: slot.location || '',
    notes: slot.notes || '',
    isActive: slot.isActive,
    invitationKey: slot.ownerId,
    owner: owner ? publicUser(owner) : null,
    bookedBy: bookedBy ? publicUser(bookedBy) : null,
  };
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    const store = await readStore();
    const user = store.users.find((entry) => entry.id === payload.sub);

    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    req.store = store;
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

function ownerOnly(req, res, next) {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Only @mcgill.ca owners can do that.' });
  }

  return next();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  if (!isMcGillEmail(email)) {
    return res
      .status(400)
      .json({ error: 'Only @mcgill.ca and @mail.mcgill.ca addresses can register.' });
  }

  const store = await readStore();
  const existingUser = store.users.find((user) => user.email === email);

  if (existingUser) {
    return res.status(409).json({ error: 'That email is already registered.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    role: isOwnerEmail(email) ? 'owner' : 'student',
  };

  store.users.push(user);
  await writeStore(store);

  res.status(201).json({
    token: buildToken(user),
    user: publicUser(user),
  });
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const store = await readStore();
  const user = store.users.find((entry) => entry.email === email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  return res.json({
    token: buildToken(user),
    user: publicUser(user),
  });
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const freshStore = await readStore();
  const freshUser = freshStore.users.find((user) => user.id === req.user.id);
  if (!freshUser) {
    return res.status(401).json({ error: 'User account no longer exists.' });
  }

  res.json({ user: publicUser(freshUser) });
});

app.get('/api/owners', authMiddleware, async (_req, res) => {
  const store = await readStore();
  const owners = store.users
    .filter((user) => user.role === 'owner')
    .map((owner) => ({
      ...publicUser(owner),
      activeSlotCount: store.slots.filter(
        (slot) => slot.ownerId === owner.id && slot.isActive,
      ).length,
    }))
    .filter((owner) => owner.activeSlotCount > 0)
    .sort((left, right) => left.name.localeCompare(right.name));

  res.json({ owners });
});

app.get('/api/owners/:ownerId/slots', authMiddleware, async (req, res) => {
  const store = await readStore();
  const { ownerId } = req.params;
  const owner = store.users.find((user) => user.id === ownerId && user.role === 'owner');

  if (!owner) {
    return res.status(404).json({ error: 'Owner not found.' });
  }

  const slots = store.slots
    .filter((slot) => slot.ownerId === ownerId)
    .filter((slot) => slot.isActive)
    .sort((left, right) => left.start.localeCompare(right.start))
    .map((slot) => formatSlot(store, slot));

  return res.json({
    owner: publicUser(owner),
    slots,
  });
});

app.get('/api/owner/slots', authMiddleware, ownerOnly, async (req, res) => {
  const store = await readStore();
  const slots = store.slots
    .filter((slot) => slot.ownerId === req.user.id)
    .sort((left, right) => left.start.localeCompare(right.start))
    .map((slot) => formatSlot(store, slot));

  res.json({
    invitationUrl: `${APP_URL}/?invite=${req.user.id}`,
    slots,
  });
});

app.get('/api/me/bookings', authMiddleware, async (req, res) => {
  const store = await readStore();
  const bookings = store.slots
    .filter((slot) => slot.bookedByUserId === req.user.id)
    .sort((left, right) => left.start.localeCompare(right.start))
    .map((slot) => formatSlot(store, slot));

  res.json({ bookings });
});

app.post('/api/slots', authMiddleware, ownerOnly, async (req, res) => {
  const title = String(req.body.title || '').trim();
  const start = String(req.body.start || '').trim();
  const end = String(req.body.end || '').trim();
  const location = String(req.body.location || '').trim();
  const notes = String(req.body.notes || '').trim();

  if (!title || !start || !end) {
    return res.status(400).json({ error: 'Title, start time, and end time are required.' });
  }

  if (new Date(start).getTime() >= new Date(end).getTime()) {
    return res.status(400).json({ error: 'End time must be after the start time.' });
  }

  const store = await readStore();
  const slot = {
    id: crypto.randomUUID(),
    ownerId: req.user.id,
    title,
    start,
    end,
    location,
    notes,
    isActive: false,
    bookedByUserId: null,
  };

  store.slots.push(slot);
  await writeStore(store);

  res.status(201).json({ slot: formatSlot(store, slot) });
});

app.patch('/api/slots/:slotId/activate', authMiddleware, ownerOnly, async (req, res) => {
  const isActive = Boolean(req.body.isActive);
  const store = await readStore();
  const slot = store.slots.find(
    (entry) => entry.id === req.params.slotId && entry.ownerId === req.user.id,
  );

  if (!slot) {
    return res.status(404).json({ error: 'Slot not found.' });
  }

  slot.isActive = isActive;
  await writeStore(store);

  return res.json({ slot: formatSlot(store, slot) });
});

app.delete('/api/slots/:slotId', authMiddleware, ownerOnly, async (req, res) => {
  const store = await readStore();
  const slotIndex = store.slots.findIndex(
    (entry) => entry.id === req.params.slotId && entry.ownerId === req.user.id,
  );

  if (slotIndex === -1) {
    return res.status(404).json({ error: 'Slot not found.' });
  }

  const [deletedSlot] = store.slots.splice(slotIndex, 1);
  const bookedUser = deletedSlot.bookedByUserId
    ? store.users.find((user) => user.id === deletedSlot.bookedByUserId)
    : null;

  await writeStore(store);

  return res.json({
    deletedSlotId: deletedSlot.id,
    notificationMailto: bookedUser
      ? buildMailto(
          bookedUser.email,
          'Booking slot deleted',
          `Hello ${bookedUser.name},\n\nThe slot "${deletedSlot.title}" was deleted and is no longer available.`,
        )
      : null,
  });
});

app.post('/api/slots/:slotId/book', authMiddleware, async (req, res) => {
  const store = await readStore();
  const slot = store.slots.find((entry) => entry.id === req.params.slotId);

  if (!slot) {
    return res.status(404).json({ error: 'Slot not found.' });
  }

  if (!slot.isActive) {
    return res.status(400).json({ error: 'Only active slots can be booked.' });
  }

  if (slot.ownerId === req.user.id) {
    return res.status(400).json({ error: 'Owners cannot reserve their own slot.' });
  }

  if (slot.bookedByUserId) {
    return res.status(409).json({ error: 'That slot has already been reserved.' });
  }

  slot.bookedByUserId = req.user.id;
  await writeStore(store);

  return res.json({ slot: formatSlot(store, slot) });
});

app.delete('/api/slots/:slotId/booking', authMiddleware, async (req, res) => {
  const store = await readStore();
  const slot = store.slots.find((entry) => entry.id === req.params.slotId);

  if (!slot || slot.bookedByUserId !== req.user.id) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  const owner = store.users.find((user) => user.id === slot.ownerId);
  slot.bookedByUserId = null;
  await writeStore(store);

  return res.json({
    slot: formatSlot(store, slot),
    notificationMailto: owner
      ? buildMailto(
          owner.email,
          'Booking cancelled',
          `Hello ${owner.name},\n\nThe booking for "${slot.title}" has been cancelled and the slot is available again.`,
        )
      : null,
  });
});

app.listen(PORT, () => {
  console.log(`Booking API listening on http://localhost:${PORT}`);
});
