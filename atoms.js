import { atom } from 'recoil';

// Atom for user authentication state
export const authState = atom({
  key: 'authState',
  default: {
    isAuthenticated: false,
    username: null,
  },
});

