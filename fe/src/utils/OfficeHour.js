// Author: Yongrong Yang

import { API_BASE, TOKEN_KEY } from '../config';

export const fetchOfficeHourSlots = async (ownerId) => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const ohresponse = await fetch(`${API_BASE}/type3/owners/${ownerId}/slots`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!ohresponse.ok) {
      console.warn('Failed to fetch office hour slots:', ohresponse.status);
      return { slots: [], owner: null, error: null };
    }

    const ohdata = await ohresponse.json();
    const slots = (ohdata.slots || []).filter(slot => !slot.isFull);
    slots.sort((a, b) => new Date(a.start) - new Date(b.start));
    return { slots, owner: ohdata.owner, error: null };
  } catch (error) {
    console.error('Error fetching office hour slots:', error);
    return { slots: [], owner: null, error: error.message };
  }
}

export const handleBookOfficeHour = async (slot) => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const response = await fetch(`${API_BASE}/slots/${slot.id}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to book office hour');
    }

    setLocalMessage('Office hour booked successfully');
    setLocalError('');
    await fetchSlots();
  } catch (error) {
    console.error(error);
    setLocalError(error.message || 'Error booking office hour. Please try again later.');
    setLocalMessage('');
  }
};

//cancel OfficeHour
  const onCancelOfficeHour = async (id) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_BASE}/slots/${id}/booking`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error('Failed to cancel appointment');
      }
      setLocalMessage('Appointment canceled successfully');
      setLocalError('');
      // Refresh will be handled by parent, or user can re-trigger
    } catch (error) {
      console.error(error);
      setLocalError('Error canceling appointment. Please try again later.');
      setLocalMessage('');
    }
  };