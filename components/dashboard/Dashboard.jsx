'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { authState } from '@/atoms'

import { 
  Calendar,
  Clock,
  QrCode,
  Star,
  TrendingUp,
  Utensils,
  Trophy,
  Target,
  ChefHat,
  Users,
  Heart,
  Zap
} from 'lucide-react'

// Mock data
const MOCK_USER_DATA = {
  points: 1250,
  level: 5,
  streak: 12,
  totalBookings: 45,
  attendanceRate: 92,
  favoriteCategory: 'North Indian',
  weeklyTarget: 7,
  weeklyProgress: 5
}

const MOCK_TODAYS_MEALS = [
  {
    type: 'breakfast',
    time: '7:00 - 10:00 AM',
    status: 'completed',
    meal: 'Poha & Chapati',
    calories: 320,
    booked: true,
    attended: true
  },
  {
    type: 'lunch', 
    time: '12:00 - 3:00 PM',
    status: 'upcoming',
    meal: 'Dal Rice & Mixed Veg',
    calories: 450,
    booked: true,
    attended: false
  },
  {
    type: 'snacks',
    time: '4:00 - 6:00 PM', 
    status: 'upcoming',
    meal: 'Samosa & Tea',
    calories: 280,
    booked: false,
    attended: false
  },
  {
    type: 'dinner',
    time: '7:00 - 10:00 PM',
    status: 'upcoming', 
    meal: 'Biryani & Raita',
    calories: 520,
    booked: true,
    attended: false
  }
]

const MOCK_RECENT_ACTIVITY = [
  { action: 'Voted for Lunch menu', time: '2 hours ago', points: 5 },
  { action: 'Checked in for Breakfast', time: '5 hours ago', points: 15 },
  { action: 'Booked Dinner for tomorrow', time: '1 day ago', points: 10 },
  { action: 'Achieved 10-day streak!', time: '1 day ago', points: 50 }
]

import Image from 'next/image' // ✅ for displaying QR
import { useRecoilState } from 'recoil'

export default function Dashboard() {
  const [userData, setUserData] = useState(MOCK_USER_DATA)
  const [todaysMeals, setTodaysMeals] = useState(MOCK_TODAYS_MEALS)
  const [recentActivity, setRecentActivity] = useState(MOCK_RECENT_ACTIVITY)
  const [loading, setLoading] = useState(false)
    const { user, logout } = useAuth()
  const [isAuthenticated, setIsAuthenticated] = useRecoilState(authState)

  // ✅ New states for QR modal
  const [showQR, setShowQR] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [qrUrl, setQrUrl] = useState('')

  const getMealIcon = (type) => {
    const icons = {
      breakfast: '☀️',
      lunch: '🌞', 
      snacks: '🍪',
      dinner: '🌙'
    }
    return icons[type] || '🍽️'
  }

  const calculateStreakPercentage = () => {
    return Math.min((userData.streak / 30) * 100, 100)
  }

  // ✅ Generate random QR (using free API)
  const generateRandomQR = (mealType) => {
    const randomText = `${mealType}-${Math.floor(Math.random() * 100000)}`
    const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${randomText}`
    setQrUrl(qrApi)
  }

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2 font-space-grotesk">
            Welcome back Yashika! 👋
          </h1>
          <p className="text-white/80 text-lg">
            Here's your Smart Mess dashboard for today
          </p>
          <div className='absolute top-8 right-8 flex w-full justify-end'>
          <button
      onClick={() => {
        logout()                  // clears user + token + storage
        setIsAuthenticated(false) // updates UI auth state
      }}
      className="bg-red-600 text-white px-4 py-2 rounded"
    >
      Logout
    </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">Points</p>
                  <p className="text-3xl font-bold text-white">{userData.points}</p>
                </div>
                <div className="p-3 bg-blue-500/30 rounded-full">
                  <Star className="w-6 h-6 text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm font-medium">Level</p>
                  <p className="text-3xl font-bold text-white">{userData.level}</p>
                </div>
                <div className="p-3 bg-green-500/30 rounded-full">
                  <Trophy className="w-6 h-6 text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-sm font-medium">Streak</p>
                  <p className="text-3xl font-bold text-white">{userData.streak} days</p>
                </div>
                <div className="p-3 bg-orange-500/30 rounded-full">
                  <Zap className="w-6 h-6 text-orange-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm font-medium">Attendance</p>
                  <p className="text-3xl font-bold text-white">{userData.attendanceRate}%</p>
                </div>
                <div className="p-3 bg-purple-500/30 rounded-full">
                  <Target className="w-6 h-6 text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Meals */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Today's Meals
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Your meal schedule for today
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {todaysMeals.map((meal, index) => (
  <motion.div
    key={meal.type}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 * index }}
    className={`p-4 rounded-lg border ${
      meal.status === 'completed' 
        ? 'border-green-500/30 bg-green-500/10'
        : meal.status === 'current'
        ? 'border-blue-500/30 bg-blue-500/10'
        : 'border-slate-600 bg-slate-700/30'
    }`}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getMealIcon(meal.type)}</span>
        <div>
          <h4 className="text-white font-medium capitalize">{meal.type}</h4>
          <p className="text-slate-400 text-sm">{meal.time}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge 
          variant={meal.booked ? "default" : "secondary"}
          className={meal.booked ? "bg-blue-600" : ""}
        >
          {meal.booked ? 'Booked' : 'Not Booked'}
        </Badge>
        {meal.attended && (
          <Badge variant="secondary" className="bg-green-600">
            Attended
          </Badge>
        )}
      </div>
    </div>

    <div className="flex items-center justify-between">
      <div>
        <p className="text-white font-medium">{meal.meal}</p>
        <p className="text-slate-400 text-sm">{meal.calories} calories</p>
      </div>

    {meal.booked && !meal.attended && meal.status !== 'completed' && (
  <Button
    size="sm"
    className="bg-green-600 hover:bg-green-700"
    onClick={() => {
      setSelectedMeal(meal)
      generateRandomQR(meal.type)
      setShowQR(true)
    }}
  >
    <QrCode className="w-4 h-4 mr-2" />
    Show QR
  </Button>
)}

      {!meal.booked && meal.status !== 'completed' && (
        <Button
          size="sm"
          variant="outline"
          className="text-white border-white/20"
          onClick={() => {
            // 🔥 Update this meal’s booked status
            const updatedMeals = todaysMeals.map((m) =>
              m.type === meal.type ? { ...m, booked: true } : m
            )
            setTodaysMeals(updatedMeals)
          }}
        >
          Book Now
        </Button>
      )}
    </div>
  </motion.div>
))}

              </CardContent>
            </Card>
          </motion.div>

          <div className="space-y-6">
            {/* Weekly Progress */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Weekly Progress
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {userData.weeklyProgress}/{userData.weeklyTarget} bookings this week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress 
                      value={(userData.weeklyProgress / userData.weeklyTarget) * 100}
                      className="h-3"
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Bookings</span>
                      <span className="text-white font-medium">
                        {userData.weeklyProgress}/{userData.weeklyTarget}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Streak Achievement */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Streak Achievement
                  </CardTitle>
                  <CardDescription className="text-orange-200">
                    Keep it up! You're doing great
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white mb-2">
                        {userData.streak}
                      </div>
                      <div className="text-orange-200">consecutive days</div>
                    </div>
                    <Progress 
                      value={calculateStreakPercentage()}
                      className="h-2"
                    />
                    <div className="text-center text-sm text-orange-200">
                      Goal: 30 days
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
            >
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Your latest actions and rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-white text-sm font-medium">{activity.action}</p>
                          <p className="text-slate-400 text-xs">{activity.time}</p>
                        </div>
                        <Badge variant="secondary" className="bg-green-600">
                          +{activity.points}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
      {showQR && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center relative shadow-2xl max-w-sm w-full"
    >
      {/* Close Button */}
      <button
        onClick={() => setShowQR(false)}
        className="absolute top-3 right-3 text-slate-400 hover:text-white text-lg"
      >
        ✕
      </button>

      <h2 className="text-xl font-semibold text-white mb-4">
        {selectedMeal?.type.toUpperCase()} QR Code
      </h2>

      <div className="flex justify-center mb-4">
        <Image
          src={qrUrl}
          alt="QR Code"
          width={180}
          height={180}
          className="rounded-lg border border-slate-600"
        />
      </div>

      <p className="text-slate-300 text-sm">
        Show this QR at the counter to confirm your {selectedMeal?.type}.
      </p>
    </motion.div>
  </div>
)}
    </div>
  )
}   