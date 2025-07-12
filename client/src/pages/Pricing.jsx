//client/src/pages/Pricing.jsx

import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { apiUrl } from '../utils/api'

export default function Pricing() {
  const { currentUser, token } = useSelector((state) => state.user)
  const navigate = useNavigate()

  const [pricing, setPricing] = useState(null)
  const [userEligibility, setUserEligibility] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchPricing()
        if (currentUser && token) {
          await fetchUserEligibility()
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, token])

  const fetchPricing = async () => {
    try {
      const response = await fetch(apiUrl('/api/payment/pricing'))
      const data = await response.json()
      if (data.success) {
        setPricing(data.pricing)
      }
    } catch (error) {
      console.error('Error fetching pricing:', error)
      toast.error('Error loading pricing information')
    }
  }

  const fetchUserEligibility = async () => {
    try {
      const response = await fetch(apiUrl('/api/payment/check-eligibility'), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success) {
        setUserEligibility(data)
      }
    } catch (error) {
      console.error('Error fetching user eligibility:', error)
    }
  }

  const handleUpgrade = (subscriptionType) => {
    if (!currentUser) {
      toast.error('Please sign in to upgrade')
      navigate('/sign-in')
      return
    }

    navigate('/payment', {
      state: {
        type: 'subscription',
        subscriptionType,
      },
    })
  }

  const handleBuyListings = () => {
    if (!currentUser) {
      toast.error('Please sign in to purchase additional listings')
      navigate('/sign-in')
      return
    }

    navigate('/payment', {
      state: {
        type: 'listing',
      },
    })
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading pricing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <ToastContainer />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center'>
          <h1 className='text-4xl font-bold text-gray-900 sm:text-5xl'>
            Choose Your Plan
          </h1>
          <p className='mt-4 text-xl text-gray-600'>
            Start with 1 free listing, then upgrade as you grow
          </p>
        </div>

        {/* User Status */}
        {currentUser && userEligibility && (
          <div className='mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-lg font-medium text-blue-900'>
                  Your Current Plan
                </h3>
                <p className='text-blue-700'>
                  {userEligibility.subscription.charAt(0).toUpperCase() +
                    userEligibility.subscription.slice(1)}{' '}
                  Plan
                </p>
                <p className='text-sm text-blue-600'>
                  {userEligibility.remainingListings} of{' '}
                  {userEligibility.listingLimit} listings remaining
                </p>
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-blue-900'>
                  {userEligibility.currentListings}/
                  {userEligibility.listingLimit}
                </div>
                <p className='text-sm text-blue-600'>Listings Used</p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className='mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          {/* Free Plan */}
          <div className='bg-white rounded-lg shadow-md overflow-hidden'>
            <div className='px-6 py-8'>
              <h3 className='text-2xl font-bold text-gray-900'>Free</h3>
              <p className='mt-4 text-gray-600'>Perfect for getting started</p>
              <div className='mt-6'>
                <span className='text-4xl font-bold text-gray-900'>$0</span>
                <span className='text-gray-600'>/month</span>
              </div>
              <ul className='mt-6 space-y-3'>
                <li className='flex items-center text-gray-600'>
                  <svg
                    className='h-5 w-5 text-green-500 mr-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M5 13l4 4L19 7'
                    ></path>
                  </svg>
                  1 property listing
                </li>
                <li className='flex items-center text-gray-600'>
                  <svg
                    className='h-5 w-5 text-green-500 mr-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M5 13l4 4L19 7'
                    ></path>
                  </svg>
                  Basic listing features
                </li>
                <li className='flex items-center text-gray-600'>
                  <svg
                    className='h-5 w-5 text-green-500 mr-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M5 13l4 4L19 7'
                    ></path>
                  </svg>
                  Community support
                </li>
              </ul>
              <button
                disabled
                className='mt-8 w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed'
              >
                Current Plan
              </button>
            </div>
          </div>

          {/* Additional Listings */}
          <div className='bg-white rounded-lg shadow-md overflow-hidden border-2 border-blue-500'>
            <div className='px-6 py-8'>
              <div className='flex items-center justify-between'>
                <h3 className='text-2xl font-bold text-gray-900'>
                  Extra Listings
                </h3>
                <span className='bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full'>
                  Pay per use
                </span>
              </div>
              <p className='mt-4 text-gray-600'>Add more listings as needed</p>
              <div className='mt-6'>
                <span className='text-4xl font-bold text-gray-900'>
                  $
                  {pricing?.additional_listing
                    ? (pricing.additional_listing.amount / 100).toFixed(2)
                    : '5.00'}
                </span>
                <span className='text-gray-600'>/listing</span>
              </div>
              <ul className='mt-6 space-y-3'>
                <li className='flex items-center text-gray-600'>
                  <svg
                    className='h-5 w-5 text-green-500 mr-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M5 13l4 4L19 7'
                    ></path>
                  </svg>
                  One-time payment
                </li>
                <li className='flex items-center text-gray-600'>
                  <svg
                    className='h-5 w-5 text-green-500 mr-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M5 13l4 4L19 7'
                    ></path>
                  </svg>
                  No monthly commitment
                </li>
                <li className='flex items-center text-gray-600'>
                  <svg
                    className='h-5 w-5 text-green-500 mr-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M5 13l4 4L19 7'
                    ></path>
                  </svg>
                  Same listing features
                </li>
              </ul>
              <button
                onClick={handleBuyListings}
                className='mt-8 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200'
              >
                Buy Additional Listings
              </button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className='bg-white rounded-lg shadow-md overflow-hidden'>
            <div className='px-6 py-8'>
              <h3 className='text-2xl font-bold text-gray-900'>Premium</h3>
              <p className='mt-4 text-gray-600'>Great for active landlords</p>
              <div className='mt-6'>
                <span className='text-4xl font-bold text-gray-900'>
                  $
                  {pricing?.premium_monthly
                    ? (pricing.premium_monthly.amount / 100).toFixed(2)
                    : '19.99'}
                </span>
                <span className='text-gray-600'>/month</span>
              </div>
              <ul className='mt-6 space-y-3'>
                <li className='flex items-center text-gray-600'>
                  <svg
                    className='h-5 w-5 text-green-500 mr-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M5 13l4 4L19 7'
                    ></path>
                  </svg>
                  10 property listings
                </li>
                <li className='flex items-center text-gray-600'>
                  <svg
                    className='h-5 w-5 text-green-500 mr-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M5 13l4 4L19 7'
                    ></path>
                  </svg>
                  Priority support
                </li>
                <li className='flex items-center text-gray-600'>
                  <svg
                    className='h-5 w-5 text-green-500 mr-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M5 13l4 4L19 7'
                    ></path>
                  </svg>
                  Advanced analytics
                </li>
              </ul>
              <button
                onClick={() => handleUpgrade('premium')}
                className='mt-8 w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-200'
              >
                Upgrade to Premium
              </button>
            </div>
          </div>

          {/* Pro Plan */}
          <div className='bg-white rounded-lg shadow-md overflow-hidden'>
            <div className='px-6 py-8'>
              <div className='flex items-center justify-between'>
                <h3 className='text-2xl font-bold text-gray-900'>Pro</h3>
                <span className='bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full'>
                  Best Value
                </span>
              </div>
              <p className='mt-4 text-gray-600'>For professional landlords</p>
              <div className='mt-6'>
                <span className='text-4xl font-bold text-gray-900'>
                  $
                  {pricing?.pro_monthly
                    ? (pricing.pro_monthly.amount / 100).toFixed(2)
                    : '49.99'}
                </span>
                <span className='text-gray-600'>/month</span>
              </div>
              <ul className='mt-6 space-y-3'>
                <li className='flex items-center text-gray-600'>
                  <svg
                    className='h-5 w-5 text-green-500 mr-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M5 13l4 4L19 7'
                    ></path>
                  </svg>
                  50 property listings
                </li>
                <li className='flex items-center text-gray-600'>
                  <svg
                    className='h-5 w-5 text-green-500 mr-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M5 13l4 4L19 7'
                    ></path>
                  </svg>
                  Priority support
                </li>
                <li className='flex items-center text-gray-600'>
                  <svg
                    className='h-5 w-5 text-green-500 mr-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M5 13l4 4L19 7'
                    ></path>
                  </svg>
                  Advanced analytics
                </li>
                <li className='flex items-center text-gray-600'>
                  <svg
                    className='h-5 w-5 text-green-500 mr-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M5 13l4 4L19 7'
                    ></path>
                  </svg>
                  Custom branding
                </li>
              </ul>
              <button
                onClick={() => handleUpgrade('pro')}
                className='mt-8 w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition duration-200'
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className='mt-16'>
          <h2 className='text-3xl font-bold text-gray-900 text-center mb-8'>
            Frequently Asked Questions
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div className='bg-white p-6 rounded-lg shadow'>
              <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                How does billing work?
              </h3>
              <p className='text-gray-600'>
                Subscriptions are billed monthly. Additional listings are
                one-time payments that add to your current limit permanently.
              </p>
            </div>
            <div className='bg-white p-6 rounded-lg shadow'>
              <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                Can I cancel anytime?
              </h3>
              <p className='text-gray-600'>
                Yes, you can cancel your subscription at any time. You'll
                continue to have access until the end of your billing period.
              </p>
            </div>
            <div className='bg-white p-6 rounded-lg shadow'>
              <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                What payment methods do you accept?
              </h3>
              <p className='text-gray-600'>
                We accept all major credit cards and debit cards through our
                secure payment processor, Stripe.
              </p>
            </div>
            <div className='bg-white p-6 rounded-lg shadow'>
              <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                Is there a setup fee?
              </h3>
              <p className='text-gray-600'>
                No setup fees! You only pay for what you use. Start with 1 free
                listing and upgrade when you need more.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
