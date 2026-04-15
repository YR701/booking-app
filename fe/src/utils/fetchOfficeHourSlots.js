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