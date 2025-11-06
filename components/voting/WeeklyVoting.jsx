'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Users, TrendingUp, Clock, Check, ChefHat, Coffee, UtensilsCrossed, Moon } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: Coffee },
  { id: 'lunch', label: 'Lunch', icon: UtensilsCrossed },
  { id: 'snacks', label: 'Snacks', icon: ChefHat },
  { id: 'dinner', label: 'Dinner', icon: Moon }
]

export default function WeeklyVoting() {
  const { token } = useAuth()
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedMeal, setSelectedMeal] = useState('breakfast')
  const [menu, setMenu] = useState({})
  const [votes, setVotes] = useState({})
  const [loading, setLoading] = useState(false)
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart())

  useEffect(() => {
    if (token) {
      fetchWeeklyMenu()
      fetchUserVotes()
    }
  }, [token, weekStart])

  /* ------------------------------------------------------
     🔹 Load Weekly Menu from Backend
     ------------------------------------------------------ */
  const fetchWeeklyMenu = async () => {
    try {
      const res = await fetch(`/api/menu/weekly?week=${weekStart}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setMenu(data.menu || {})
      } else {
        console.warn('Menu not found, showing default mock data.')
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err)
    }
  }

  /* ------------------------------------------------------
     🔹 Load User Votes
     ------------------------------------------------------ */
  const fetchUserVotes = async () => {
    try {
      const res = await fetch(`/api/votes?week=${weekStart}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setVotes(data.votes || {})
    } catch (err) {
      console.error('Failed to fetch votes:', err)
    }
  }

  /* ------------------------------------------------------
     🔹 Submit Vote
     ------------------------------------------------------ */
  const handleVote = async (category, optionId) => {
    if (!token) return toast.error('Please login to vote.')

    setLoading(true)
    const voteKey = `${DAYS[selectedDay]}-${selectedMeal}-${category}`

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          weekStart,
          day: DAYS[selectedDay],
          mealType: selectedMeal,
          category,
          optionId,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setVotes((prev) => ({ ...prev, [voteKey]: optionId }))
        toast.success('Vote recorded! 🗳️')
      } else toast.error(data.error || 'Vote failed')
    } catch (error) {
      toast.error('Failed to connect to voting server')
    } finally {
      setLoading(false)
    }
  }

  /* ------------------------------------------------------
     🔹 Helpers
     ------------------------------------------------------ */
  const getCurrentOptions = () => {
    if (!menu?.options) return {}
    return menu.options[selectedMeal] || {}
  }

  const getVoteKey = (category) =>
    `${DAYS[selectedDay]}-${selectedMeal}-${category}`

  const calculateVotePercentage = (votes, total) =>
    total > 0 ? (votes / total) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4 font-space-grotesk">
            Weekly Menu Voting
          </h1>
          <p className="text-white/80 text-lg mb-6">
            Vote for your favorite meals for the week ahead! 🗳️
          </p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              className="text-white border-white/20"
              onClick={() => changeWeek(-7)}
            >
              Previous Week
            </Button>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-white font-medium">
                Week of {new Date(weekStart).toLocaleDateString()}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-white border-white/20"
              onClick={() => changeWeek(7)}
            >
              Next Week
            </Button>
          </div>
        </motion.div>

        {/* Day Selector */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-7 gap-2 mb-6">
            {DAYS.map((day, index) => (
              <Button
                key={day}
                variant={selectedDay === index ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDay(index)}
                className={`${
                  selectedDay === index
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'text-white border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="text-center">
                  <div className="font-medium">{day.slice(0, 3)}</div>
                  <div className="text-xs opacity-75">
                    {new Date(Date.now() + index * 24 * 60 * 60 * 1000).getDate()}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Meal Type Tabs */}
        <Tabs value={selectedMeal} onValueChange={setSelectedMeal}>
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
            {MEAL_TYPES.map((meal) => (
              <TabsTrigger
                key={meal.id}
                value={meal.id}
                className="data-[state=active]:bg-blue-600 text-white"
              >
                <meal.icon className="w-4 h-4 mr-2" />
                {meal.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {MEAL_TYPES.map((meal) => (
            <TabsContent key={meal.id} value={meal.id}>
              <div className="grid gap-6 mt-6">
                {Object.entries(getCurrentOptions()).map(([category, options]) => (
                  <Card key={category} className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white capitalize flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-blue-500`} />
                        {category.replace('-', ' ')} Options
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Choose your preferred {category} for {DAYS[selectedDay]}{' '}
                        {meal.label}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {options.map((option) => {
                          const isSelected =
                            votes[getVoteKey(category)] === option.id
                          const totalVotes = options.reduce(
                            (sum, opt) => sum + (opt.votes || 0),
                            0
                          )
                          const percentage = calculateVotePercentage(
                            option.votes || 0,
                            totalVotes
                          )

                          return (
                            <motion.div
                              key={option.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-500/10'
                                  : 'border-slate-600 bg-slate-700/30 hover:bg-slate-700/50'
                              }`}
                              onClick={() => handleVote(category, option.id)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  {isSelected && (
                                    <Check className="w-5 h-5 text-blue-500" />
                                  )}
                                  <div>
                                    <h4 className="text-white font-medium">
                                      {option.name}
                                    </h4>
                                    <p className="text-slate-400 text-sm">
                                      {option.description}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-2 text-white">
                                    <Users className="w-4 h-4" />
                                    <span className="font-medium">
                                      {option.votes || 0}
                                    </span>
                                  </div>
                                  <div className="text-slate-400 text-sm">
                                    votes
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-400">
                                    {percentage.toFixed(1)}% of votes
                                  </span>
                                  {isSelected && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-blue-500/20 text-blue-400"
                                    >
                                      Your Vote
                                    </Badge>
                                  )}
                                </div>
                                <Progress
                                  value={percentage}
                                  className="h-2 bg-slate-600"
                                />
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <StatCard icon={TrendingUp} title="Your Votes This Week" value={`${Object.keys(votes).length} meals`} color="blue" />
          <StatCard icon={Users} title="Community Participation" value="87% students voted" color="green" />
          <StatCard icon={Clock} title="Voting Deadline" value="2 days remaining" color="purple" />
        </motion.div>
      </div>
    </div>
  )
}

/* ===========================================================
   Small Helper Components
   =========================================================== */
function StatCard({ icon: Icon, title, value, color }) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 bg-${color}-500/20 rounded-lg`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        <div>
          <p className="text-white font-medium">{title}</p>
          <p className="text-slate-400 text-sm">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function getCurrentWeekStart() {
  const now = new Date()
  const start = new Date(now.setDate(now.getDate() - now.getDay() + 1))
  return start.toISOString().split('T')[0]
}

function changeWeek(offsetDays) {
  const current = new Date(getCurrentWeekStart())
  const next = new Date(current.setDate(current.getDate() + offsetDays))
  return next.toISOString().split('T')[0]
}
