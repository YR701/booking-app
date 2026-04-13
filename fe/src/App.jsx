// Author: Jenny Hua
import { useEffect, useMemo, useState } from 'react';
import './App.css';
import OwnerDashboard from './pages/OwnerDashboard';
import UserDashboard from './pages/UserDashboard';
import mcgillLogo from './assets/mcgill_logo.png';

import Type2CreateGroupMeetingPage from './pages/Type2CreateGroupMeetingPage';
import Type3CreateRecurringOHPage from './pages/Type3CreateRecurringOHPage';
import Type3OwnerOfficeHoursPage from './pages/Type3OwnerOfficeHoursPage';
import Type3OfficeHoursPublicPage from './pages/Type3OfficeHoursPublicPage';

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
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [slotForm, setSlotForm] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
  });

  const [currentPage, setCurrentPage] = useState('home');
  const [type2Draft, setType2Draft] = useState({
    title: 'COMP 307 Group Meeting',
    description: '',
    invitees: '',
    previewWeeks: 1,
    candidateSlots: [],
  });
  const [type3Draft, setType3Draft] = useState({
    title: 'COMP 307 Office Hours',
    description: '',
    weeks: 4,
    savedBaseSlots: [],
  });


  const [showDashboard, setShowDashboard] = useState(false);


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
    setShowDashboard(false);
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
  //tepmorary redirect button to dashboard for testing
  if (showDashboard) {
    return <UserDashboard handleLogout={logout} user={user} />;
  }
  // if (currentPage === 'type2-create') {
  //   return (
  //     <Type2CreateGroupMeetingPage
  //       onBack={() => setCurrentPage('home')}
  //       onLogout={logout}
  //       user={user}
  //     />
  //   );
  // }
  if (currentPage === 'type2-create') {
    return (
      <Type2CreateGroupMeetingPage
        onBack={() => setCurrentPage('home')}
        onLogout={logout}
        user={user}
        type2Draft={type2Draft}
        setType2Draft={setType2Draft}
      />
    );
  }

  // if (currentPage === 'type3-create') {
  //   return (
  //     <Type3CreateRecurringOHPage
  //       onBack={() => setCurrentPage('home')}
  //       onLogout={logout}
  //       user={user}
  //     />
  //   );
  // }

  if (currentPage === 'type3-create') {
    return (
      <Type3CreateRecurringOHPage
        onBack={() => setCurrentPage('home')}
        onLogout={logout}
        user={user}
        type3Draft={type3Draft}
        setType3Draft={setType3Draft}
      />
    );
  }

  if (currentPage === 'type3-owner') {
    return (
      <Type3OwnerOfficeHoursPage
        onBack={() => setCurrentPage('home')}
        onLogout={logout}
        user={user}
        type3Draft={type3Draft}
      />
    );
  }

  if (currentPage === 'type3-public') {
    return (
      <Type3OfficeHoursPublicPage
        onBack={() => setCurrentPage('home')}
        onLogout={logout}
        user={user}
        type3Draft={type3Draft}
      />
    );
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
          <button onClick={() => setCurrentPage('type2-create')}>Type 2 Create</button>
          <button onClick={() => setCurrentPage('type3-create')}>Type 3 Create</button>
          <button onClick={() => setCurrentPage('type3-owner')}>Type 3 Owner</button>
          <button onClick={() => setCurrentPage('type3-public')}>Type 3 Public</button>
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
          {user.role === 'owner' && (
            <OwnerDashboard
              slotForm={slotForm}
              setSlotForm={setSlotForm}
              onCreateSlot={createSlot}
              myOwnerSlots={myOwnerSlots}
              invitationUrl={invitationUrl}
              onToggleSlot={toggleSlot}
              onDeleteSlot={deleteSlot}
              formatDateTime={formatDateTime}
              createMailto={createMailto}
            />
          )}
          {user.role === 'student' && (
            <UserDashboard handleLogout={logout} user={user} />
          )}
        </>
      )}
    </main>
  );
}

export default App;
