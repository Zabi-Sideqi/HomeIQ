// api/index.js
import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import userRoute from './routes/user.route.js'
import authRoute from './routes/auth.route.js'
import listingRoute from './routes/listing.route.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app = express()
dotenv.config()

// Anslut till MongoDB
mongoose
  .connect(process.env.Mongo)
  .then(() => {
    console.log('MongoDB connected successfully!')
    console.log('Database URL:', process.env.Mongo?.substring(0, 20) + '...')
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err)
    process.exit(1) // Exit if database connection fails
  })

// Middleware
// More permissive CORS configuration for debugging
const allowedOrigins = [
  'https://homeiq-client.onrender.com',
  'http://localhost:5174',
  'http://localhost:5173',
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        console.error(`CORS policy violation: Origin ${origin} not allowed`)
        console.log('Allowed origins:', allowedOrigins)
        // For debugging, allow all origins temporarily
        callback(null, true)
      }
    },
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
)

// Add a simple health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  })
})

// Add a simple test route
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
  })
})

// Add a database health check route
app.get('/api/health/db', async (req, res) => {
  try {
    const state = mongoose.connection.readyState
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    }

    res.status(200).json({
      success: true,
      database: states[state],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
})

app.use(express.json())
app.use(cookieParser())

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  console.log('Origin:', req.get('origin'))
  next()
})

// Routes
app.use('/api/user', userRoute)
app.use('/api/auth', authRoute)
app.use('/api/listing', listingRoute)

// Global error handler (MÅSTE ligga efter routes)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  })
})

// Start server (lägg sist!)
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
