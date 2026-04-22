import { create } from 'zustand';

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  hydrated: false,

  init: () => {
    if (typeof window === 'undefined') return;

    const token = window.localStorage.getItem('cw_token');
    const user = window.localStorage.getItem('cw_user');

    set({
      token: token || null,
      user: user ? safeParse(user) : null,
      hydrated: true
    });
  },

  login: (user, token) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cw_token', token);
      window.localStorage.setItem('cw_user', JSON.stringify(user));
    }

    set({ user, token, hydrated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('cw_token');
      window.localStorage.removeItem('cw_user');
    }

    set({ user: null, token: null, hydrated: true });
  }
}));