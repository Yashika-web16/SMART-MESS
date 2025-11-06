'use client'
import React, { useState, useEffect } from 'react'
import { useRecoilState } from 'recoil'
import { useAuth } from '@/components/auth/AuthProvider'
import Navigation from '@/components/layout/Navigation'
import AuthModal from '@/components/auth/AuthModal'
import WeeklyVoting from '@/components/voting/WeeklyVoting'
import Dashboard from '@/components/dashboard/Dashboard'
import StaffScanner from '@/components/staff/StaffScanner'
import AdminAnalytics from '@/components/admin/AdminAnalytics'
import NutritionAdvisor from '@/components/utility/NutritionAdvisor'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ChefHat, Users, TrendingUp, Star } from 'lucide-react'
import { authState } from '@/app/atoms'
import { api } from '@/lib/api'

export default function App() {
  const { user, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [currentView, setCurrentView] = useState('home')
  const [authenticated, setAuthenticated] = useRecoilState(authState)

  // Update view when auth state changes
  useEffect(() => {
    if (!user && !loading) {
      setAuthenticated(false)
      setCurrentView('home')
    } else if (user && currentView === 'home') {
      setAuthenticated(true)
      setCurrentView('dashboard')
    }
  }, [user, loading])

  // Health check (runs once)
  useEffect(() => {
    let active = true
    const controller = new AbortController()

    async function checkBackend() {
      try {
        const res = await api.get('/api/health', { signal: controller.signal })
        if (active) console.log('✅ Backend connected:', res.data)
      } catch (e) {
        if (active) console.error('⚠️ Backend not reachable:', e.message)
      }
    }

    checkBackend()
    return () => {
      active = false
      controller.abort()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white/80">Loading Smart Mess...</p>
        </div>
      </div>
    )
  }

  const renderView = () => {
    if (!user) return <Hero onLogin={() => setShowAuthModal(true)} />
    switch (currentView) {
      case 'dashboard': return <Dashboard />
      case 'vote': return <WeeklyVoting />
      case 'nutrition': return <NutritionAdvisor />
      case 'scanner': return <StaffScanner />
      case 'analytics': return <AdminAnalytics />
      case 'bookings': return <Dashboard />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen gradient-bg">
      {user && (
        <Navigation
          user={user}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
      )}
      <main className={user ? 'pt-16' : ''}>
        {renderView()}
      </main>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}

// =========================
// HERO SECTION
// =========================
function Hero({ onLogin }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-7xl font-bold text-white mb-6 font-space-grotesk"
        >
          Smart{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Mess
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto"
        >
          Vote for your favorite meals, reduce food waste, and get personalized
          nutrition advice. 🍽️
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex gap-4 justify-center mb-16"
        >
          <Button
            onClick={onLogin}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            Get Started
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-8"
        >
          {[
            { icon: <ChefHat className="w-8 h-8" />, title: 'Weekly Voting', desc: 'Vote for your favorite meals' },
            { icon: <Users className="w-8 h-8" />, title: 'Pre-booking', desc: 'Reserve your meals with QR codes' },
            { icon: <TrendingUp className="w-8 h-8" />, title: 'Analytics', desc: 'Track nutrition and preferences' },
            { icon: <Star className="w-8 h-8" />, title: 'Rewards', desc: 'Earn points for consistency' },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <div className="text-blue-400 mb-4 flex justify-center">
                {feature.icon}
              </div>
              <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
              <p className="text-white/70 text-sm">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
