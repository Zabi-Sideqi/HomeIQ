//client/src/pages/Payment.jsx

import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
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

const PaymentForm = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [paymentIntent, setPaymentIntent] = useState(null)
  const [pricing, setPricing] = useState(null)

  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()
  const { currentUser, token } = useSelector((state) => state.user)

  // Get payment details from navigation state
  const { type, subscriptionType } = location.state || {}

  const createPaymentIntent = useCallback(
    async (planType) => {
      try {
        console.log(
          'Creating payment intent for planType:',
          planType,
          'type:',
          type
        )
        const endpoint =
          type === 'subscription'
            ? '/api/payment/intent/subscription'
            : '/api/payment/intent/listing'

        const body =
          type === 'subscription'
            ? { subscriptionType: planType }
            : { additionalListings: 1 }

        console.log('Payment intent request:', { endpoint, body })

        const response = await fetch(apiUrl(endpoint), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(body),
        })

        const data = await response.json()
        console.log('Payment intent response:', data)
        if (data.success) {
          setPaymentIntent(data)
        } else {
          console.error('Payment intent creation failed:', data)
          if (data.message === 'Please set up payment method first') {
            // Redirect to setup payment page
            toast.error('You need to add a payment method first')
            setTimeout(() => {
              navigate('/setup-payment', {
                state: {
                  user: currentUser,
                  token: token,
                  returnTo: '/payment',
                  returnState: { type, subscriptionType },
                },
              })
            }, 1500)
          } else {
            setError(data.message || 'Error creating payment intent')
          }
        }
      } catch (error) {
        console.error('Payment intent error:', error)
        setError('Error setting up payment. Please try again.')
      }
    },
    [type, token, currentUser, navigate, subscriptionType]
  )

  const fetchPricing = useCallback(async () => {
    try {
      console.log('Fetching pricing data...')
      const response = await fetch(apiUrl('/api/payment/pricing'))
      const data = await response.json()
      console.log('Pricing response:', data)
      if (data.success) {
        setPricing(data.pricing)
        console.log(
          'Pricing set, type:',
          type,
          'subscriptionType:',
          subscriptionType
        )
        if (type === 'subscription' && subscriptionType) {
          console.log(
            'Creating payment intent for subscription:',
            subscriptionType
          )
          createPaymentIntent(subscriptionType)
        } else if (type === 'listing') {
          console.log('Creating payment intent for additional listing')
          createPaymentIntent('additional')
        } else {
          console.log(
            'No payment intent created - missing type or subscriptionType'
          )
        }
      } else {
        console.error('Pricing fetch failed:', data)
        setError('Error loading pricing data')
      }
    } catch (error) {
      console.error('Pricing fetch error:', error)
      setError('Error loading pricing. Please try again.')
    }
  }, [type, subscriptionType, createPaymentIntent])

  useEffect(() => {
    if (!currentUser || !token) {
      navigate('/sign-in')
      return
    }

    if (!type) {
      navigate('/pricing')
      return
    }

    fetchPricing()
  }, [currentUser, token, type, navigate, fetchPricing])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!stripe || !elements) {
      setError('Payment system not loaded. Please refresh and try again.')
      setLoading(false)
      return
    }

    if (!paymentIntent) {
      setError('Payment not initialized. Please try again.')
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
      // Confirm payment intent
      const { error: stripeError, paymentIntent: confirmedPayment } =
        await stripe.confirmCardPayment(paymentIntent.clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: currentUser.username,
              email: currentUser.email,
            },
          },
        })

      if (stripeError) {
        setError(stripeError.message)
        setLoading(false)
        return
      }

      if (confirmedPayment.status === 'succeeded') {
        // Update user data in Redux store
        const updatedUser = {
          ...currentUser,
          subscription:
            type === 'subscription'
              ? subscriptionType
              : currentUser.subscription,
          listingLimit:
            type === 'subscription'
              ? subscriptionType === 'premium'
                ? 10
                : subscriptionType === 'pro'
                ? 50
                : currentUser.listingLimit
              : currentUser.listingLimit + 1,
        }

        dispatch(signInSuccess({ user: updatedUser, token }))

        setLoading(false)
        toast.success(
          type === 'subscription'
            ? `Successfully upgraded to ${subscriptionType} plan!`
            : 'Successfully purchased additional listing!'
        )

        setTimeout(() => navigate('/profile'), 1500)
      }
    } catch (error) {
      console.error('Payment confirmation error:', error)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const getPaymentDetails = () => {
    if (!pricing) return null

    if (type === 'subscription' && subscriptionType) {
      const plan = pricing[`${subscriptionType}_monthly`]
      return {
        title: `${
          subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1)
        } Subscription`,
        price: plan ? (plan.amount / 100).toFixed(2) : '0.00',
        description:
          subscriptionType === 'premium'
            ? '10 listings + priority support + analytics'
            : '50 listings + priority support + analytics + custom branding',
        period: '/month',
      }
    } else if (type === 'listing') {
      return {
        title: 'Additional Listing',
        price: pricing.additional_listing
          ? (pricing.additional_listing.amount / 100).toFixed(2)
          : '5.00',
        description: 'One-time payment for an extra property listing',
        period: '',
      }
    }
    return null
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

  if (!currentUser || !token) {
    return null
  }

  const paymentDetails = getPaymentDetails()

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <ToastContainer />

      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <h2 className='mt-6 text-3xl font-extrabold text-gray-900'>
            Complete Your Purchase
          </h2>
          {paymentDetails && (
            <div className='mt-4 p-4 bg-blue-50 rounded-lg'>
              <h3 className='font-medium text-blue-900'>
                {paymentDetails.title}
              </h3>
              <p className='text-2xl font-bold text-blue-900'>
                ${paymentDetails.price}
                {paymentDetails.period}
              </p>
              <p className='text-sm text-blue-700'>
                {paymentDetails.description}
              </p>
            </div>
          )}
        </div>

        {!paymentIntent && !error && (
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
            <p className='mt-2 text-gray-600'>Setting up payment...</p>
          </div>
        )}

        {paymentIntent && (
          <form onSubmit={handleSubmit} className='mt-8 space-y-6'>
            <div className='bg-white shadow rounded-lg p-6'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                Payment Information
              </h3>

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
                Secured by Stripe. Your payment information is encrypted and
                secure.
              </div>
            </div>

            <button
              type='submit'
              disabled={loading || !stripe}
              className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
            >
              {loading
                ? 'Processing...'
                : `Pay $${paymentDetails?.price || '0.00'}`}
            </button>

            {error && (
              <div className='mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
                {error}
              </div>
            )}
          </form>
        )}

        <div className='text-center'>
          <button
            onClick={() => navigate('/pricing')}
            className='text-blue-600 hover:text-blue-800 text-sm'
          >
            ← Back to Pricing
          </button>
        </div>
      </div>
    </div>
  )
}

const Payment = () => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  )
}

export default Payment
