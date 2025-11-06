'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRecoilState } from 'recoil'
import { authState } from '@/atoms'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
  Home,
  Vote,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  User,
  Bell,
  ChefHat,
  ScanLine,
  Salad
} from 'lucide-react'

export default function Navigation({ user, currentView, setCurrentView }) {
  const { logout } = useAuth()
  const [, setIsAuthenticated] = useRecoilState(authState)
  const [notifications] = useState(2) // mock count

  // Main Navigation
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'bg-blue-600' },
    { id: 'vote', label: 'Vote', icon: Vote, color: 'bg-purple-600' },
    { id: 'bookings', label: 'My Bookings', icon: Calendar, color: 'bg-green-600' },
    { id: 'nutrition', label: 'AI Nutrition', icon: Salad, color: 'bg-teal-600' },
  ]

  // Admin-only
  if (user?.role === 'admin') {
    navItems.push({ id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'bg-red-600' })
  }

  // Staff + Admin: QR Scanner
  if (user?.role === 'staff' || user?.role === 'admin') {
    navItems.push({ id: 'scanner', label: 'QR Scanner', icon: ScanLine, color: 'bg-yellow-500' })
  }

  // Logout Handler
  const handleLogout = () => {
    logout()
    setIsAuthenticated(false)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white font-space-grotesk tracking-wide">
              Smart Mess
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView(item.id)}
                className={`text-white transition-all hover:bg-slate-700 ${
                  currentView === item.id ? `${item.color} hover:opacity-90` : ''
                }`}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </div>

          {/* User & Notifications */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-white hover:bg-slate-800"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-xs rounded-full">
                  {notifications}
                </Badge>
              )}
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full focus-visible:ring-0">
                  <Avatar className="h-9 w-9 border border-slate-700">
                    <AvatarImage src={user?.avatar || ''} alt={user?.name || 'User'} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-slate-800 border border-slate-700 shadow-lg rounded-lg"
              >
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar || ''} alt={user?.name || 'User'} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-white truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    <Badge className="text-xs bg-slate-700 mt-1 capitalize">{user?.role}</Badge>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem className="text-white hover:bg-slate-700 cursor-pointer">
                  <User className="w-4 h-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-slate-700 cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-slate-800 border-t border-slate-700">
        <div className="px-2 py-2 space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentView === item.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView(item.id)}
              className={`w-full justify-start text-white transition-all ${
                currentView === item.id ? `${item.color} hover:opacity-90` : 'hover:bg-slate-700'
              }`}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    </nav>
  )
}
