// client/src/pages/SignUp.jsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { OAuth } from '../components/OAuth'
import { apiUrl } from '../utils/api'

// Load Stripe - you'll need to add your publishable key to .env
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here'
)

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [setupIntentSecret, setSetupIntentSecret] = useState(null)

  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }))
    setError(null) // Clear error when user starts typing
  }

  const createSetupIntent = async () => {
    if (!formData.email) {
      setError('Please enter your email first')
      return
    }

    try {
      const response = await fetch(apiUrl('/api/auth/setup-intent'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
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
  }

  // Create setup intent when email is entered
  useEffect(() => {
    if (formData.email && formData.email.includes('@') && !setupIntentSecret) {
      createSetupIntent()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.email, setupIntentSecret])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (!formData.username || !formData.email || !formData.password) {
      setError('All fields are required')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

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
              name: formData.username,
              email: formData.email,
            },
          },
        }
      )

      if (stripeError) {
        setError(stripeError.message)
        setLoading(false)
        return
      }

      // Create account with payment method
      const response = await fetch(apiUrl('/api/auth/signup'), {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          paymentMethodId: setupIntent.payment_method,
        }),
      })

      const data = await response.json()

      if (data.success === false) {
        setError(data.message)
        setLoading(false)
        return
      }

      setLoading(false)
      toast.success('Account created successfully!')
      setTimeout(() => navigate('/sign-in'), 1500)
    } catch (error) {
      console.error('Signup error:', error)
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

  return (
    <div className='p-3 max-w-lg mx-auto'>
      <ToastContainer />
      <h1 className='text-3xl text-center font-semibold my-7'>Sign Up</h1>

      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input
          type='text'
          placeholder='Username'
          className='border p-3 rounded-lg'
          id='username'
          value={formData.username}
          onChange={handleChange}
          required
        />

        <input
          type='email'
          placeholder='Email'
          className='border p-3 rounded-lg'
          id='email'
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type='password'
          placeholder='Password (min 8 characters)'
          className='border p-3 rounded-lg'
          id='password'
          value={formData.password}
          onChange={handleChange}
          required
          minLength={8}
        />

        <input
          type='password'
          placeholder='Confirm Password'
          className='border p-3 rounded-lg'
          id='confirmPassword'
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />

        {/* Card Information Section */}
        <div className='border rounded-lg p-4 bg-gray-50'>
          <h3 className='text-lg font-medium text-gray-900 mb-3'>
            Payment Information
          </h3>
          <p className='text-sm text-gray-600 mb-4'>
            We require a payment method to prevent spam accounts. You won't be
            charged during registration.
          </p>

          <div className='border border-gray-300 rounded-lg p-3 bg-white'>
            <CardElement options={cardElementOptions} />
          </div>

          <div className='mt-2 flex items-center text-xs text-gray-500'>
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
          className='bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80'
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <OAuth />

      <div className='flex gap-2 mt-5'>
        <p>Already have an account?</p>
        <Link to='/sign-in'>
          <span className='text-blue-700'>Sign in</span>
        </Link>
      </div>

      {error && (
        <div className='mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
          {error}
        </div>
      )}

      {/* Information Section */}
      <div className='mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
        <h4 className='font-medium text-blue-900 mb-2'>
          Why do we need your payment method?
        </h4>
        <ul className='text-sm text-blue-700 space-y-1'>
          <li>• Prevents spam and fake accounts</li>
          <li>• Enables seamless upgrades when you need more listings</li>
          <li>• You get 1 free listing to start</li>
          <li>• No charges during registration</li>
          <li>• Secure payment processing by Stripe</li>
        </ul>
      </div>
    </div>
  )
}

const SignUp = () => {
  return (
    <Elements stripe={stripePromise}>
      <SignUpForm />
    </Elements>
  )
}

export default SignUp
