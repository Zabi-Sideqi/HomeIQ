//client/src/pages/SetupPayment.jsx

import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { signInSuccess } from '../redux/user/userSlice'
import { apiUrl } from '../utils/api'

// Load Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here'
)

const SetupPaymentForm = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [setupIntentSecret, setSetupIntentSecret] = useState(null)

  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()

  // Get user data from navigation state
  const { user, token, isOAuthUser } = location.state || {}

  const createSetupIntent = useCallback(async () => {
    try {
      const response = await fetch(apiUrl('/api/auth/setup-intent'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      })

      const data = await response.json()
      if (data.success) {
        setSetupIntentSecret(data.clientSecret)
      } else {
        setError('Error setting up payment. Please try again.')
      }
    } catch (error) {
      console.error('Setup intent error:', error)
      setError('Error setting up payment. Please try again.')
    }
  }, [user?.email])

  useEffect(() => {
    if (!user || !token) {
      navigate('/sign-up')
      return
    }

    // Create setup intent for this user
    createSetupIntent()
  }, [user, token, navigate, createSetupIntent])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!stripe || !elements) {
      setError('Payment system not loaded. Please refresh and try again.')
      setLoading(false)
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError('Please enter your card information')
      setLoading(false)
      return
    }

    try {
      // Confirm setup intent with card
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        setupIntentSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user.username,
              email: user.email,
            },
          },
        }
      )

      if (stripeError) {
        setError(stripeError.message)
        setLoading(false)
        return
      }

      // Update user with payment method
      const response = await fetch(apiUrl('/api/payment/customer'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentMethodId: setupIntent.payment_method,
        }),
      })

      const data = await response.json()

      if (data.success === false) {
        setError(data.message)
        setLoading(false)
        return
      }

      // Update Redux store with complete user data
      dispatch(
        signInSuccess({
          user: { ...user, stripeCustomerId: data.customerId },
          token,
        })
      )

      setLoading(false)
      toast.success('Payment method added successfully!')
      setTimeout(() => navigate('/'), 1500)
    } catch (error) {
      console.error('Payment setup error:', error)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#374151',
        '::placeholder': {
          color: '#9CA3AF',
        },
      },
      invalid: {
        color: '#EF4444',
      },
    },
    hidePostalCode: false,
  }

  if (!user || !token) {
    return null
  }

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <ToastContainer />

      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <h2 className='mt-6 text-3xl font-extrabold text-gray-900'>
            Complete Your Account Setup
          </h2>
          <p className='mt-2 text-sm text-gray-600'>
            Welcome{isOAuthUser ? ' back' : ''}, {user.username}! Add a payment
            method to start using all features.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='mt-8 space-y-6'>
          <div className='bg-white shadow rounded-lg p-6'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>
              Payment Information
            </h3>
            <p className='text-sm text-gray-600 mb-4'>
              We require a payment method to prevent spam accounts. You won't be
              charged during setup.
            </p>

            <div className='border border-gray-300 rounded-lg p-4 bg-gray-50'>
              <CardElement options={cardElementOptions} />
            </div>

            <div className='mt-3 flex items-center text-xs text-gray-500'>
              <svg
                className='h-4 w-4 mr-1'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                />
              </svg>
              Secured by Stripe. Your card information is encrypted and secure.
            </div>
          </div>

          <button
            type='submit'
            disabled={loading || !stripe}
            className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
          >
            {loading ? 'Setting up payment...' : 'Complete Setup'}
          </button>

          {error && (
            <div className='mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
              {error}
            </div>
          )}
        </form>

        {/* Benefits Section */}
        <div className='mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <h4 className='font-medium text-blue-900 mb-2'>What you get:</h4>
          <ul className='text-sm text-blue-700 space-y-1'>
            <li>• 1 free property listing</li>
            <li>• Access to all basic features</li>
            <li>• Secure payment processing</li>
            <li>• Easy upgrades when you need more</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

const SetupPayment = () => {
  return (
    <Elements stripe={stripePromise}>
      <SetupPaymentForm />
    </Elements>
  )
}

export default SetupPayment
