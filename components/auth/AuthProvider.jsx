// 'use client'

// import { createContext, useContext, useState, useEffect } from 'react'

// import { toast } from 'sonner'

// const AuthContext = createContext()

// export function useAuth() {
//   const context = useContext(AuthContext)
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider')
//   }
//   return context
// }

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null)
//   const [token, setToken] = useState(null)
//   const [loading, setLoading] = useState(true)

//   // ✅ Load token from storage on mount
//   useEffect(() => {
//     const storedToken = localStorage.getItem('smart_mess_token')
//     if (storedToken) {
//       setToken(storedToken)
//       fetchUser(storedToken)
//     } else {
//       setLoading(false)
//     }
//   }, [])

//   // // ✅ Fetch user from token
//   // const fetchUser = async (authToken) => {
//   //   try {
//   //     const res = await api.get('/api/auth/me', {
//   //       headers: { Authorization: `Bearer ${authToken}` },
//   //     })
//   //     setUser(res.data.user)
//   //   } catch (err) {
//   //     console.error('User verification failed:', err)
//   //     localStorage.removeItem('smart_mess_token')
//   //     setUser(null)
//   //     setToken(null)
//   //   } finally {
//   //     setLoading(false)
//   //   }
//   // }

//   // // ✅ Login handler
//   // const login = async (email, password) => {
//   //   try {
//   //     const res = await api.post('/api/auth/login', { email, password })

//   //     if (res.data && res.data.token) {
//   //       const { user, token } = res.data
//   //       setUser(user)
//   //       setToken(token)
//   //       localStorage.setItem('smart_mess_token', token)
//   //       toast.success(`Welcome back, ${user.name}!`)
//   //       return { success: true }
//   //     } else {
//   //       return { success: false, error: 'Invalid server response' }
//   //     }
//   //   } catch (err) {
//   //     console.error('Login error:', err)
//   //     return {
//   //       success: false,
//   //       error: err.response?.data?.error || 'Invalid credentials',
//   //     }
//   //   }
//   // }

//   // // ✅ Register handler
//   // const register = async (name, email, password, role = 'student') => {
//   //   try {
//   //     const res = await api.post('/api/auth/register', {
//   //       name,
//   //       email,
//   //       password,
//   //       role,
//   //     })

//   //     if (res.data && res.data.token) {
//   //       const { user, token } = res.data
//   //       setUser(user)
//   //       setToken(token)
//   //       localStorage.setItem('smart_mess_token', token)
//   //       toast.success('Account created successfully!')
//   //       return { success: true }
//   //     } else {
//   //       return { success: false, error: 'Invalid server response' }
//   //     }
//   //   } catch (err) {
//   //     console.error('Registration error:', err)
//   //     return {
//   //       success: false,
//   //       error: err.response?.data?.error || 'Registration failed',
//   //     }
//   //   }
//   // }
//   const login = async (email, password) => {
//   if (email === 'admin@example.com' && password === '123456') {
//     return { success: true, user: { name: 'Admin', role: 'admin', email } }
//   }
//   return { success: false, error: 'Invalid email or password' }
// }

// const register = async (name, email, password, role) => {
//   console.log('New user registered:', { name, email, role })
//   return { success: true }
// }


//   // ✅ Logout handler
//   const logout = () => {
//     setUser(null)
//     setToken(null)
//     localStorage.removeItem('smart_mess_token')
//     toast.info('You have been logged out.')
//   }

//   const value = {
//     user,
//     token,
//     loading,
//     login,
//     register,
//     logout,
//   }

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   )
// }
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'sonner'

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
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // ✅ Load user/token from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('smart_mess_user')
    const storedToken = localStorage.getItem('smart_mess_token')

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      setToken(storedToken)
    }
    setLoading(false)
  }, [])

  // ✅ Fake login (frontend-only)
  const login = async (email, password) => {
    // Dummy users — can add more roles if needed
    const dummyUsers = [
  { email: 'admin@mess.com', password: '123456', role: 'admin', name: 'Admin' },
  { email: 'student@mess.com', password: '123456', role: 'student', name: 'Student' },
  { email: 'staff@mess.com', password: '123456', role: 'staff', name: 'Staff' },
]

    

    const found = dummyUsers.find(
      (u) => u.email === email && u.password === password
    )

    if (found) {
      const fakeToken = Math.random().toString(36).substring(2)
      setUser(found)
      setToken(fakeToken)
      localStorage.setItem('smart_mess_user', JSON.stringify(found))
      localStorage.setItem('smart_mess_token', fakeToken)
      toast.success(`Welcome back, ${found.name}! 🎉`)
      return { success: true }
    } else {
      toast.error('Invalid email or password ❌')
      return { success: false, error: 'Invalid credentials' }
    }
  }

  // ✅ Fake register (frontend-only)
  const register = async (name, email, password, role = 'student') => {
    const newUser = { name, email, role }
    const fakeToken = Math.random().toString(36).substring(2)

    setUser(newUser)
    setToken(fakeToken)
    localStorage.setItem('smart_mess_user', JSON.stringify(newUser))
    localStorage.setItem('smart_mess_token', fakeToken)

    toast.success('Account created successfully! 🎉')
    return { success: true }
  }

  // ✅ Logout
  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('smart_mess_user')
    localStorage.removeItem('smart_mess_token')
    toast.info('You have been logged out 👋')
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
