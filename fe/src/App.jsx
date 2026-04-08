// Author: Jenny Hua
import { useEffect, useMemo, useState } from 'react';
import './App.css';
import Dashboard from './pages/UserDashboard';
import mcgillLogo from './assets/mcgill_logo.png';

const API_BASE = 'http://localhost:4000/api';
const TOKEN_KEY = 'comp307-booking-token';

function formatDateTime(value) {
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function createMailto(email, subject, body) {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${email}?${params.toString()}`;
}

async function api(path, options = {}, token = '') {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }

  return data;
}

function App() {
  const inviteOwnerId = useMemo(
    () => new URLSearchParams(window.location.search).get('invite') || '',
    [],
  );

  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(null);
  const [owners, setOwners] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState(inviteOwnerId);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [slots, setSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [myOwnerSlots, setMyOwnerSlots] = useState([]);
  const [invitationUrl, setInvitationUrl] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDashboard, setShowDashboard] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [slotForm, setSlotForm] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    async function loadPage() {
      if (!token) {
        setUser(null);
        setOwners([]);
        setSelectedOwner(null);
        setSlots([]);
        setMyBookings([]);
        setMyOwnerSlots([]);
        setInvitationUrl('');
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const me = await api('/auth/me', {}, token);
        setUser(me.user);

        const ownerList = await api('/owners', {}, token);
        setOwners(ownerList.owners);

        const bookings = await api('/me/bookings', {}, token);
        setMyBookings(bookings.bookings);

        if (me.user.role === 'owner') {
          const ownerData = await api('/owner/slots', {}, token);
          setMyOwnerSlots(ownerData.slots);
          setInvitationUrl(ownerData.invitationUrl);
        }

        const nextOwnerId =
          inviteOwnerId ||
          selectedOwnerId ||
          ownerList.owners[0]?.id ||
          '';

        if (nextOwnerId) {
          setSelectedOwnerId(nextOwnerId);
          const ownerPage = await api(`/owners/${nextOwnerId}/slots`, {}, token);
          setSelectedOwner(ownerPage.owner);
          setSlots(ownerPage.slots);
        } else {
          setSelectedOwner(null);
          setSlots([]);
        }
      } catch (err) {
        localStorage.removeItem(TOKEN_KEY);
        setToken('');
        setUser(null);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    void loadPage();
  }, [token, selectedOwnerId, inviteOwnerId, refreshKey]);

  function saveSession(nextToken, nextUser) {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setError('');
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setUser(null);
    setMessage('Logged out.');
    setError('');
  }

  function refreshData() {
    setRefreshKey((current) => current + 1);
  }

  async function register(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const result = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerForm),
      });
      saveSession(result.token, result.user);
      setRegisterForm({ name: '', email: '', password: '' });
      setMessage('Account created.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function login(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const result = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      });
      saveSession(result.token, result.user);
      setLoginForm({ email: '', password: '' });
      setMessage('Logged in.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function selectOwner(ownerId) {
    setSelectedOwnerId(ownerId);
    if (!ownerId || !token) {
      setSelectedOwner(null);
      setSlots([]);
      return;
    }

    try {
      const ownerPage = await api(`/owners/${ownerId}/slots`, {}, token);
      setSelectedOwner(ownerPage.owner);
      setSlots(ownerPage.slots);
    } catch (err) {
      setError(err.message);
    }
  }

  async function createSlot(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    const start = new Date(`${slotForm.date}T${slotForm.startTime}`);
    const end = new Date(`${slotForm.date}T${slotForm.endTime}`);

    try {
      await api(
        '/slots',
        {
          method: 'POST',
          body: JSON.stringify({
            title: slotForm.title,
            start: start.toISOString(),
            end: end.toISOString(),
          }),
        },
        token,
      );
      setSlotForm({ title: '', date: '', startTime: '', endTime: '' });
      setMessage('Private slot created.');
      setSelectedOwnerId(user.id);
      refreshData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleSlot(slot) {
    setMessage('');
    setError('');

    try {
      await api(
        `/slots/${slot.id}/activate`,
        {
          method: 'PATCH',
          body: JSON.stringify({ isActive: !slot.isActive }),
        },
        token,
      );
      setMessage(slot.isActive ? 'Slot made private.' : 'Slot activated.');
      refreshData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteSlot(slot) {
    setMessage('');
    setError('');

    try {
      const result = await api(`/slots/${slot.id}`, { method: 'DELETE' }, token);
      if (result.notificationMailto) {
        window.location.href = result.notificationMailto;
      }
      setMessage('Slot deleted.');
      refreshData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function bookSlot(slotId) {
    setMessage('');
    setError('');

    try {
      await api(`/slots/${slotId}/book`, { method: 'POST' }, token);
      setMessage('Slot booked.');
      refreshData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function cancelBooking(slotId) {
    setMessage('');
    setError('');

    try {
      const result = await api(`/slots/${slotId}/booking`, { method: 'DELETE' }, token);
      if (result.notificationMailto) {
        window.location.href = result.notificationMailto;
      }
      setMessage('Booking cancelled.');
      refreshData();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <main className="page"><p>Loading...</p></main>;
  }

  if (showDashboard) {
    return <Dashboard onBackHome={() => setShowDashboard(false)} />;
  }

  return (
    <main className="page">
      <header className="main-topbar">
        <div className="brand">
          <img src={mcgillLogo} alt="McGill logo" />
        </div>
        <h1>McGill SOCS Booking</h1>
        <div className="nav-actions">
          <button onClick={() => setShowDashboard(true)}>User Dashboard</button>
        </div>
      </header>

      <header className="hero">
        <p className="subtitle">
          Simple office-hour booking for McGill students, TAs, and professors.
        </p>
        <ul className="rules">
          <li>Only McGill emails can register.</li>
          <li>Only `@mcgill.ca` users can create and manage slots.</li>
          <li>New slots are private until the owner activates them.</li>
        </ul>
      </header>

      {inviteOwnerId && <p className="notice">Invitation link mode is active.</p>}
      {message && <p className="notice success">{message}</p>}
      {error && <p className="notice error">{error}</p>}

      {!user ? (
        <section className="grid two">
          <form className="card form" onSubmit={register}>
            <h2>Register</h2>
            <input
              placeholder="Full name"
              value={registerForm.name}
              onChange={(event) =>
                setRegisterForm({ ...registerForm, name: event.target.value })
              }
            />
            <input
              type="email"
              placeholder="name@mcgill.ca"
              value={registerForm.email}
              onChange={(event) =>
                setRegisterForm({ ...registerForm, email: event.target.value })
              }
            />
            <input
              type="password"
              placeholder="Password"
              value={registerForm.password}
              onChange={(event) =>
                setRegisterForm({ ...registerForm, password: event.target.value })
              }
            />
            <button type="submit">Create account</button>
          </form>

          <form className="card form" onSubmit={login}>
            <h2>Login</h2>
            <input
              type="email"
              placeholder="student@mail.mcgill.ca"
              value={loginForm.email}
              onChange={(event) =>
                setLoginForm({ ...loginForm, email: event.target.value })
              }
            />
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(event) =>
                setLoginForm({ ...loginForm, password: event.target.value })
              }
            />
            <button type="submit">Login</button>
          </form>
        </section>
      ) : (
        <>
          <section className="card topbar">
            <div>
              <strong>{user.name}</strong>
              <p>{user.email}</p>
            </div>
            <button onClick={logout}>Logout</button>
          </section>

          <section className="grid two">
            <section className="card">
              <h2>My bookings</h2>
              {myBookings.length === 0 ? (
                <p>No bookings yet.</p>
              ) : (
                <div className="list">
                  {myBookings.map((slot) => (
                    <div className="item" key={slot.id}>
                      <p><strong>{slot.title}</strong></p>
                      <p>{formatDateTime(slot.start)}</p>
                      <p>{slot.owner.name}</p>
                      <div className="actions">
                        <a
                          className="button secondary"
                          href={createMailto(
                            slot.owner.email,
                            `Question about ${slot.title}`,
                            'Hello,'
                          )}
                        >
                          Email owner
                        </a>
                        <button onClick={() => cancelBooking(slot.id)}>Cancel</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="card">
              <h2>{inviteOwnerId ? 'Invitation page' : 'Available slots'}</h2>
              {!inviteOwnerId && (
                <select
                  value={selectedOwnerId}
                  onChange={(event) => void selectOwner(event.target.value)}
                >
                  <option value="">Select an owner</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
              )}

              {selectedOwner && (
                <p className="owner-line">
                  {selectedOwner.name} · {selectedOwner.email}
                </p>
              )}

              {slots.length === 0 ? (
                <p>No active slots.</p>
              ) : (
                <div className="list">
                  {slots.map((slot) => (
                    <div className="item" key={slot.id}>
                      <p><strong>{slot.title}</strong></p>
                      <p>{formatDateTime(slot.start)}</p>
                      {slot.bookedBy ? (
                        <p>Reserved</p>
                      ) : (
                        <button onClick={() => bookSlot(slot.id)}>Book slot</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </section>

          {user.role === 'owner' && (
            <section className="grid two">
              <form className="card form" onSubmit={createSlot}>
                <h2>Create slot</h2>
                <input
                  placeholder="Slot title"
                  value={slotForm.title}
                  onChange={(event) =>
                    setSlotForm({ ...slotForm, title: event.target.value })
                  }
                />
                <input
                  type="date"
                  value={slotForm.date}
                  onChange={(event) =>
                    setSlotForm({ ...slotForm, date: event.target.value })
                  }
                />
                <input
                  type="time"
                  value={slotForm.startTime}
                  onChange={(event) =>
                    setSlotForm({ ...slotForm, startTime: event.target.value })
                  }
                />
                <input
                  type="time"
                  value={slotForm.endTime}
                  onChange={(event) =>
                    setSlotForm({ ...slotForm, endTime: event.target.value })
                  }
                />
                <button type="submit">Create private slot</button>
              </form>

              <section className="card">
                <h2>Owner slots</h2>
                <p className="invite-link">Invitation URL: {invitationUrl || 'Loading...'}</p>
                {myOwnerSlots.length === 0 ? (
                  <p>No slots created yet.</p>
                ) : (
                  <div className="list">
                    {myOwnerSlots.map((slot) => (
                      <div className="item" key={slot.id}>
                        <p><strong>{slot.title}</strong></p>
                        <p>{formatDateTime(slot.start)}</p>
                        <p>{slot.isActive ? 'Public' : 'Private'}</p>
                        <p>
                          {slot.bookedBy
                            ? `Booked by ${slot.bookedBy.name}`
                            : 'Not booked'}
                        </p>
                        <div className="actions">
                          <button onClick={() => toggleSlot(slot)}>
                            {slot.isActive ? 'Make private' : 'Activate'}
                          </button>
                          {slot.bookedBy && (
                            <a
                              className="button secondary"
                              href={createMailto(
                                slot.bookedBy.email,
                                `Regarding ${slot.title}`,
                                'Hello,'
                              )}
                            >
                              Email student
                            </a>
                          )}
                          <button onClick={() => deleteSlot(slot)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default App;
