'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { authState } from '@/atoms'
import { toast } from 'sonner' 
import { Slider } from '@/components/ui/slider' 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog' 
import { v4 as uuidv4 } from 'uuid';
import { cn } from "@/lib/utils" 

import { 
  Calendar,
  Clock,
  QrCode,
  Star,
  Trophy,
  Target,
  Zap,
  Trash2, 
  XCircle, 
  TrendingUp
} from 'lucide-react'

// Define default structure for state initialization (no longer loading mock values)
const DEFAULT_USER_DATA = {
  points: 0,
  level: 1,
  streak: 0,
  totalBookings: 0,
  attendanceRate: 0,
  favoriteCategory: 'N/A',
  weeklyTarget: 7,
  weeklyProgress: 0
}
const DEFAULT_MEALS = []
const DEFAULT_ACTIVITY = []


import Image from 'next/image'
import { useRecoilState } from 'recoil'

export default function Dashboard() {
  const { user, token, logout, loading: authLoading } = useAuth()
  const [userData, setUserData] = useState(DEFAULT_USER_DATA)
  const [todaysMeals, setTodaysMeals] = useState(DEFAULT_MEALS)
  const [recentActivity, setRecentActivity] = useState(DEFAULT_ACTIVITY)
  const [loading, setLoading] = useState(true) // Set to true initially for data fetching
  const [isAuthenticated, setIsAuthenticated] = useRecoilState(authState)

  const [showQR, setShowQR] = useState(false)
  const [showWasteModal, setShowWasteModal] = useState(false) 
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [qrUrl, setQrUrl] = useState('')
  const [wasteRating, setWasteRating] = useState(3) 

  
  // --- Data Fetching Logic ---
  const fetchData = useCallback(async () => {
    if (!token) {
        setLoading(false);
        return;
    }

    setLoading(true);

    try {
        // 1. Fetch User Profile/Stats
        const userRes = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const userResult = await userRes.json();
        
        if (userRes.ok && userResult.user) {
            setUserData(prev => ({ 
                ...prev, 
                points: userResult.user.points || 0,
                level: userResult.user.level || 1,
                streak: userResult.user.streak || 0,
                // Add more data mapping here if user object contains full stats
            }));
        } else {
             // Handle token expiration or invalid user data
            console.error('Failed to fetch user data:', userResult.error);
            toast.error('Session expired. Please log in again.');
            logout();
        }

        // 2. Fetch Today's Bookings
        const bookingsRes = await fetch('/api/bookings/user', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const bookingsResult = await bookingsRes.json();

        if (bookingsRes.ok && bookingsResult.bookings) {
             // NOTE: Real booking data structure from backend needs mapping to frontend format
             // The structure below is complex and assumes mapping from DB objects.
             // For now, we'll just set the bookings array.
             // **TODO: Implement proper mapping function for meal data structure**
             setTodaysMeals(bookingsResult.bookings); 
        } else {
             console.error('Failed to fetch bookings:', bookingsResult.error);
        }

        // 3. Mock Activity Data (Until /api/activity exists)
        setRecentActivity([
            { action: 'Fetched new data', time: 'Just now', points: 0 },
            ...[
                 { action: 'Voted for Lunch menu', time: '2 hours ago', points: 5 },
                 { action: 'Checked in for Breakfast', time: '5 hours ago', points: 15 },
            ]
        ]);

    } catch (error) {
        console.error('Data fetch error:', error);
        toast.error('Could not connect to server.');
    } finally {
        setLoading(false);
    }
  }, [token, logout])


  useEffect(() => {
    if (token && !authLoading) {
      fetchData();
    }
  }, [token, authLoading, fetchData]);
  
  
  // --- Existing Logic ---
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

  // Generate random QR (using free API)
  const generateRandomQR = (mealType) => {
    const randomText = `${mealType}-${Math.floor(Math.random() * 100000)}`
    const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${randomText}`
    setQrUrl(qrApi)
  }
  
  // Handle Meal Cancellation - Calls API
  const handleCancelMeal = async (mealId, mealType) => {
    // IMPORTANT: Custom modal should replace window.confirm
    if (!token || !window.confirm(`Are you sure you want to cancel your ${mealType} booking? You may lose 5 points.`)) {
      return;
    }
    setLoading(true);
    
    try {
      // API Call to backend
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId: mealId })
      });

      const result = await response.json();

      if (response.ok) {
        // Update frontend state to reflect cancellation
        const updatedMeals = todaysMeals.map((m) =>
            m.id === mealId ? { ...m, booked: false, status: 'cancelled' } : m
        );
        setTodaysMeals(updatedMeals);
        toast.success(result.message);
        setUserData(prev => ({ ...prev, points: prev.points - 5 }));
      } else {
        toast.error(result.error || 'Failed to cancel booking.');
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      toast.error('Network error during cancellation.');
    } finally {
      setLoading(false);
    }
  }

  // Handle Waste Rating Submission - Calls API
  const handleWasteRatingSubmit = async () => {
    if (!token || !selectedMeal) return;
    
    setLoading(true);

    try {
      // API Call to backend
      const response = await fetch('/api/meal/waste-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId: selectedMeal.id, wasteRating })
      });

      const result = await response.json();

      if (response.ok) {
        // Update frontend state to reflect rating submission
        const updatedMeals = todaysMeals.map((m) =>
          m.id === selectedMeal.id ? { ...m, wasteRated: true } : m
        );
        setTodaysMeals(updatedMeals);
        toast.success(result.message);
        setUserData(prev => ({ ...prev, points: prev.points + 2 }));

      } else {
        toast.error(result.error || 'Failed to record waste rating.');
      }
    } catch (error) {
      console.error('Waste rating error:', error);
      toast.error('Network error during rating submission.');
    } finally {
      setLoading(false);
      setShowWasteModal(false);
    }
  }

  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center pt-16">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white/80">Loading user dashboard...</p>
        </div>
      </div>
    )
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
            Welcome back {user?.name || 'User'}! 👋
          </h1>
          <p className="text-white/80 text-lg">
            Here's your Smart Mess dashboard for today
          </p>
          <div className='absolute top-8 right-8 flex w-full justify-end'>
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
    key={meal.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 * index }}
    className={cn(
      "p-4 rounded-lg border transition-opacity",
      meal.status === 'completed' 
        ? 'border-green-500/30 bg-green-500/10'
        : meal.status === 'current'
        ? 'border-blue-500/30 bg-blue-500/10'
        : 'border-slate-600 bg-slate-700/30',
      // NEW: Visual styling for cancelled meals
      meal.status === 'cancelled' && 'opacity-50 bg-slate-900/50 border-slate-800'
    )}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getMealIcon(meal.type)}</span>
        <div>
          {/* Apply strikethrough and gray text if cancelled */}
          <h4 className={cn("text-white font-medium capitalize", meal.status === 'cancelled' && 'line-through text-slate-500')}>{meal.type}</h4>
          <p className="text-slate-400 text-sm">{meal.time}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Conditional Badge Rendering */}
        {meal.status === 'cancelled' ? (
             <Badge variant="destructive" className="bg-red-700">Cancelled</Badge>
        ) : (
            <>
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
            </>
        )}
      </div>
    </div>

    <div className="flex items-center justify-between space-x-2"> 
      <div>
        {/* Apply strikethrough and gray text if cancelled */}
        <p className={cn("text-white font-medium", meal.status === 'cancelled' && 'line-through text-slate-500')}>{meal.meal}</p>
        <p className="text-slate-400 text-sm">{meal.calories} calories</p>
      </div>

    {/* Only render action buttons if the meal is NOT cancelled */}
    {meal.status !== 'cancelled' && (
        <>
            {/* 1. Show QR (Booked & Upcoming/Current) */}
            {meal.booked && !meal.attended && meal.status !== 'completed' && (
            <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                setSelectedMeal(meal)
                generateRandomQR(meal.type)
                setShowQR(true)
                }}
                disabled={loading}
            >
                <QrCode className="w-4 h-4 mr-2" />
                Show QR
            </Button>
            )}
            
            {/* 2. Cancel Meal (Booked & Upcoming) */}
            {meal.booked && meal.status === 'upcoming' && (
            <Button
                size="sm"
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => handleCancelMeal(meal.id, meal.type)} 
                disabled={loading}
            >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
            </Button>
            )}

            {/* 3. Rate Waste (Attended & Not Rated) */}
            {meal.attended && !meal.wasteRated && (
                <Button
                    size="sm"
                    variant="secondary"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => {
                        setSelectedMeal(meal);
                        setShowWasteModal(true); 
                    }}
                    disabled={loading}
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Rate Waste
                </Button>
            )}

            {/* 4. Book Now (Not booked & Upcoming/Current) */}
            {!meal.booked && meal.status !== 'completed' && (
                <Button
                    size="sm"
                    variant="outline"
                    className="text-white border-white/20"
                    onClick={() => {
                        // MOCK: Generates a new mock ID and sets booked status
                        const updatedMeals = todaysMeals.map((m) =>
                        m.type === meal.type ? { ...m, booked: true, id: uuidv4(), status: 'upcoming' } : m
                        )
                        setTodaysMeals(updatedMeals)
                        toast.success(`${meal.type} booked! Remember to check in.`);
                    }}
                    disabled={loading}
                >
                    Book Now
                </Button>
            )}
        </>
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
      
      {/* Existing QR Code Modal (No changes) */}
      {showQR && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center relative shadow-2xl max-w-sm w-full"
          >
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

      {/* NEW Waste Rating Modal (No changes) */}
      <Dialog open={showWasteModal} onOpenChange={setShowWasteModal}>
        <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-purple-400" />
                Rate Waste for {selectedMeal?.type}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Help us reduce food waste! Please rate the amount of food you left on your plate.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <p className="text-sm font-medium text-white">How much food was wasted?</p>
              <Slider
                defaultValue={[3]}
                max={5}
                step={1}
                min={1}
                onValueChange={(value) => setWasteRating(value[0])}
                className="w-full [&>span:first-child]:h-2 [&>span:first-child]:bg-purple-600/20 [&>span:first-child>span]:bg-purple-600"
              />
              <div className="flex justify-between text-xs text-slate-400 pt-2">
                <span>1 (None)</span>
                <span>2</span>
                <span className="text-lg font-bold text-white">{wasteRating}</span>
                <span>4</span>
                <span>5 (All)</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
                onClick={handleWasteRatingSubmit} 
                className="bg-purple-600 hover:bg-purple-700 text-white"
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