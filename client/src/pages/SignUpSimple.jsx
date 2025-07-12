//client/src/pages/SignUpSimple.jsx

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { apiUrl } from '../utils/api'

export default function SignUpSimple() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Basic validation
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

    try {
      // Create account without payment method
      const response = await fetch(apiUrl('/api/auth/signup-simple'), {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success === false) {
        setError(data.message)
        setLoading(false)
        return
      }

      setLoading(false)
      toast.success(
        'Account created successfully! Please add a payment method to complete setup.'
      )

      // Redirect to payment setup with user data
      setTimeout(() => {
        navigate('/setup-payment', {
          state: {
            user: data.user,
            token: data.token,
            isNewUser: true,
          },
        })
      }, 1500)
    } catch (error) {
      console.error('Signup error:', error)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <ToastContainer />

      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <h2 className='mt-6 text-3xl font-extrabold text-gray-900'>
            Create Your Account
          </h2>
          <p className='mt-2 text-sm text-gray-600'>
            Start with a free account. Add payment method in the next step.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='mt-8 space-y-6'>
          <div className='space-y-4'>
            <div>
              <label
                htmlFor='username'
                className='block text-sm font-medium text-gray-700'
              >
                Username
              </label>
              <input
                type='text'
                id='username'
                placeholder='Enter your username'
                value={formData.username}
                onChange={handleChange}
                className='mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700'
              >
                Email Address
              </label>
              <input
                type='email'
                id='email'
                placeholder='Enter your email'
                value={formData.email}
                onChange={handleChange}
                className='mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700'
              >
                Password
              </label>
              <input
                type='password'
                id='password'
                placeholder='Enter your password (min 8 characters)'
                value={formData.password}
                onChange={handleChange}
                className='mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-sm font-medium text-gray-700'
              >
                Confirm Password
              </label>
              <input
                type='password'
                id='confirmPassword'
                placeholder='Confirm your password'
                value={formData.confirmPassword}
                onChange={handleChange}
                className='mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
          </div>

          <button
            type='submit'
            disabled={loading}
            className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          {error && (
            <div className='mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
              {error}
            </div>
          )}

          <div className='text-center text-sm'>
            <span className='text-gray-600'>Already have an account? </span>
            <Link
              to='/sign-in'
              className='text-blue-600 hover:text-blue-800 font-medium'
            >
              Sign in here
            </Link>
          </div>
        </form>

        {/* Next Steps Info */}
        <div className='mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <h4 className='font-medium text-blue-900 mb-2'>Next Steps:</h4>
          <ul className='text-sm text-blue-700 space-y-1'>
            <li>• Account created with basic access</li>
            <li>• Add payment method to unlock all features</li>
            <li>• Start with 1 free property listing</li>
            <li>• Upgrade anytime for more listings</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
