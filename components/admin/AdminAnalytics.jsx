'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  LayoutDashboard,
  Users,
  Trash2,
  XCircle,
  UtensilsCrossed,
} from 'lucide-react'
// import { api } from '@/lib/api'

/* ---------------- Mock Data ---------------- */
const MOCK_ANALYTICS_DATA = {
  weeklyParticipation: [
    { name: 'Mon', votes: 120, bookings: 90 },
    { name: 'Tue', votes: 150, bookings: 130 },
    { name: 'Wed', votes: 110, bookings: 85 },
    { name: 'Thu', votes: 180, bookings: 160 },
    { name: 'Fri', votes: 140, bookings: 100 },
    { name: 'Sat', votes: 60, bookings: 55 },
    { name: 'Sun', votes: 30, bookings: 25 },
  ],
  wasteDistribution: [
    { name: 'None (1)', value: 450 },
    { name: 'Low (2)', value: 300 },
    { name: 'Medium (3)', value: 200 },
    { name: 'High (4)', value: 100 },
    { name: 'All (5)', value: 50 },
  ],
  kpis: {
    totalUsers: 500,
    averageWasteRating: 2.1,
    totalBookingsLastWeek: 745,
    cancellationRate: '4.2%',
  },
  popularMeals: [
    { name: 'Dal Makhani', votes: 89 },
    { name: 'Aloo Paratha', votes: 75 },
    { name: 'Veg Biryani', votes: 62 },
    { name: 'Chicken Curry', votes: 48 },
    { name: 'Samosa', votes: 35 },
  ],
}

const PIE_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5']

/* ---------------- Component ---------------- */
export default function AdminAnalytics() {
  const { token, user } = useAuth()
  const [analyticsData, setAnalyticsData] = useState(MOCK_ANALYTICS_DATA)
  const [loading, setLoading] = useState(true)

  // Fetch from backend
  const fetchData = useCallback(async () => {
    if (user?.role !== 'admin') {
      toast.error('Unauthorized. Admin access required.')
      return
    }

    try {
      setLoading(true)
      /* --- Real backend call example ---
      const res = await api.get('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAnalyticsData(res.data.analytics)
      */

      // Simulate backend delay (mock data)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setAnalyticsData(MOCK_ANALYTICS_DATA)
    } catch (err) {
      toast.error('Failed to fetch analytics data.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user, token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-red-400 text-xl font-semibold">
          ACCESS DENIED: Administrative privileges required.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg p-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-white mb-6 flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-blue-400" />
          Admin Analytics Dashboard
        </h1>
        <p className="text-slate-400 mb-8">
          Operational metrics for the past week: demand, participation, and
          waste.
        </p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card
                key={i}
                className="bg-slate-800/50 border-slate-700 h-32 p-4"
              >
                <Skeleton className="h-4 w-1/2 mb-3 bg-slate-700" />
                <Skeleton className="h-8 w-full bg-slate-600" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            >
              <KPICard
                title="Total Users"
                value={analyticsData.kpis.totalUsers}
                icon={Users}
                color="blue"
              />
              <KPICard
                title="Avg Waste Rating"
                value={`${analyticsData.kpis.averageWasteRating} / 5`}
                subtext="(Lower is better)"
                icon={Trash2}
                color="green"
              />
              <KPICard
                title="Total Bookings"
                value={analyticsData.kpis.totalBookingsLastWeek}
                icon={UtensilsCrossed}
                color="purple"
              />
              <KPICard
                title="Cancellation Rate"
                value={analyticsData.kpis.cancellationRate}
                icon={XCircle}
                color="red"
              />
            </motion.div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Bar Chart */}
              <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    Weekly Demand & Engagement
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Votes vs. confirmed bookings across the week.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.weeklyParticipation}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #4b5563',
                          color: 'white',
                        }}
                      />
                      <Legend wrapperStyle={{ color: 'white' }} />
                      <Bar dataKey="votes" fill="#3b82f6" name="Votes" />
                      <Bar dataKey="bookings" fill="#a855f7" name="Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pie Chart */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    Waste Rating Distribution
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Rating 1=None → 5=All food wasted
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.wasteDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                      >
                        {analyticsData.wasteDistribution.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #4b5563',
                          color: 'white',
                        }}
                      />
                      <Legend wrapperStyle={{ color: 'white' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Line Chart */}
              <Card className="lg:col-span-3 bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    Most Popular Meal Options
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Top 5 meal choices across all votes/bookings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analyticsData.popularMeals}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #4b5563',
                          color: 'white',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="votes"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

/* ---------------- Helper Component ---------------- */
const colorVariants = {
  blue: 'from-blue-500/20 to-blue-500/10 border-blue-500/30 text-blue-200',
  green: 'from-green-500/20 to-green-500/10 border-green-500/30 text-green-200',
  purple:
    'from-purple-500/20 to-purple-500/10 border-purple-500/30 text-purple-200',
  red: 'from-red-500/20 to-red-500/10 border-red-500/30 text-red-200',
}

const KPICard = ({ title, value, subtext, icon: Icon, color }) => {
  const variant = colorVariants[color] || colorVariants.blue
  return (
    <Card className={`bg-gradient-to-r ${variant}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
            {subtext && <p className="text-xs mt-1 opacity-70">{subtext}</p>}
          </div>
          <div className="p-3 bg-white/10 rounded-full">
            <Icon className="w-6 h-6 text-white/80" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
