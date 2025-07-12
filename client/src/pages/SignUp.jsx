// client/src/pages/SignUp.jsx
import React, { useState } from 'react'
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
  const [cardComplete, setCardComplete] = useState(false)

  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()

  // Check if we're in test mode or live mode
  const isTestMode = import.meta.env.VITE_STRIPE_MODE === 'test' || 
                     import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test')

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }))
    setError(null) // Clear error when user starts typing
  }

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

    if (!cardComplete) {
      setError('Please complete your card information.')
      setLoading(false)
      return
    }

    try {
      // Get the CardElement
      const cardElement = elements.getElement(CardElement)

      if (!cardElement) {
        setError('Card element not found. Please refresh the page.')
        setLoading(false)
        return
      }

      // Check if card element is complete
      const cardState = await cardElement._complete
      console.log('Card element state:', cardState)

      // Create payment method
      console.log('Creating payment method...')
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: formData.username,
          email: formData.email,
        },
      })

      console.log('Stripe response:', { error: stripeError, paymentMethod })

      if (stripeError) {
        console.error('Stripe payment method error:', stripeError)
        setError(stripeError.message || 'Invalid payment card. Please check your card details.')
        setLoading(false)
        return
      }

      // Submit to backend with payment method
      const response = await fetch(apiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          paymentMethodId: paymentMethod.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Account created successfully! Please sign in to continue.')
        setTimeout(() => {
          navigate('/sign-in')
        }, 2000)
      } else {
        setError(data.message || 'Registration failed. Please try again.')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('An error occurred during registration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl text-center font-semibold my-7">Sign Up</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Username"
          className="border p-3 rounded-lg"
          id="username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="border p-3 rounded-lg"
          id="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          className="border p-3 rounded-lg"
          id="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className="border p-3 rounded-lg"
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
        
        {/* Card Element */}
        <div className="border p-3 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Card (Required) *
          </label>
          <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3">
            {isTestMode ? (
              <>
                <p className="text-sm text-blue-800 font-medium">Test Mode - Use these test cards:</p>
                <div className="space-y-1">
                  <p className="text-sm text-blue-700">• <span className="font-mono">4242 4242 4242 4242</span> - Visa (Succeeds)</p>
                  <p className="text-sm text-blue-700">• <span className="font-mono">4000 0000 0000 0002</span> - Visa (Declined)</p>
                  <p className="text-sm text-blue-700">• <span className="font-mono">5555 5555 5555 4444</span> - Mastercard (Succeeds)</p>
                  <p className="text-sm text-blue-700">• <span className="font-mono">3782 8224 6310 005</span> - American Express</p>
                </div>
                <p className="text-sm text-blue-700 mt-2">• Expiry: Any future date (e.g., 12/25)</p>
                <p className="text-sm text-blue-700">• CVC: Any 3 digits (e.g., 123)</p>
                <p className="text-xs text-blue-600 mt-2 bg-yellow-50 p-1 rounded">
                  ⚠️ <strong>Important:</strong> Only test cards work in development mode. Real cards are automatically rejected.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-green-800 font-medium">🔒 Live Mode - Real Card Processing</p>
                <div className="space-y-1">
                  <p className="text-sm text-green-700">• Use your real credit or debit card</p>
                  <p className="text-sm text-green-700">• Your card will be securely saved for future purchases</p>
                  <p className="text-sm text-green-700">• SSL encrypted and PCI compliant</p>
                </div>
                <p className="text-xs text-green-600 mt-2 bg-green-50 p-1 rounded">
                  🛡️ <strong>Secure:</strong> Card details are processed by Stripe and never stored on our servers.
                </p>
              </>
            )}
          </div>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
            onChange={(event) => {
              setCardComplete(event.complete)
              if (event.error) {
                setError(event.error.message)
              } else {
                setError(null)
              }
            }}
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          disabled={loading || !stripe || !cardComplete}
          type="submit"
          className="bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80"
        >
          {loading ? 'Creating Account...' : !cardComplete ? 'Complete Card Details' : 'Sign Up with Payment Card'}
        </button>
        <OAuth />
      </form>
      <div className="flex gap-2 mt-5">
        <p>Have an account?</p>
        <Link to="/sign-in">
          <span className="text-blue-700">Sign in</span>
        </Link>
      </div>
      <div className="flex gap-2 mt-2">
        <p className="text-sm text-gray-600">Need help with payment?</p>
        <Link to="/sign-up-simple">
          <span className="text-blue-700 text-sm">Register without payment</span>
        </Link>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
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
