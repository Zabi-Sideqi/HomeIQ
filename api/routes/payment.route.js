//api/routes/payment.route.js

import express from 'express'
import { verifyToken } from '../utils/verifyUser.js'
import {
  createStripeCustomer,
  createListingPaymentIntent,
  createSubscriptionPaymentIntent,
  handlePaymentSuccess,
  getPaymentHistory,
  getPricing,
  checkListingEligibility,
} from '../controllers/payment.controller.js'

const router = express.Router()

// Public routes
router.get('/pricing', getPricing)

// Protected routes (require authentication)
router.use(verifyToken)

// Customer management
router.post('/customer', createStripeCustomer)

// Payment intents
router.post('/intent/listing', createListingPaymentIntent)
router.post('/intent/subscription', createSubscriptionPaymentIntent)

// Payment processing
router.post('/success', handlePaymentSuccess)

// User payment data
router.get('/history', getPaymentHistory)
router.get('/check-eligibility', checkListingEligibility)

export default router
