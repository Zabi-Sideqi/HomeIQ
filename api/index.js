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
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err))

// Middleware
// Hardcode URLs instead of relying on .env right here
const allowedOrigins = [
  'https://homeiq-client.onrender.com',
  'http://localhost:5174',
  'http://localhost:5173',
]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        console.error(`CORS policy violation: Origin ${origin} not allowed`)
        callback(new Error('CORS policy violation: Origin not allowed'))
      }
    },
    credentials: true, // Allow cookies to be sent
  })
)

app.use(express.json())
app.use(cookieParser())

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
