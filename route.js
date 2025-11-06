import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

/* ===============================
   DATABASE CONNECTION
   =============================== */
const client = new MongoClient(process.env.MONGO_URL)
let db

async function connectDB() {
  if (!db) {
    await client.connect()
    db = client.db(process.env.DB_NAME || 'smart_mess')
  }
  return db
}

/* ===============================
   HELPERS
   =============================== */
function generateToken(userId) {
  return jwt.sign({ userId }, process.env.NEXTAUTH_SECRET, { expiresIn: '7d' })
}

async function authenticate(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  try {
    const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET)
    const database = await connectDB()
    const user = await database.collection('users').findOne({ id: payload.userId })
    return user
  } catch {
    return null
  }
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}

/* ===============================
   GEMINI AI HELPERS
   =============================== */
async function generateNutritionAdvice(prompt) {
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.EMERGENT_LLM_KEY}`
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: {
      parts: [{ text: "Act as a helpful nutrition expert for college students. Provide concise, healthy diet tips." }],
    },
  }

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`Gemini API failed: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No advice generated.'
}

function generateImageURL(prompt) {
  const encoded = encodeURIComponent(prompt.slice(0, 30))
  return `https://placehold.co/400x400/374151/FFFFFF?text=${encoded}`
}

/* ===============================
   POST HANDLER
   =============================== */
export async function POST(request) {
  const { pathname } = new URL(request.url)
  const database = await connectDB()

  try {
    /* ---------------------------------
       🔹 REGISTER
       --------------------------------- */
    if (pathname.includes('/auth/register')) {
      const { name, email, password, role = 'student' } = await request.json()
      if (!name || !email || !password)
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

      const exists = await database.collection('users').findOne({ email })
      if (exists) return NextResponse.json({ error: 'User already exists' }, { status: 400 })

      const hashed = await bcrypt.hash(password, 12)
      const id = uuidv4()

      const newUser = {
        id,
        name,
        email,
        password: hashed,
        role,
        createdAt: new Date(),
        points: 0,
        level: 1,
        streak: 0,
      }

      await database.collection('users').insertOne(newUser)
      const token = generateToken(id)

      return NextResponse.json({ user: { id, name, email, role }, token })
    }

    /* ---------------------------------
       🔹 LOGIN
       --------------------------------- */
    if (pathname.includes('/auth/login')) {
      const { email, password } = await request.json()
      if (!email || !password)
        return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })

      const user = await database.collection('users').findOne({ email })
      if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

      const match = await bcrypt.compare(password, user.password)
      if (!match) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

      const token = generateToken(user.id)
      return NextResponse.json({ user: { id: user.id, name: user.name, email, role: user.role }, token })
    }

    /* ---------------------------------
       🔹 CREATE BOOKING
       --------------------------------- */
    if (pathname.includes('/bookings')) {
      const user = await authenticate(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const { date, mealType } = await request.json()
      if (!date || !mealType)
        return NextResponse.json({ error: 'Missing booking data' }, { status: 400 })

      const id = uuidv4()
      await database.collection('bookings').insertOne({
        id,
        userId: user.id,
        date,
        mealType,
        status: 'upcoming',
        wasteRated: false,
        createdAt: new Date(),
      })

      return NextResponse.json({ success: true, message: 'Meal booked successfully' })
    }

    /* ---------------------------------
       🔹 CANCEL BOOKING
       --------------------------------- */
    if (pathname.includes('/bookings/cancel')) {
      const user = await authenticate(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const { bookingId } = await request.json()
      const booking = await database.collection('bookings').findOne({ id: bookingId, userId: user.id })

      if (!booking)
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

      await database.collection('bookings').updateOne(
        { id: bookingId },
        { $set: { status: 'cancelled' } }
      )

      return NextResponse.json({ success: true, message: 'Booking cancelled successfully' })
    }

    /* ---------------------------------
       🔹 WASTE RATING
       --------------------------------- */
    if (pathname.includes('/meal/waste-rating')) {
      const user = await authenticate(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const { bookingId, wasteRating } = await request.json()
      if (!bookingId || wasteRating < 1 || wasteRating > 5)
        return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

      await database.collection('bookings').updateOne(
        { id: bookingId, userId: user.id },
        { $set: { wasteRated: true, wasteRating } }
      )
      await database.collection('users').updateOne({ id: user.id }, { $inc: { points: 2 } })

      return NextResponse.json({ success: true, message: 'Waste rating recorded' })
    }

    /* ---------------------------------
       🔹 CHECK-IN (STAFF / ADMIN)
       --------------------------------- */
    if (pathname.includes('/checkin')) {
      const user = await authenticate(request)
      if (!user || (user.role !== 'staff' && user.role !== 'admin'))
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const { qrData } = await request.json()
      const payload = typeof qrData === 'string' ? JSON.parse(qrData) : qrData

      const booking = await database.collection('bookings').findOne({ id: payload.bookingId })
      if (!booking)
        return NextResponse.json({ error: 'Invalid or expired booking QR' }, { status: 400 })

      await database.collection('bookings').updateOne({ id: payload.bookingId }, { $set: { status: 'checked_in' } })
      await database.collection('users').updateOne({ id: booking.userId }, { $inc: { points: 15 } })

      return NextResponse.json({ success: true, message: 'Check-in successful', booking })
    }

    /* ---------------------------------
       🔹 CAST VOTE
       --------------------------------- */
    if (pathname.includes('/vote')) {
      const user = await authenticate(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const { weekStart, day, mealType, category, optionId } = await request.json()
      if (!weekStart || !day || !mealType || !category || !optionId)
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

      const existingVote = await database.collection('votes').findOne({
        userId: user.id, weekStart, day, mealType, category,
      })

      if (existingVote) {
        await database.collection('votes').updateOne(
          { _id: existingVote._id },
          { $set: { optionId, updatedAt: new Date() } }
        )
      } else {
        await database.collection('votes').insertOne({
          userId: user.id,
          weekStart,
          day,
          mealType,
          category,
          optionId,
          createdAt: new Date(),
        })
      }

      // Increment vote count
      await database.collection('weekly_menus').updateOne(
        { weekStart },
        { $inc: { [`options.${mealType}.${category}.$[opt].votes`]: 1 } },
        { arrayFilters: [{ 'opt.id': optionId }] }
      )

      return NextResponse.json({ success: true, message: 'Vote recorded successfully' })
    }

    /* ---------------------------------
       🔹 AI IMAGE GENERATION
       --------------------------------- */
    if (pathname.includes('/meals/generate-image')) {
      const user = await authenticate(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const { prompt } = await request.json()
      if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 })

      const imageUrl = generateImageURL(prompt)
      return NextResponse.json({ imageUrl })
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 })
  } catch (error) {
    console.error('POST Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/* ===============================
   GET HANDLER
   =============================== */
export async function GET(request) {
  const { pathname, searchParams } = new URL(request.url)
  const database = await connectDB()

  try {
    /* ---------------------------------
       🔹 AUTH ME
       --------------------------------- */
    if (pathname.includes('/auth/me')) {
      const user = await authenticate(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          points: user.points || 0,
          level: user.level || 1,
          streak: user.streak || 0,
        },
      })
    }

    /* ---------------------------------
       🔹 HEALTH CHECK
       --------------------------------- */
    if (pathname.includes('/health'))
      return NextResponse.json({ status: 'ok', message: 'Backend is healthy ✅' })

    /* ---------------------------------
       🔹 USER BOOKINGS
       --------------------------------- */
    if (pathname.includes('/bookings/user')) {
      const user = await authenticate(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const date = searchParams.get('date') || getToday()
      const bookings = await database.collection('bookings').find({ userId: user.id, date }).toArray()
      return NextResponse.json({ bookings })
    }

    /* ---------------------------------
       🔹 WEEKLY MENU
       --------------------------------- */
    if (pathname.includes('/menu/weekly')) {
      const user = await authenticate(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const weekStart = searchParams.get('week')
      const existing = await database.collection('weekly_menus').findOne({ weekStart })

      if (!existing) {
        const defaultMenu = {
          id: uuidv4(),
          weekStart,
          createdAt: new Date(),
          options: {
            breakfast: {
              main: [
                { id: 'poha', name: 'Poha', description: 'Flattened rice', votes: 0 },
                { id: 'upma', name: 'Upma', description: 'Semolina with spices', votes: 0 },
              ],
            },
            lunch: {
              main: [
                { id: 'dal-rice', name: 'Dal Rice', description: 'Lentils with rice', votes: 0 },
                { id: 'rajma', name: 'Rajma Chawal', description: 'Kidney beans with rice', votes: 0 },
              ],
            },
          },
        }
        await database.collection('weekly_menus').insertOne(defaultMenu)
        return NextResponse.json({ menu: defaultMenu })
      }

      return NextResponse.json({ menu: existing })
    }

    /* ---------------------------------
       🔹 FETCH USER VOTES
       --------------------------------- */
    if (pathname.includes('/votes')) {
      const user = await authenticate(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const weekStart = searchParams.get('week')
      const votes = await database.collection('votes').find({ userId: user.id, weekStart }).toArray()
      const voteMap = votes.reduce((acc, v) => {
        acc[`${v.day}-${v.mealType}-${v.category}`] = v.optionId
        return acc
      }, {})
      return NextResponse.json({ votes: voteMap })
    }

    /* ---------------------------------
       🔹 AI NUTRITION ADVICE
       --------------------------------- */
    if (pathname.includes('/nutrition/advice')) {
      const user = await authenticate(request)
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const prompt = searchParams.get('prompt')
      if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 })

      const advice = await generateNutritionAdvice(prompt)
      return NextResponse.json({ advice })
    }

    /* ---------------------------------
       🔹 ADMIN ANALYTICS
       --------------------------------- */
    if (pathname.includes('/admin/analytics')) {
      const user = await authenticate(request)
      if (!user || user.role !== 'admin')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const usersCount = await database.collection('users').countDocuments()
      const bookingsCount = await database.collection('bookings').countDocuments()

      return NextResponse.json({
        analytics: {
          totalUsers: usersCount,
          totalBookings: bookingsCount,
          avgWasteRating: 2.1,
          cancellationRate: '3.8%',
        },
      })
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 })
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
