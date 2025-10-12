import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import QRCode from 'qrcode'

const client = new MongoClient(process.env.MONGO_URL)
let db

async function connectDB() {
  if (!db) {
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

// Auth middleware
async function authenticate(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  try {
    const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret')
    const database = await connectDB()
    const user = await database.collection('users').findOne({ id: payload.userId })
    return user
  } catch (error) {
    return null
  }
}

// GET requests
export async function GET(request) {
  const { pathname, searchParams } = new URL(request.url)
  const database = await connectDB()

  try {
    // Auth check
    if (pathname.includes('/auth/me')) {
      const user = await authenticate(request)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
    }

    // Get weekly menu with voting
    if (pathname.includes('/menu/weekly')) {
      const weekStart = searchParams.get('week') || getCurrentWeekStart()
      
      const menu = await database.collection('weekly_menus').findOne({ weekStart })
      if (!menu) {
        return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
      }

      // Get meal options with vote counts
      const mealOptions = await database.collection('meal_options').find({ weeklyMenuId: menu.id }).toArray()
      const votes = await database.collection('votes').find({ weeklyMenuId: menu.id }).toArray()
      
      // Calculate vote counts
      const voteCounts = votes.reduce((acc, vote) => {
        acc[vote.optionId] = (acc[vote.optionId] || 0) + 1
        return acc
      }, {})

      const enrichedOptions = mealOptions.map(option => ({
        ...option,
        voteCount: voteCounts[option.id] || 0
      }))

      return NextResponse.json({ 
        menu: { ...menu, options: enrichedOptions },
        userCanVote: true // Will be enhanced with user auth
      })
    }

    // Get dishes
    if (pathname.includes('/dishes')) {
      const search = searchParams.get('search') || ''
      const category = searchParams.get('category') || ''
      
      let query = {}
      if (search) {
        query.name = { $regex: search, $options: 'i' }
      }
      if (category) {
        query.category = category
      }

      const dishes = await database.collection('dishes').find(query).toArray()
      return NextResponse.json({ dishes })
    }

    // Get user bookings
    if (pathname.includes('/bookings/user')) {
      const user = await authenticate(request)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
      const bookings = await database.collection('bookings').find({ 
        userId: user.id, 
        date: { $gte: date } 
      }).toArray()
      
      return NextResponse.json({ bookings })
    }

    // Get nutrition advice (AI endpoint)
    if (pathname.includes('/nutrition/advice')) {
      const prompt = searchParams.get('prompt')
      if (!prompt) {
        return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
      }

      try {
        // Mock AI response for now - will integrate with Emergent LLM
        const response = await generateNutritionAdvice(prompt)
        return NextResponse.json({ advice: response })
      } catch (error) {
        return NextResponse.json({ error: 'Failed to generate advice' }, { status: 500 })
      }
    }

    // Get admin analytics
    if (pathname.includes('/admin/analytics')) {
      const user = await authenticate(request)
      if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const weekStart = searchParams.get('week') || getCurrentWeekStart()
      
      // Get voting stats
      const votes = await database.collection('votes').find({ weekStart }).toArray()
      const bookings = await database.collection('bookings').find({ 
        date: { $gte: weekStart } 
      }).toArray()
      
      const analytics = {
        totalVotes: votes.length,
        totalBookings: bookings.length,
        participationRate: votes.length / (await database.collection('users').countDocuments()),
        popularMeals: await getPopularMeals(weekStart)
      }

      return NextResponse.json({ analytics })
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST requests
export async function POST(request) {
  const { pathname } = new URL(request.url)
  const database = await connectDB()

  try {
    // User registration
    if (pathname.includes('/auth/register')) {
      const { name, email, password, role = 'student' } = await request.json()
      
      if (!name || !email || !password) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      // Check if user exists
      const existingUser = await database.collection('users').findOne({ email })
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(password, 12)
      const userId = uuidv4()
      
      const user = {
        id: userId,
        name,
        email,
        password: hashedPassword,
        role,
        createdAt: new Date(),
        points: 0,
        level: 1,
        streak: 0
      }

      await database.collection('users').insertOne(user)
      
      const token = jwt.sign({ userId }, process.env.NEXTAUTH_SECRET || 'fallback-secret')
      
      return NextResponse.json({ 
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token 
      })
    }

    // User login
    if (pathname.includes('/auth/login')) {
      const { email, password } = await request.json()
      
      if (!email || !password) {
        return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
      }

      const user = await database.collection('users').findOne({ email })
      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const validPassword = await bcrypt.compare(password, user.password)
      if (!validPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const token = jwt.sign({ userId: user.id }, process.env.NEXTAUTH_SECRET || 'fallback-secret')
      
      return NextResponse.json({ 
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token 
      })
    }

    // Cast vote
    if (pathname.includes('/vote')) {
      const user = await authenticate(request)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { weeklyMenuId, optionId, mealType, dayOfWeek } = await request.json()
      
      // Check if user already voted for this meal
      const existingVote = await database.collection('votes').findOne({
        userId: user.id,
        weeklyMenuId,
        mealType,
        dayOfWeek
      })

      if (existingVote) {
        // Update existing vote
        await database.collection('votes').updateOne(
          { _id: existingVote._id },
          { $set: { optionId, updatedAt: new Date() } }
        )
      } else {
        // Create new vote
        const vote = {
          id: uuidv4(),
          userId: user.id,
          weeklyMenuId,
          optionId,
          mealType,
          dayOfWeek,
          createdAt: new Date()
        }
        await database.collection('votes').insertOne(vote)
        
        // Award points for voting
        await database.collection('users').updateOne(
          { id: user.id },
          { $inc: { points: 5 } }
        )
      }

      return NextResponse.json({ success: true })
    }

    // Create booking
    if (pathname.includes('/bookings')) {
      const user = await authenticate(request)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { date, mealType, selectedOptions } = await request.json()
      
      // Check if already booked
      const existingBooking = await database.collection('bookings').findOne({
        userId: user.id,
        date,
        mealType
      })

      if (existingBooking) {
        return NextResponse.json({ error: 'Already booked for this meal' }, { status: 400 })
      }

      const bookingId = uuidv4()
      const qrData = JSON.stringify({ bookingId, userId: user.id, date, mealType })
      const qrCode = await QRCode.toDataURL(qrData)

      const booking = {
        id: bookingId,
        userId: user.id,
        date,
        mealType,
        selectedOptions,
        qrCode,
        status: 'booked',
        createdAt: new Date()
      }

      await database.collection('bookings').insertOne(booking)
      
      // Award points for booking
      await database.collection('users').updateOne(
        { id: user.id },
        { $inc: { points: 10 } }
      )

      return NextResponse.json({ booking })
    }

    // Nutrition advice with AI
    if (pathname.includes('/nutrition/advice')) {
      const { prompt, sessionId } = await request.json()
      
      if (!prompt) {
        return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
      }

      try {
        const advice = await generateNutritionAdvice(prompt, sessionId)
        return NextResponse.json({ advice })
      } catch (error) {
        console.error('Nutrition advice error:', error)
        return NextResponse.json({ error: 'Failed to generate advice' }, { status: 500 })
      }
    }

    // Generate meal image
    if (pathname.includes('/meals/generate-image')) {
      const { prompt } = await request.json()
      
      if (!prompt) {
        return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
      }

      try {
        const imageUrl = await generateMealImage(prompt)
        return NextResponse.json({ imageUrl })
      } catch (error) {
        console.error('Image generation error:', error)
        return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
      }
    }

    // Check-in with QR
    if (pathname.includes('/checkin')) {
      const user = await authenticate(request)
      if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { qrData } = await request.json()
      
      try {
        const bookingData = JSON.parse(qrData)
        const booking = await database.collection('bookings').findOne({ 
          id: bookingData.bookingId 
        })

        if (!booking) {
          return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 })
        }

        if (booking.status === 'checked_in') {
          return NextResponse.json({ error: 'Already checked in' }, { status: 400 })
        }

        // Update booking status
        await database.collection('bookings').updateOne(
          { id: booking.id },
          { $set: { status: 'checked_in', checkedInAt: new Date() } }
        )

        // Award points for showing up
        await database.collection('users').updateOne(
          { id: booking.userId },
          { $inc: { points: 15 } }
        )

        return NextResponse.json({ success: true, booking })
      } catch (error) {
        return NextResponse.json({ error: 'Invalid QR code format' }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions
function getCurrentWeekStart() {
  const now = new Date()
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
  return startOfWeek.toISOString().split('T')[0]
}

async function getPopularMeals(weekStart) {
  const database = await connectDB()
  const votes = await database.collection('votes').find({ weekStart }).toArray()
  
  const mealCounts = votes.reduce((acc, vote) => {
    acc[vote.optionId] = (acc[vote.optionId] || 0) + 1
    return acc
  }, {})

  const sortedMeals = Object.entries(mealCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  return sortedMeals.map(([optionId, count]) => ({ optionId, votes: count }))
}

// AI functions (mock for now - will integrate properly)
async function generateNutritionAdvice(prompt, sessionId = 'default') {
  // Mock response for now
  return `Based on your query about "${prompt}", here are some nutrition tips: 
  
  🥗 Focus on balanced meals with proteins, healthy carbs, and vegetables
  💧 Stay hydrated throughout the day
  🍎 Include fruits for vitamins and fiber
  
  For personalized advice, consider consulting with our nutrition team!`
}

async function generateMealImage(prompt) {
  // Mock response - returning a placeholder image URL
  return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop&crop=center`
}

// PUT and DELETE methods for completeness
export async function PUT(request) {
  return NextResponse.json({ error: 'Method not implemented' }, { status: 501 })
}

export async function DELETE(request) {
  return NextResponse.json({ error: 'Method not implemented' }, { status: 501 })
}