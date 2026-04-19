// Author: Jenny Hua

export const API_BASE = import.meta.env.VITE_API_BASE
  || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');
export const TOKEN_KEY = 'comp307-booking-token';