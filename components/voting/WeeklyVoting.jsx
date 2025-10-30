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
import { 
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Check,
  ChefHat,
  Coffee,
  UtensilsCrossed,
  Moon
} from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'orange' },
  { id: 'lunch', label: 'Lunch', icon: UtensilsCrossed, color: 'green' },
  { id: 'snacks', label: 'Snacks', icon: ChefHat, color: 'blue' },
  { id: 'dinner', label: 'Dinner', icon: Moon, color: 'purple' }
]

// Mock data for demonstration
const MOCK_MENU_OPTIONS = {
  breakfast: {
    main: [
      { id: 'poha', name: 'Poha', description: 'Flattened rice with vegetables', votes: 45 },
      { id: 'upma', name: 'Upma', description: 'Semolina with spices', votes: 32 },
      { id: 'paratha', name: 'Aloo Paratha', description: 'Stuffed flatbread with potato', votes: 38 }
    ],
    bread: [
      { id: 'toast', name: 'Toast', description: 'Crispy bread slices', votes: 28 },
      { id: 'chapati', name: 'Chapati', description: 'Fresh wheat flatbread', votes: 41 }
    ],
    side: [
      { id: 'yogurt', name: 'Yogurt', description: 'Fresh curd', votes: 35 },
      { id: 'pickle', name: 'Pickle', description: 'Spicy condiment', votes: 22 }
    ]
  },
  lunch: {
    main: [
      { id: 'dal-rice', name: 'Dal Rice', description: 'Lentils with steamed rice', votes: 52 },
      { id: 'rajma', name: 'Rajma Chawal', description: 'Kidney beans curry with rice', votes: 43 },
      { id: 'chole', name: 'Chole Bhature', description: 'Chickpea curry with fried bread', votes: 39 }
    ],
    vegetable: [
      { id: 'mixed-veg', name: 'Mixed Vegetables', description: 'Seasonal vegetable curry', votes: 33 },
      { id: 'palak-paneer', name: 'Palak Paneer', description: 'Spinach with cottage cheese', votes: 47 }
    ],
    bread: [
      { id: 'roti', name: 'Roti', description: 'Whole wheat flatbread', votes: 55 },
      { id: 'naan', name: 'Naan', description: 'Leavened flatbread', votes: 29 }
    ]
  },
  snacks: {
    main: [
      { id: 'samosa', name: 'Samosa', description: 'Crispy pastry with filling', votes: 48 },
      { id: 'pakora', name: 'Pakora', description: 'Deep-fried fritters', votes: 31 },
      { id: 'sandwich', name: 'Grilled Sandwich', description: 'Toasted sandwich with veggies', votes: 36 }
    ],
    drink: [
      { id: 'tea', name: 'Tea', description: 'Hot milk tea', votes: 62 },
      { id: 'coffee', name: 'Coffee', description: 'Filter coffee', votes: 25 }
    ]
  },
  dinner: {
    main: [
      { id: 'biryani', name: 'Vegetable Biryani', description: 'Aromatic rice with vegetables', votes: 58 },
      { id: 'pulao', name: 'Jeera Rice', description: 'Cumin flavored rice', votes: 34 },
      { id: 'dal-chawal', name: 'Dal Chawal', description: 'Simple lentils and rice', votes: 41 }
    ],
    curry: [
      { id: 'paneer-curry', name: 'Paneer Curry', description: 'Cottage cheese in rich gravy', votes: 44 },
      { id: 'veg-curry', name: 'Mix Veg Curry', description: 'Assorted vegetables in curry', votes: 38 }
    ],
    bread: [
      { id: 'chapati-dinner', name: 'Chapati', description: 'Fresh wheat flatbread', votes: 51 },
      { id: 'paratha-dinner', name: 'Paratha', description: 'Layered flatbread', votes: 27 }
    ]
  }
}

export default function WeeklyVoting() {
  const { user, token } = useAuth()
  const [selectedDay, setSelectedDay] = useState(0) // Monday
  const [selectedMeal, setSelectedMeal] = useState('breakfast')
  const [votes, setVotes] = useState({})
  const [loading, setLoading] = useState(false)
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart())

  useEffect(() => {
    // Load user's existing votes
    loadUserVotes()
  }, [])

  const loadUserVotes = async () => {
    if (!token) return
    
    try {
      // Mock loading votes
      setVotes({
        'Monday-breakfast-main': 'poha',
        'Monday-breakfast-bread': 'chapati',
        'Monday-lunch-main': 'dal-rice',
        // ... more votes
      })
    } catch (error) {
      console.error('Failed to load votes:', error)
    }
  }

  const handleVote = async (category, optionId) => {
    if (!token) {
      toast.error('Please login to vote')
      return
    }

    setLoading(true)
    const voteKey = `${DAYS[selectedDay]}-${selectedMeal}-${category}`
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setVotes(prev => ({
        ...prev,
        [voteKey]: optionId
      }))
      
      toast.success('Vote recorded! 🗳️')
    } catch (error) {
      toast.error('Failed to record vote')
    } finally {
      setLoading(false)
    }
  }

  const getCurrentOptions = () => {
    return MOCK_MENU_OPTIONS[selectedMeal] || {}
  }

  const getVoteKey = (category) => {
    return `${DAYS[selectedDay]}-${selectedMeal}-${category}`
  }

  const calculateVotePercentage = (votes, total) => {
    return total > 0 ? (votes / total) * 100 : 0
  }

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
          
          {/* Week Navigator */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button variant="outline" size="sm" className="text-white border-white/20">
              Previous Week
            </Button>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-white font-medium">
                Week of {new Date(weekStart).toLocaleDateString()}
              </span>
            </div>
            <Button variant="outline" size="sm" className="text-white border-white/20">
              Next Week
            </Button>
          </div>
        </motion.div>

        {/* Day Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day, index) => (
              <Button
                key={day}
                variant={selectedDay === index ? "default" : "outline"}
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Tabs value={selectedMeal} onValueChange={setSelectedMeal} className="w-full">
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
              <TabsContent key={meal.id} value={meal.id} className="mt-6">
                <div className="grid gap-6">
                  {Object.entries(getCurrentOptions()).map(([category, options]) => (
                    <Card key={category} className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white capitalize flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-${getMealColor(meal.id)}-500`} />
                          {category.replace('-', ' ')} Options
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Choose your preferred {category} for {DAYS[selectedDay]} {meal.label}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4">
                          {options.map((option) => {
                            const isSelected = votes[getVoteKey(category)] === option.id
                            const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0)
                            const percentage = calculateVotePercentage(option.votes, totalVotes)
                            
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
                                    {isSelected && <Check className="w-5 h-5 text-blue-500" />}
                                    <div>
                                      <h4 className="text-white font-medium">{option.name}</h4>
                                      <p className="text-slate-400 text-sm">{option.description}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center gap-2 text-white">
                                      <Users className="w-4 h-4" />
                                      <span className="font-medium">{option.votes}</span>
                                    </div>
                                    <div className="text-slate-400 text-sm">votes</div>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">
                                      {percentage.toFixed(1)}% of votes
                                    </span>
                                    {isSelected && (
                                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
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
        </motion.div>

        {/* Voting Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Your Votes This Week</p>
                  <p className="text-slate-400 text-sm">{Object.keys(votes).length} meals voted</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Community Participation</p>
                  <p className="text-slate-400 text-sm">87% students voted</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Voting Deadline</p>
                  <p className="text-slate-400 text-sm">2 days remaining</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

function getCurrentWeekStart() {
  const now = new Date()
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)) // Monday
  return startOfWeek.toISOString().split('T')[0]
}

function getMealColor(mealType) {
  const colors = {
    breakfast: 'orange',
    lunch: 'green', 
    snacks: 'blue',
    dinner: 'purple'
  }
  return colors[mealType] || 'blue'
}