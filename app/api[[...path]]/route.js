import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import QRCode from 'qrcode'

// IMPORTANT: Ensure MONGO_URL, DB_NAME, and NEXTAUTH_SECRET are set in your .env file
const client = new MongoClient(process.env.MONGO_URL)
let db

async function connectDB() {
  if (!db) {
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

// Auth middleware: Verifies JWT and fetches user object
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
    console.error("JWT Authentication Error:", error)
    return null
  }
}

// Helper functions
function getCurrentDateString() {
    const now = new Date();
    // Format: YYYY-MM-DD
    return now.toISOString().split('T')[0];
}

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

// === AI IMPLEMENTATION START ===

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${process.env.EMERGENT_LLM_KEY || ''}`;

/**
 * Generates nutrition advice using the Gemini API with Google Search grounding.
 * @param {string} prompt The user's query.
 */
async function generateNutritionAdvice(prompt) {
    const systemPrompt = "Act as a friendly, expert university nutritionist specializing in balanced student diets. Provide practical advice tailored to the user's query. Ensure the response is concise and easy to understand.";

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        // Enable Google Search for up-to-date and grounded information
        tools: [{ "google_search": {} }], 
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    };

    let response;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
        try {
            response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const result = await response.json();
                const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    return text;
                } else {
                    throw new Error('Empty response from LLM.');
                }
            } else {
                // If 429 (Too Many Requests), trigger retry logic
                if (response.status === 429 && retries < maxRetries - 1) {
                    const delay = Math.pow(2, retries) * 1000; // Exponential backoff (1s, 2s, 4s)
                    await new Promise(resolve => setTimeout(resolve, delay));
                    retries++;
                    continue; // Skip the rest of the loop and retry
                }
                throw new Error(`LLM API failed with status ${response.status}`);
            }
        } catch (error) {
            console.error(`Attempt ${retries + 1} failed:`, error);
            retries++;
        }
    }
    
    // Fallback response after maximum retries
    return "I am currently unable to provide personalized nutrition advice. Please check your network connection or try again later.";
}

/**
 * Generates a meal image URL (currently returns a mock placeholder).
 * @param {string} prompt The user's image prompt.
 */
async function generateMealImage(prompt) {
  // NOTE: Image generation requires a different model (e.g., Imagen) and setup.
  // For now, we return a dynamic placeholder URL that references the user's prompt
  const encodedPrompt = encodeURIComponent(prompt.substring(0, 30)); 
  return `https://placehold.co/400x400/364E7C/FFFFFF?text=${encodedPrompt}&font=inter`;
}
// === AI IMPLEMENTATION END ===


// Helper to map DB booking data to the frontend's expected meal card format
function mapBookingToFrontend(booking) {
  // NOTE: This assumes default meal details for simplicity until menu data integration
  const isAttended = booking.status === 'checked_in';
  const isCancelled = booking.status === 'cancelled';
  const isBooked = booking.status !== 'cancelled';
  const mealName = booking.selectedOptions?.main || "Menu Item TBD";
  
  // Hardcoded times for display uniformity in the dashboard
  const mealTimes = {
    breakfast: '7:00 - 10:00 AM',
    lunch: '12:00 - 3:00 PM',
    snacks: '4:00 - 6:00 PM',
    dinner: '7:00 - 10:00 PM',
  };

  return {
    id: booking.id,
    type: booking.mealType,
    time: mealTimes[booking.mealType] || 'TBD',
    meal: mealName,
    calories: booking.calories || 450, // Placeholder
    booked: isBooked, // True unless status is explicitly 'cancelled'
    attended: isAttended,
    status: booking.status, // 'upcoming', 'checked_in', or 'cancelled'
    wasteRated: booking.wasteRated || false,
  };
}


// === GET REQUESTS ===
export async function GET(request) {
  const { pathname, searchParams } = new URL(request.url)
  const database = await connectDB()

  try {
    // Auth check - UPDATED to include gamification metrics
    if (pathname.includes('/auth/me')) {
      const user = await authenticate(request)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.json({ 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role,
          // NEW: Include fields needed for the dashboard stats cards
          points: user.points || 0,
          level: user.level || 1,
          streak: user.streak || 0,
          // NOTE: Dashboard needs additional fields like totalBookings, etc., which need to be derived or stored in the DB
        } 
      })
    }

    // Get weekly menu with voting (unchanged)
    if (pathname.includes('/menu/weekly')) {
      const weekStart = searchParams.get('week') || getCurrentWeekStart()
      
      const menu = await database.collection('weekly_menus').findOne({ weekStart })
      if (!menu) {
        return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
      }

      const mealOptions = await database.collection('meal_options').find({ weeklyMenuId: menu.id }).toArray()
      const votes = await database.collection('votes').find({ weeklyMenuId: menu.id }).toArray()
      
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

    // Get dishes (omitted)
    // ...

    // Get user bookings - UPDATED to filter for TODAY and map to frontend format
    if (pathname.includes('/bookings/user')) {
      const user = await authenticate(request)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const date = searchParams.get('date') || getCurrentDateString()
      
      // Fetch bookings for the current day only (or future, depending on frontend needs)
      const rawBookings = await database.collection('bookings').find({ 
        userId: user.id, 
        date: date
      }).toArray()
      
      // Map raw DB objects to frontend meal cards
      const mappedBookings = rawBookings.map(mapBookingToFrontend);

      return NextResponse.json({ bookings: mappedBookings })
    }
    
    // Get nutrition advice (LIVE AI ENDPOINT)
    if (pathname.includes('/nutrition/advice')) {
      const prompt = searchParams.get('prompt')
      if (!prompt) {
        return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
      }
      try {
        const advice = await generateNutritionAdvice(prompt)
        // Note: We currently don't use sessions, so the response is just the advice text
        return NextResponse.json({ advice })
      } catch (error) {
        return NextResponse.json({ error: 'Failed to generate advice' }, { status: 500 })
      }
    }

    // Get admin analytics (omitted)
    // ...

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// === POST REQUESTS ===
export async function POST(request) {
  const { pathname } = new URL(request.url)
  const database = await connectDB()

  try {
    // ----------------------------------------------------------------
    // 1. MEAL CANCELLATION (unchanged)
    // ----------------------------------------------------------------
    if (pathname.includes('/bookings/cancel')) {
      const user = await authenticate(request)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { bookingId } = await request.json()
      
      if (!bookingId) {
        return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
      }
      
      const booking = await database.collection('bookings').findOne({ id: bookingId, userId: user.id })

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }
      
      if (booking.status === 'checked_in' || booking.status === 'cancelled') {
        return NextResponse.json({ error: `Cannot cancel a meal that is ${booking.status}.` }, { status: 400 })
      }
      
      // Update booking status
      const updateResult = await database.collection('bookings').updateOne(
        { id: bookingId },
        { 
          $set: { 
            status: 'cancelled', 
            booked: false, // Ensure booked flag is clear if frontend uses it
            cancelledAt: new Date() 
          } 
        }
      )

      // Deduct points for cancellation
      await database.collection('users').updateOne(
        { id: user.id },
        { $inc: { points: -5 } } // Deduct 5 points
      )

      if (updateResult.modifiedCount === 1) {
        return NextResponse.json({ success: true, message: 'Booking cancelled. 5 points deducted.' })
      } else {
        return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
      }
    }


    // ----------------------------------------------------------------
    // 2. WASTE RATING SUBMISSION (unchanged)
    // ----------------------------------------------------------------
    if (pathname.includes('/meal/waste-rating')) {
      const user = await authenticate(request)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { bookingId, wasteRating } = await request.json()
      
      if (!bookingId || !wasteRating || wasteRating < 1 || wasteRating > 5) {
        return NextResponse.json({ error: 'Invalid data provided (requires bookingId and rating 1-5)' }, { status: 400 })
      }

      // 1. Find the booking and validate
      const booking = await database.collection('bookings').findOne({ id: bookingId, userId: user.id })

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }
      
      // Validation: Must be checked in and not yet rated
      if (booking.wasteRated || booking.status !== 'checked_in') {
        return NextResponse.json({ error: 'Meal cannot be rated for waste (already rated or not attended)' }, { status: 400 })
      }
      
      // 2. Update booking with waste rating
      const updateResult = await database.collection('bookings').updateOne(
        { id: bookingId },
        { 
          $set: { 
            wasteRating: wasteRating, 
            wasteRated: true, 
            ratedAt: new Date() 
          } 
        }
      )

      // Award points for submitting waste data
      await database.collection('users').updateOne(
        { id: user.id },
        { $inc: { points: 2 } }
      )

      if (updateResult.modifiedCount === 1) {
        return NextResponse.json({ success: true, message: 'Waste rating recorded successfully. +2 points awarded.' })
      } else {
        return NextResponse.json({ error: 'Failed to record waste rating' }, { status: 500 })
      }
    }
    
    // ----------------------------------------------------------------
    // 3. IMAGE GENERATION (NEW ENDPOINT)
    // ----------------------------------------------------------------
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


    // ----------------------------------------------------------------
    // 4. CHECK-IN (QR SCANNING ACTION) (unchanged)
    // ----------------------------------------------------------------
    if (pathname.includes('/checkin')) {
      const user = await authenticate(request)
      // Check for staff or admin role
      if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
        return NextResponse.json({ error: 'Unauthorized. Staff/Admin required for check-in.' }, { status: 401 })
      }

      const { qrData } = await request.json()
      
      if (!qrData) {
        return NextResponse.json({ error: 'QR data is missing' }, { status: 400 })
      }

      try {
        const bookingData = JSON.parse(qrData)
        const bookingId = bookingData.bookingId;
        
        if (!bookingId) {
            return NextResponse.json({ error: 'Invalid QR code payload.' }, { status: 400 });
        }

        const booking = await database.collection('bookings').findOne({ 
          id: bookingId,
          date: bookingData.date, // Verify date matches today/expected check-in day
          mealType: bookingData.mealType // Verify meal type
        })

        if (!booking) {
          return NextResponse.json({ error: 'Invalid or expired booking QR code' }, { status: 400 })
        }

        if (booking.status === 'checked_in') {
          return NextResponse.json({ error: 'Already checked in' }, { status: 400 })
        }
        
        if (booking.status === 'cancelled') {
             return NextResponse.json({ error: 'Booking was previously cancelled' }, { status: 400 })
        }


        // Update booking status
        await database.collection('bookings').updateOne(
          { id: booking.id },
          { $set: { status: 'checked_in', checkedInAt: new Date() } }
        )

        // Award points for showing up (to the student who booked)
        await database.collection('users').updateOne(
          { id: booking.userId },
          { $inc: { points: 15 } }
        )

        return NextResponse.json({ 
            success: true, 
            message: `Check-in successful for ${booking.mealType}.`,
            booking 
        })
      } catch (error) {
        // This catches JSON parse errors for invalid QR data structure
        return NextResponse.json({ error: 'Invalid QR code format' }, { status: 400 })
      }
    }

    // ----------------------------------------------------------------
    // Existing Handlers (Auth, Voting, Booking Creation) (unchanged)
    // ----------------------------------------------------------------

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
    if (pathname.includes('/bookings') && !pathname.includes('/bookings/cancel')) {
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
        status: 'upcoming', // Set initial status as upcoming
        wasteRated: false, 
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

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT and DELETE methods for completeness
export async function PUT(request) {
  return NextResponse.json({ error: 'Method not implemented' }, { status: 501 })
}

export async function DELETE(request) {
  return NextResponse.json({ error: 'Method not implemented' }, { status: 501 })
}