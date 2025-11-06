'use client'

import { atom } from 'recoil'

// ✅ Global authentication state
export const authState = atom({
  key: 'authState',
  default: {
    isAuthenticated: false,
    username: '',
  },
})
