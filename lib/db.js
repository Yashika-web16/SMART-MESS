// lib/db.js
import { MongoClient } from 'mongodb'

const uri = process.env.MONGO_URL
const options = {}

// ✅ Validate MongoDB connection string
if (!uri) {
  throw new Error('❌ Please define the MONGO_URL environment variable inside your .env file')
}

// Global cache (prevents hot reload connection spam in Next.js dev)
let client
let clientPromise

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect().catch((err) => {
      console.error('MongoDB connection error:', err)
      throw err
    })
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect().catch((err) => {
    console.error('MongoDB connection error:', err)
    throw err
  })
}

// ✅ Export a promise that resolves to the connected client
export default clientPromise
