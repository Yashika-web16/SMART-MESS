'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider' // Using standard project alias
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
  Salad // NEW: Imported Salad icon for AI Nutrition
} from 'lucide-react'

export default function Navigation({ user, currentView, setCurrentView }) {
  const { logout } = useAuth()
  const [notifications] = useState(3) // Mock notification count

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'blue' },
    { id: 'vote', label: 'Vote', icon: Vote, color: 'purple' },
    { id: 'bookings', label: 'My Bookings', icon: Calendar, color: 'green' },
    { id: 'nutrition', label: 'AI Nutrition', icon: Salad, color: 'teal' }, // NEW: AI Nutrition link for all users
  ]

  // Add role-specific nav items
  if (user.role === 'admin') {
    navItems.push(
      { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'red' } // Admin Dashboard
    )
  }

  // Staff and Admin need the scanner
  if (user.role === 'staff' || user.role === 'admin') {
    navItems.push(
      { id: 'scanner', label: 'QR Scanner', icon: ScanLine, color: 'yellow' } // Staff Scanner
    )
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white font-space-grotesk">Smart Mess</span>
          </motion.div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentView(item.id)}
                className={`text-white hover:bg-slate-700 ${
                  currentView === item.id 
                    ? `bg-${item.color}-600 hover:bg-${item.color}-700` 
                    : ''
                }`}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative text-white hover:bg-slate-700">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-xs rounded-full">
                  {notifications}
                </Badge>
              )}
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || ''} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-white">{user.name}</p>
                    <p className="w-[200px] truncate text-sm text-slate-400">
                      {user.email}
                    </p>
                    <Badge variant="secondary" className="w-fit text-xs">
                      {user.role}
                    </Badge>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem className="text-white hover:bg-slate-700">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-slate-700">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem 
                  className="text-red-400 hover:bg-red-900/20 hover:text-red-300"
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-slate-800">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentView === item.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView(item.id)}
              className={`w-full justify-start text-white hover:bg-slate-700 ${
                currentView === item.id 
                  ? `bg-${item.color}-600 hover:bg-${item.color}-700` 
                  : ''
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