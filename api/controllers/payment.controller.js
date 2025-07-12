//api/controllers/payment.controller.js

import Stripe from 'stripe'
import User from '../models/user.model.js'
import Payment from '../models/payment.model.js'
import Listing from '../models/listing.model.js'
import { errorHandler } from '../utils/error.js'
import dotenv from 'dotenv'

dotenv.config()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Platform fee percentage (e.g., 5%)
const PLATFORM_FEE_PERCENTAGE = 0.05

// Pricing configuration
const PRICING = {
  additional_listing: 500, // $5.00 per additional listing in cents
  premium_monthly: 1999, // $19.99 per month in cents
  pro_monthly: 4999, // $49.99 per month in cents
}

// Create or get Stripe customer
export const createStripeCustomer = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return next(errorHandler(404, 'User not found'))
    }

    // Check if user already has a Stripe customer ID
    if (user.stripeCustomerId) {
      return res.status(200).json({
        success: true,
        customerId: user.stripeCustomerId,
      })
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.username,
      metadata: {
        userId: user._id.toString(),
      },
    })

    // Save customer ID to user
    user.stripeCustomerId = customer.id
    await user.save()

    res.status(200).json({
      success: true,
      customerId: customer.id,
    })
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    next(errorHandler(500, 'Error creating payment customer'))
  }
}

// Create payment intent for additional listings
export const createListingPaymentIntent = async (req, res, next) => {
  try {
    const { additionalListings = 1 } = req.body
    const user = await User.findById(req.user.id)

    if (!user) {
      return next(errorHandler(404, 'User not found'))
    }

    // Ensure user has Stripe customer ID
    if (!user.stripeCustomerId) {
      return next(errorHandler(400, 'Please set up payment method first'))
    }

    const amount = PRICING.additional_listing * additionalListings
    const platformFee = Math.round(amount * PLATFORM_FEE_PERCENTAGE)
    const serviceProviderAmount = amount - platformFee

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: user.stripeCustomerId,
      metadata: {
        userId: user._id.toString(),
        type: 'additional_listings',
        quantity: additionalListings.toString(),
      },
      description: `Additional listing(s) - ${additionalListings} listing(s)`,
    })

    // Save payment record
    const payment = new Payment({
      userId: user._id,
      stripePaymentIntentId: paymentIntent.id,
      amount,
      status: 'pending',
      paymentType: 'listing_fee',
      description: `Payment for ${additionalListings} additional listing(s)`,
      platformFee,
      serviceProviderAmount,
      metadata: {
        additionalListings,
      },
    })

    await payment.save()

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount,
      additionalListings,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    next(errorHandler(500, 'Error creating payment'))
  }
}

// Create subscription payment intent
export const createSubscriptionPaymentIntent = async (req, res, next) => {
  try {
    const { subscriptionType } = req.body // 'premium' or 'pro'
    const user = await User.findById(req.user.id)

    if (!user) {
      return next(errorHandler(404, 'User not found'))
    }

    if (!user.stripeCustomerId) {
      return next(errorHandler(400, 'Please set up payment method first'))
    }

    if (!['premium', 'pro'].includes(subscriptionType)) {
      return next(errorHandler(400, 'Invalid subscription type'))
    }

    const amount = PRICING[`${subscriptionType}_monthly`]
    const platformFee = Math.round(amount * PLATFORM_FEE_PERCENTAGE)
    const serviceProviderAmount = amount - platformFee

    // Create payment intent for subscription
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: user.stripeCustomerId,
      metadata: {
        userId: user._id.toString(),
        type: 'subscription',
        subscriptionType,
      },
      description: `${
        subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1)
      } subscription - Monthly`,
    })

    // Save payment record
    const payment = new Payment({
      userId: user._id,
      stripePaymentIntentId: paymentIntent.id,
      amount,
      status: 'pending',
      paymentType: 'subscription',
      description: `${
        subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1)
      } subscription payment`,
      platformFee,
      serviceProviderAmount,
      metadata: {
        subscriptionType,
      },
    })

    await payment.save()

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount,
      subscriptionType,
    })
  } catch (error) {
    console.error('Error creating subscription payment:', error)
    next(errorHandler(500, 'Error creating subscription payment'))
  }
}

// Handle successful payment webhook
export const handlePaymentSuccess = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body

    // Find payment record
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId,
    })
    if (!payment) {
      return next(errorHandler(404, 'Payment record not found'))
    }

    // Update payment status
    payment.status = 'succeeded'
    await payment.save()

    // Update user based on payment type
    const user = await User.findById(payment.userId)
    if (!user) {
      return next(errorHandler(404, 'User not found'))
    }

    if (payment.paymentType === 'listing_fee') {
      // Increase listing limit
      const additionalListings = payment.metadata.additionalListings
      user.listingLimit += additionalListings
      await user.save()
    } else if (payment.paymentType === 'subscription') {
      // Update subscription
      const subscriptionType = payment.metadata.subscriptionType
      user.subscription = subscriptionType
      user.subscriptionStatus = 'active'

      // Set subscription end date (1 month from now)
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1)
      user.subscriptionEndDate = endDate

      // Update listing limits based on subscription
      if (subscriptionType === 'premium') {
        user.listingLimit = 10 // Premium gets 10 listings
      } else if (subscriptionType === 'pro') {
        user.listingLimit = 50 // Pro gets 50 listings
      }

      await user.save()
    }

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
    })
  } catch (error) {
    console.error('Error handling payment success:', error)
    next(errorHandler(500, 'Error processing payment'))
  }
}

// Get user's payment history
export const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)

    res.status(200).json({
      success: true,
      payments,
    })
  } catch (error) {
    console.error('Error fetching payment history:', error)
    next(errorHandler(500, 'Error fetching payment history'))
  }
}

// Get pricing information
export const getPricing = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      pricing: {
        additional_listing: {
          amount: PRICING.additional_listing,
          currency: 'usd',
          description: 'Additional listing fee',
        },
        premium_monthly: {
          amount: PRICING.premium_monthly,
          currency: 'usd',
          description: 'Premium subscription - 10 listings',
          features: ['10 listings', 'Priority support', 'Advanced analytics'],
        },
        pro_monthly: {
          amount: PRICING.pro_monthly,
          currency: 'usd',
          description: 'Pro subscription - 50 listings',
          features: [
            '50 listings',
            'Priority support',
            'Advanced analytics',
            'Custom branding',
          ],
        },
      },
      platformFee: PLATFORM_FEE_PERCENTAGE * 100, // Return as percentage
    })
  } catch (error) {
    next(errorHandler(500, 'Error fetching pricing'))
  }
}

// Check if user can create listing
export const checkListingEligibility = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return next(errorHandler(404, 'User not found'))
    }

    // Count user's current listings
    const currentListings = await Listing.countDocuments({ userRef: user._id })

    const canCreate = currentListings < user.listingLimit
    const remainingListings = Math.max(0, user.listingLimit - currentListings)

    res.status(200).json({
      success: true,
      canCreate,
      currentListings,
      listingLimit: user.listingLimit,
      remainingListings,
      subscription: user.subscription,
      subscriptionStatus: user.subscriptionStatus,
    })
  } catch (error) {
    console.error('Error checking listing eligibility:', error)
    next(errorHandler(500, 'Error checking listing eligibility'))
  }
}

export default {
  createStripeCustomer,
  createListingPaymentIntent,
  createSubscriptionPaymentIntent,
  handlePaymentSuccess,
  getPaymentHistory,
  getPricing,
  checkListingEligibility,
}
