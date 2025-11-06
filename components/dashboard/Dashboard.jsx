'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { useRecoilState } from 'recoil'
import { authState } from '@/app/atoms'
import { toast } from 'sonner'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { v4 as uuidv4 } from 'uuid'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import Image from 'next/image'
import {
  Calendar,
  QrCode,
  Star,
  Trophy,
  Target,
  Zap,
  Trash2,
  XCircle,
  TrendingUp,
} from 'lucide-react'

/* ==============================
   Default User Data
   ============================== */
const DEFAULT_USER_DATA = {
  points: 0,
  level: 1,
  streak: 0,
  totalBookings: 0,
  attendanceRate: 0,
  favoriteCategory: 'N/A',
  weeklyTarget: 7,
  weeklyProgress: 0,
}
const DEFAULT_MEALS = []
const DEFAULT_ACTIVITY = []

/* ==============================
   Main Dashboard Component
   ============================== */
export default function Dashboard() {
  const { user, token, logout, loading: authLoading } = useAuth()
  const [userData, setUserData] = useState(DEFAULT_USER_DATA)
  const [todaysMeals, setTodaysMeals] = useState(DEFAULT_MEALS)
  const [recentActivity, setRecentActivity] = useState(DEFAULT_ACTIVITY)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useRecoilState(authState)

  const [showQR, setShowQR] = useState(false)
  const [showWasteModal, setShowWasteModal] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [qrUrl, setQrUrl] = useState('')
  const [wasteRating, setWasteRating] = useState(3)

  /* ==============================
     Fetch Data
     ============================== */
  const fetchData = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // 1️⃣ Fetch User Stats
      const res = await api.get('/api/auth/me')
      if (res.data.user) {
        setUserData(prev => ({
          ...prev,
          points: res.data.user.points || 0,
          level: res.data.user.level || 1,
          streak: res.data.user.streak || 0,
        }))
      }

      // 2️⃣ Fetch Today’s Bookings
      const bookingsRes = await api.get('/api/bookings/user')
      if (bookingsRes.data.bookings) {
        setTodaysMeals(bookingsRes.data.bookings)
      }

      // 3️⃣ Mock Activity
      setRecentActivity([
        { action: 'Fetched new data', time: 'Just now', points: 0 },
        { action: 'Voted for Lunch menu', time: '2 hours ago', points: 5 },
        { action: 'Checked in for Breakfast', time: '5 hours ago', points: 15 },
      ])
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('Session expired or server unavailable.')
      logout()
    } finally {
      setLoading(false)
    }
  }, [token, logout])

  useEffect(() => {
    if (token && !authLoading) fetchData()
  }, [token, authLoading, fetchData])

  /* ==============================
     Helpers
     ============================== */
  const getMealIcon = type =>
    ({ breakfast: '☀️', lunch: '🌞', snacks: '🍪', dinner: '🌙' }[type] || '🍽️')

  const calculateStreakPercentage = () => Math.min((userData.streak / 30) * 100, 100)

  const generateRandomQR = mealType => {
    const randomText = `${mealType}-${Math.floor(Math.random() * 100000)}`
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${randomText}`)
  }

  /* ==============================
     Meal Actions
     ============================== */
  const handleCancelMeal = async (mealId, mealType) => {
    if (!token) return toast.error('Please log in again.')

    if (!confirm(`Cancel your ${mealType} booking? You may lose 5 points.`)) return

    setLoading(true)
    try {
      const res = await api.post('/api/bookings/cancel', { bookingId: mealId })
      if (res.data.success) {
        setTodaysMeals(meals =>
          meals.map(m => (m.id === mealId ? { ...m, status: 'cancelled' } : m))
        )
        setUserData(prev => ({ ...prev, points: Math.max(0, prev.points - 5) }))
        toast.success(res.data.message || 'Booking cancelled.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to cancel booking.')
    } finally {
      setLoading(false)
    }
  }

  const handleWasteRatingSubmit = async () => {
    if (!token || !selectedMeal) return
    setLoading(true)

    try {
      const res = await api.post('/api/meal/waste-rating', {
        bookingId: selectedMeal.id,
        wasteRating,
      })
      if (res.data.success) {
        setTodaysMeals(meals =>
          meals.map(m => (m.id === selectedMeal.id ? { ...m, wasteRated: true } : m))
        )
        setUserData(prev => ({ ...prev, points: prev.points + 2 }))
        toast.success('Thank you for your feedback!')
      }
    } catch (error) {
      console.error(error)
      toast.error('Could not submit rating.')
    } finally {
      setShowWasteModal(false)
      setLoading(false)
    }
  }

  /* ==============================
     Loading Screen
     ============================== */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white/80">Loading Smart Mess Dashboard...</p>
        </div>
      </div>
    )
  }

  /* ==============================
     Main UI
     ============================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.name || 'User'} 👋
          </h1>
          <p className="text-white/80">Here’s your Smart Mess overview</p>

          <div className="absolute top-8 right-8 flex w-full justify-end">
            <button
              onClick={() => {
                logout()
                setIsAuthenticated(false)
              }}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Logout
            </button>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {[
            { title: 'Points', value: userData.points, icon: Star, color: 'blue' },
            { title: 'Level', value: userData.level, icon: Trophy, color: 'green' },
            { title: 'Streak', value: `${userData.streak} days`, icon: Zap, color: 'orange' },
            { title: 'Attendance', value: `${userData.attendanceRate}%`, icon: Target, color: 'purple' },
          ].map((stat, i) => (
            <Card
              key={i}
              className={`bg-gradient-to-r from-${stat.color}-500/20 to-${stat.color}-500/10 border-${stat.color}-500/30`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-${stat.color}-200 text-sm font-medium`}>{stat.title}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`p-3 bg-${stat.color}-500/30 rounded-full`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-300`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Meals + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Meals Section */}
          <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Today’s Meals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {todaysMeals.length === 0 && (
                <p className="text-slate-400 text-center py-4">
                  No meals booked yet. Use the "Book Now" button to reserve!
                </p>
              )}

              {todaysMeals.map((meal, index) => (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={cn(
                    'p-4 rounded-lg border transition-opacity',
                    meal.status === 'cancelled'
                      ? 'opacity-50 bg-slate-900/50 border-slate-800'
                      : 'border-slate-600 bg-slate-700/30'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getMealIcon(meal.type)}</span>
                      <div>
                        <h4
                          className={cn(
                            'text-white font-medium capitalize',
                            meal.status === 'cancelled' && 'line-through text-slate-500'
                          )}
                        >
                          {meal.type}
                        </h4>
                        <p className="text-slate-400 text-sm">{meal.time}</p>
                      </div>
                    </div>
                    <Badge
                      className={
                        meal.status === 'cancelled'
                          ? 'bg-red-700'
                          : meal.booked
                          ? 'bg-blue-600'
                          : 'bg-slate-600'
                      }
                    >
                      {meal.status === 'cancelled'
                        ? 'Cancelled'
                        : meal.booked
                        ? 'Booked'
                        : 'Not Booked'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div>
                      <p className="text-white font-medium">{meal.meal}</p>
                      <p className="text-slate-400 text-sm">{meal.calories} calories</p>
                    </div>

                    {meal.status !== 'cancelled' && (
                      <>
                        {meal.booked && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedMeal(meal)
                              generateRandomQR(meal.type)
                              setShowQR(true)
                            }}
                          >
                            <QrCode className="w-4 h-4 mr-2" /> Show QR
                          </Button>
                        )}

                        {meal.booked && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelMeal(meal.id, meal.type)}
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Cancel
                          </Button>
                        )}

                        {meal.attended && !meal.wasteRated && (
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={() => {
                              setSelectedMeal(meal)
                              setShowWasteModal(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Rate Waste
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Right-side Panels */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5" /> Weekly Progress
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {userData.weeklyProgress}/{userData.weeklyTarget} bookings this week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress
                  value={(userData.weeklyProgress / userData.weeklyTarget) * 100}
                  className="h-3"
                />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5" /> Streak Achievement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-white">{userData.streak}</p>
                  <p className="text-orange-200">consecutive days</p>
                </div>
                <Progress value={calculateStreakPercentage()} className="h-2 mt-4" />
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-white text-sm font-medium">{a.action}</p>
                      <p className="text-slate-400 text-xs">{a.time}</p>
                    </div>
                    <Badge className="bg-green-600">+{a.points}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center relative"
          >
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold text-white mb-4">
              {selectedMeal?.type.toUpperCase()} QR Code
            </h2>
            <Image src={qrUrl} alt="QR Code" width={180} height={180} className="rounded-lg mx-auto" />
          </motion.div>
        </div>
      )}

      {/* Waste Modal */}
      <Dialog open={showWasteModal} onOpenChange={setShowWasteModal}>
        <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-purple-400" /> Rate Waste for{' '}
              {selectedMeal?.type}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium text-white mb-4">
              How much food was wasted?
            </p>
            <Slider
              defaultValue={[3]}
              max={5}
              step={1}
              min={1}
              onValueChange={val => setWasteRating(val[0])}
            />
            <div className="text-center mt-3 text-white text-lg font-semibold">
              {wasteRating}/5
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleWasteRatingSubmit}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
