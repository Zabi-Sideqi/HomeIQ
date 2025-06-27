//client/src/pages/ResetPassword.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const { token } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    if (!token) {
      setError('Invalid reset token')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (data.success) {
        setMessage('Password reset successful! Redirecting to sign in...')
        setTimeout(() => {
          navigate('/sign-in')
        }, 2000)
      } else {
        setError(data.message || 'Something went wrong')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='max-w-md w-full text-center'>
          <h2 className='text-2xl font-bold text-red-600 mb-4'>
            Invalid Reset Link
          </h2>
          <p className='text-gray-600 mb-4'>
            This password reset link is invalid or has expired.
          </p>
          <Link
            to='/forgot-password'
            className='text-indigo-600 hover:text-indigo-500 font-medium'
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            {t('Reset Password')}
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Enter your new password below
          </p>
        </div>

        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          <div className='space-y-4'>
            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700'
              >
                New Password
              </label>
              <div className='mt-1 relative'>
                <input
                  id='password'
                  name='password'
                  type={showPasswords ? 'text' : 'password'}
                  required
                  className='appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
                  placeholder='Enter new password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-sm font-medium text-gray-700'
              >
                Confirm New Password
              </label>
              <div className='mt-1 relative'>
                <input
                  id='confirmPassword'
                  name='confirmPassword'
                  type={showPasswords ? 'text' : 'password'}
                  required
                  className='appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
                  placeholder='Confirm new password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className='flex items-center'>
              <input
                id='showPasswords'
                name='showPasswords'
                type='checkbox'
                className='h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded'
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
              />
              <label
                htmlFor='showPasswords'
                className='ml-2 block text-sm text-gray-900'
              >
                Show passwords
              </label>
            </div>
          </div>

          {error && (
            <div className='text-red-600 text-sm text-center bg-red-50 p-3 rounded-md'>
              {error}
            </div>
          )}

          {message && (
            <div className='text-green-600 text-sm text-center bg-green-50 p-3 rounded-md'>
              {message}
            </div>
          )}

          <div>
            <button
              type='submit'
              disabled={loading}
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed'
            >
              {loading ? (
                <div className='flex items-center'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Resetting...
                </div>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>

          <div className='text-center'>
            <Link
              to='/sign-in'
              className='text-indigo-600 hover:text-indigo-500 text-sm font-medium'
            >
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
