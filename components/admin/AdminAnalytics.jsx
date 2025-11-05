'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Cell
} from 'recharts'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { LayoutDashboard, Users, Trash2, Zap, UtensilsCrossed, Calendar } from 'lucide-react'

// --- Mock/Demo Data ---
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
        cancellationRate: '4.2%'
    },
    popularMeals: [
        { name: "Dal Makhani", votes: 89 },
        { name: "Aloo Paratha", votes: 75 },
        { name: "Veg Biryani", votes: 62 },
        { name: "Chicken Curry", votes: 48 },
        { name: "Samosa", votes: 35 },
    ]
}

const PIE_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5']; // Green gradient for waste

// --- Main Component ---
export default function AdminAnalytics() {
    const { token, user } = useAuth()
    const [analyticsData, setAnalyticsData] = useState(MOCK_ANALYTICS_DATA)
    const [loading, setLoading] = useState(false)

    // In a real app, this would fetch data based on date range or week, using user.token
    const fetchData = useCallback(async () => {
        if (user?.role !== 'admin') {
            toast.error("Unauthorized. Admin access required.");
            return;
        }

        setLoading(true);
        // **TODO**: Replace with API call to fetch real analytics data
        // try {
        //     const response = await fetch('/api/admin/analytics', {
        //         headers: { 'Authorization': `Bearer ${token}` }
        //     });
        //     if (response.ok) {
        //         const data = await response.json();
        //         setAnalyticsData(data.analytics); // Assuming API returns data in structure above
        //     } else {
        //         toast.error("Failed to fetch analytics data.");
        //     }
        // } catch (error) {
        //     toast.error("Network error while fetching data.");
        // } finally {
        //     setLoading(false);
        // }
        
        // Simulating loading time for mock data
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        setLoading(false);
    }, [user, token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Check if the user is authorized (Client-side check)
    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <p className="text-red-400 text-xl font-semibold">ACCESS DENIED: Administrative privileges required.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 pt-20">
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
                    Operational metrics for the past week: Demand, Participation, and Waste.
                </p>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <Card key={i} className="bg-slate-800/50 border-slate-700 h-32 p-4">
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
                            {/* Total Users */}
                            <KPICard 
                                title="Total Users"
                                value={analyticsData.kpis.totalUsers}
                                icon={Users}
                                color="blue"
                            />
                            {/* Avg Waste Rating (Lower is better) */}
                            <KPICard 
                                title="Avg Waste Rating"
                                value={`${analyticsData.kpis.averageWasteRating} / 5`}
                                subtext="(Lower is Better)"
                                icon={Trash2}
                                color="green"
                            />
                            {/* Total Bookings */}
                            <KPICard 
                                title="Total Bookings"
                                value={analyticsData.kpis.totalBookingsLastWeek}
                                icon={UtensilsCrossed}
                                color="purple"
                            />
                            {/* Cancellation Rate */}
                            <KPICard 
                                title="Cancellation Rate"
                                value={analyticsData.kpis.cancellationRate}
                                icon={XCircle}
                                color="red"
                            />
                        </motion.div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Chart 1: Votes vs. Bookings */}
                            <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
                                <CardHeader>
                                    <CardTitle className="text-white">Weekly Demand & Engagement</CardTitle>
                                    <CardDescription className="text-slate-400">Votes vs. confirmed bookings across the week.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={analyticsData.weeklyParticipation}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="name" stroke="#9ca3af" />
                                            <YAxis stroke="#9ca3af" />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: 'white' }}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '10px', color: 'white' }} />
                                            <Bar dataKey="votes" fill="#3b82f6" name="Votes Cast" />
                                            <Bar dataKey="bookings" fill="#a855f7" name="Meals Booked" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Chart 2: Waste Distribution (Pie Chart) */}
                            <Card className="bg-slate-800/50 border-slate-700">
                                <CardHeader>
                                    <CardTitle className="text-white">Waste Rating Distribution</CardTitle>
                                    <CardDescription className="text-slate-400">Distribution of "waste left on plate" ratings (1=None, 5=All)</CardDescription>
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
                                                fill="#8884d8"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            >
                                                {analyticsData.wasteDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: 'white' }}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '10px', color: 'white' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            
                            {/* Popular Meals (Line Chart - Mock data visualization change) */}
                            <Card className="lg:col-span-3 bg-slate-800/50 border-slate-700">
                                <CardHeader>
                                    <CardTitle className="text-white">Most Popular Meal Options</CardTitle>
                                    <CardDescription className="text-slate-400">Top 5 meal options chosen across all votes and bookings.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <LineChart data={analyticsData.popularMeals} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="name" stroke="#9ca3af" />
                                            <YAxis stroke="#9ca3af" />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: 'white' }}
                                            />
                                            <Line type="monotone" dataKey="votes" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 8 }} name="Total Votes/Bookings" />
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

// --- Helper Component ---
const KPICard = ({ title, value, subtext, icon: Icon, color }) => (
    <Card className={`bg-gradient-to-r from-${color}-500/20 to-${color}-500/10 border-${color}-500/30`}>
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className={`text-${color}-200 text-sm font-medium`}>{title}</p>
                    <p className="text-3xl font-bold text-white">{value}</p>
                    {subtext && <p className={`text-${color}-300 text-xs mt-1`}>{subtext}</p>}
                </div>
                <div className={`p-3 bg-${color}-500/30 rounded-full`}>
                    <Icon className={`w-6 h-6 text-${color}-300`} />
                </div>
            </div>
        </CardContent>
    </Card>
);