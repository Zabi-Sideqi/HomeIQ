//api/controllers/auth.controller.js

import bcrypt from 'bcryptjs'
import User from '../models/user.model.js'
import { errorHandler } from '../utils/error.js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import sendEmail from '../utils/sendEmail.js'
import Stripe from 'stripe'
import dotenv from 'dotenv'

dotenv.config()

// Validate Stripe configuration
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY not found in environment variables')
} else {
  console.log('Stripe secret key configured:', process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const signup = async (req, res, next) => {
  try {
    const { email, password, username, paymentMethodId } = req.body

    console.log('Signup request received:', { email, username, paymentMethodId: paymentMethodId ? 'present' : 'missing' })

    // Validate required fields
    if (!email || !password || !paymentMethodId) {
      console.log('Missing required fields:', { email: !!email, password: !!password, paymentMethodId: !!paymentMethodId })
      return next(
        errorHandler(400, 'Email, password, and payment method are required')
      )
    }

    // Validate password length
    if (password.length < 8) {
      return next(
        errorHandler(400, 'Password must be at least 8 characters long')
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return next(errorHandler(409, 'User already exists'))
    }

    // Create Stripe customer and attach payment method
    console.log('Creating Stripe customer for:', email)
    const customer = await stripe.customers.create({
      email,
      name: username || 'User',
      metadata: {
        registrationDate: new Date().toISOString(),
      },
    })
    console.log('Stripe customer created:', customer.id)

    // Attach the payment method to the customer
    console.log('Attaching payment method:', paymentMethodId)
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    })
    console.log('Payment method attached successfully')

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    const hashedPassword = await bcrypt.hash(password, 8)

    // Create new user with Stripe information
    const newUser = new User({
      email,
      password: hashedPassword,
      username: username || 'anonymous',
      avatar: 'https://www.gravatar.com/avatar/?d=mp&f=y',
      stripeCustomerId: customer.id,
      paymentMethodId: paymentMethodId,
    })

    await newUser.save()

    // Remove sensitive information from response
    const {
      password: pass,
      paymentMethodId: pmId,
      ...userResponse
    } = newUser._doc

    res.status(201).json({
      success: true,
      message: 'Account created successfully with payment method',
      user: userResponse,
    })
  } catch (error) {
    console.error('Signup error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack
    })

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0]
      if (field === 'email') {
        return next(errorHandler(409, 'An account with this email already exists'))
      } else if (field === 'username') {
        return next(errorHandler(409, 'This username is already taken. Please choose a different username.'))
      }
      return next(errorHandler(409, 'This information is already in use'))
    }

    // Handle Stripe-specific errors
    if (error.type) {
      switch (error.type) {
        case 'StripeCardError':
          if (error.code === 'card_declined' && error.message.includes('real card while testing')) {
            return next(
              errorHandler(
                400,
                'Please use a test card number. Try: 4242 4242 4242 4242 with any future expiry date and any 3-digit CVC.'
              )
            )
          }
          return next(
            errorHandler(
              400,
              `Card error: ${error.message}`
            )
          )
        case 'StripeInvalidRequestError':
          console.error('Stripe invalid request:', error.message)
          return next(
            errorHandler(400, `Payment error: ${error.message}`)
          )
        default:
          console.error('Other Stripe error:', error.type, error.message)
          return next(
            errorHandler(500, 'Payment processing error. Please try again.')
          )
      }
    }

    next(errorHandler(500, 'Error creating account'))
  }
}

// Signin function
export const signin = async (req, res, next) => {
  const { email, password } = req.body
  try {
    const validUser = await User.findOne({ email })
    if (!validUser) return next(errorHandler(404, 'User not found'))

    const validPassword = bcrypt.compareSync(password, validUser.password)
    if (!validPassword) return next(errorHandler(401, 'Invalid password'))

    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET)
    const { password: pass, ...rest } = validUser._doc

    res.cookie('access_token', token, { httpOnly: true }).status(200).json({
      success: true,
      token,
      user: rest,
    })
  } catch (error) {
    next(error)
  }
}

// Google authentication function
export const google = async (req, res, next) => {
  try {
    console.log('Incoming Google data:', req.body)

    const { email, name, photoURL } = req.body

    // ensure email is provided
    if (!email) {
      return next(errorHandler(400, 'Email is required'))
    }

    const existingUser = await User.findOne({ email })

    // IF the user already exists, generate token and send to frontend
    if (existingUser) {
      const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET)
      const { password: pass, ...rest } = existingUser._doc

      return res
        .cookie('access_token', token, { httpOnly: true })
        .status(200)
        .json({
          success: true,
          token, // important that frontend gets this
          user: rest, // important that frontend gets this
        })
    }

    // IF the user does not exist, create a new user
    const usernameFromName = name
      ? name.split(' ').join('').toLowerCase()
      : 'user' + Math.random().toString(36).slice(-4)

    const generatedPassword =
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(generatedPassword, 8)

    const newUser = new User({
      username: usernameFromName + Math.random().toString(36).slice(-4),
      email,
      password: hashedPassword,
      avatar: photoURL || 'https://www.gravatar.com/avatar/?d=mp&f=y',
    })

    await newUser.save()

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET)
    const { password: pass, ...rest } = newUser._doc

    //  RETURNERA TOKEN & USER till frontend även för nya användare!
    return res
      .cookie('access_token', token, { httpOnly: true })
      .status(200)
      .json({
        success: true,
        token, // ✅ frontend behöver detta för Redux
        user: rest, // ✅ frontend behöver detta för Redux
      })
  } catch (error) {
    console.error('Google auth error:', error)
    next(errorHandler(500, error.message || 'Unknown error in Google auth'))
  }
}

// Sign out function
export const signOut = async (req, res) => {
  try {
    res.clearCookie('access_token', { path: '/' })
    return res.status(200).json({ message: 'User logged out successfully' })
  } catch (error) {
    return res.status(500).json({ message: 'Error logging out' })
  }
}

//create forgot password funtion

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body

    if (!email) {
      return next(errorHandler(400, 'Email is required'))
    }

    const user = await User.findOne({ email })
    if (!user) {
      return next(errorHandler(404, 'User not found'))
    }
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex')

    // Hash the reset token to store securely in the database (resetPasswordToken field)
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')

    // set token and expiation (15 minutes)
    user.resetPasswordToken = hashedToken
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000 // 15 minutes

    await user.save()

    // Create reset URL using the original (unhashed) token
    const frontendUrl =
      process.env.FRONTEND_URL_LOCAL ||
      process.env.FRONTEND_URL ||
      'http://localhost:5173'
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`

    // Send email with reset link
    const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
        <p>Hi ${user.username},</p>
        <p>You requested a password reset for your HomeIQ account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
        <p><strong>This link will expire in 10 minutes.</strong></p>
        <p>If you didn't request this reset, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">HomeIQ Team</p>
      </div>
    `

    // try to send email, but don't fail if it dosn't work
    try {
      await sendEmail({
        to: user.email,
        subject: 'HomeIQ Password Reset',
        html: emailHtml,
      })

      console.log('Email sent successfully to:', user.email)
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError.message)
      // Don't fail the request if email sending fails
    }

    res.status(200).json({
      success: true,
      message:
        'Password reset email sent successfully. Please check your inbox.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)

    // Clear the reset token if email sending fails
    if (req.body.email) {
      const user = await User.findOne({ email: req.body.email })
      if (user) {
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined
        await user.save()
      }
    }

    next(errorHandler(500, 'Email could not be sent'))
  }
}

// Reset password function

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params
    const { password } = req.body

    if (!password) {
      return next(errorHandler(400, 'Password is required'))
    }

    if (password.length < 8) {
      return next(
        errorHandler(400, 'Password must be at least 8 characters long')
      )
    }
    // Hash the token from params
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    // Find user with the hashed token and check if token is not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // Check if token is not expired
    })

    if (!user) {
      return next(errorHandler(400, 'Invalid or expired reset token'))
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 8)

    // Update user's password and clear reset token fields
    user.password = hashedPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined

    await user.save()

    res.status(200).json({
      success: true,
      message:
        'Password has been reset successfully. You can now log in with your new password.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    next(errorHandler(500, 'Error resetting password'))
  }
}

// Create setup intent for card collection during signup
export const createSetupIntent = async (req, res, next) => {
  try {
    const { email } = req.body

    if (!email) {
      return next(errorHandler(400, 'Email is required'))
    }

    // Create setup intent without customer first (simpler approach)
    const setupIntent = await stripe.setupIntents.create({
      usage: 'on_session',
      payment_method_types: ['card'],
      metadata: {
        email,
        purpose: 'registration',
      },
    })

    res.status(200).json({
      success: true,
      clientSecret: setupIntent.client_secret,
    })
  } catch (error) {
    console.error('Setup intent error:', error.message)
    console.error('Full error:', error)
    next(errorHandler(500, `Error creating payment setup: ${error.message}`))
  }
}

// Simple signup without payment requirement (temporary workaround)
export const signupSimple = async (req, res, next) => {
  try {
    const { email, password, username } = req.body

    // Validate required fields
    if (!email || !password) {
      return next(errorHandler(400, 'Email and password are required'))
    }

    // Validate password length
    if (password.length < 8) {
      return next(errorHandler(400, 'Password must be at least 8 characters long'))
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return next(errorHandler(409, 'User already exists'))
    }

    const hashedPassword = await bcrypt.hash(password, 8)

    // Create new user without Stripe information
    const newUser = new User({
      email,
      password: hashedPassword,
      username: username || 'anonymous',
      avatar: 'https://www.gravatar.com/avatar/?d=mp&f=y',
      // Default values for free users
      subscription: 'free',
      listingLimit: 1,
      subscriptionStatus: 'active',
      role: 'user',
    })

    await newUser.save()

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    })

    const { password: _, ...userWithoutPassword } = newUser._doc

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error('Simple signup error:', error)
    next(errorHandler(500, 'Error creating user'))
  }
}

// Test endpoint to check Stripe connectivity
export const testStripe = async (req, res, next) => {
  try {
    console.log('Testing Stripe connection...')
    
    // Try to list some customers (should work even if no customers exist)
    const customers = await stripe.customers.list({ limit: 1 })
    console.log('Stripe connection successful:', customers)
    
    res.json({
      success: true,
      message: 'Stripe connection working',
      data: customers
    })
  } catch (error) {
    console.error('Stripe test error:', error)
    res.status(500).json({
      success: false,
      message: 'Stripe connection failed',
      error: error.message
    })
  }
}
