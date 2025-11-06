'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Mail, Lock, User, UserCog } from 'lucide-react'
import { useRecoilState } from 'recoil'
import { authState } from '@/app/atoms'  // ✅ Corrected path

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  })
  const [, setAuthState] = useRecoilState(authState)

  // ✅ Handle Login
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await login(loginForm.email, loginForm.password)
      if (result.success) {
        toast.success('Welcome back! 🎉')
        setAuthState(true)
        onClose()
      } else {
        toast.error(result.error || 'Login failed')
      }
    } catch (err) {
      toast.error('Network error while logging in')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Handle Register
  const handleRegister = async (e) => {
    e.preventDefault()

    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (registerForm.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const result = await register(
        registerForm.name,
        registerForm.email,
        registerForm.password,
        registerForm.role
      )

      if (result.success) {
        toast.success('Account created successfully! 🎉')
        setAuthState(true)
        onClose()
      } else {
        toast.error(result.error || 'Registration failed')
      }
    } catch (err) {
      toast.error('Network error while registering')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white text-center text-2xl font-bold">
            Join Smart Mess
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger
              value="login"
              className="text-white data-[state=active]:bg-blue-600"
            >
              Login
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="text-white data-[state=active]:bg-blue-600"
            >
              Register
            </TabsTrigger>
          </TabsList>

          {/* LOGIN TAB */}
          <TabsContent value="login">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="space-y-1">
                <CardTitle className="text-white">Welcome Back</CardTitle>
                <CardDescription className="text-slate-400">
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-white">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your.email@college.edu"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                        className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-white">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                        className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REGISTER TAB */}
          <TabsContent value="register">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="space-y-1">
                <CardTitle className="text-white">Create Account</CardTitle>
                <CardDescription className="text-slate-400">
                  Join Smart Mess and start voting for your favorite meals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-white">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Your full name"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, name: e.target.value }))}
                        className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-white">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your.email@college.edu"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, email: e.target.value }))}
                        className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-role" className="text-white">Role</Label>
                    <div className="relative">
                      <UserCog className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Select
                        value={registerForm.role}
                        onValueChange={(value) =>
                          setRegisterForm((p) => ({ ...p, role: value }))
                        }
                      >
                        <SelectTrigger className="pl-10 bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="student" className="text-white">Student</SelectItem>
                          <SelectItem value="staff" className="text-white">Staff</SelectItem>
                          <SelectItem value="admin" className="text-white">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-white">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create a password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, password: e.target.value }))}
                        className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-white">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                        className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
