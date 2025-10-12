'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  useEffect(() => {
    // Check for stored token
    const storedToken = localStorage.getItem('smart_mess_token')
    if (storedToken) {
      setToken(storedToken)
      // Verify token with server
      fetchUser(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async (authToken) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      if (response.ok) {
        const { user } = await response.json()
        setUser(user)
      } else {
        // Token is invalid
        localStorage.removeItem('smart_mess_token')
        setToken(null)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      localStorage.removeItem('smart_mess_token')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ email, password })
      // })
      const response = {email,password}
      const data =response
      
      if (response) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('smart_mess_token', data.token)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.log(error);
      return { success: false, error: 'Network error' }
    }
  }

  const register = async (name, email, password, role = 'student') => {
    try {
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ name, email, password, role })
      // })
      const response = {
        name,
        email,
        password,
        role
      }

      const data = response
      
      if (response) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('smart_mess_token', data.token)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.log(error);
      return { success: false, error: 'Network error' }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('smart_mess_token')
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}