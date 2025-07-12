//client/src/pages/AdminDashboard.jsx

import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { apiUrl } from '../utils/api'

export default function AdminDashboard() {
  const { currentUser, token } = useSelector((state) => state.user)
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [listings, setListings] = useState([])
  const [users, setUsers] = useState([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [listingsPage, setListingsPage] = useState(1)
  const [usersPage, setUsersPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  // Check if user is admin
  useEffect(() => {
    if (!currentUser || !token || currentUser.role !== 'admin') {
      toast.error('Admin access required')
      navigate('/')
    }
  }, [currentUser, token, navigate])

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const response = await fetch(apiUrl('/api/admin/dashboard/stats'), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      } else {
        toast.error('Failed to fetch stats')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Error loading dashboard stats')
    }
  }

  // Fetch all listings
  const fetchListings = async (page = 1, search = '') => {
    try {
      const response = await fetch(
        apiUrl(`/api/admin/listings?page=${page}&limit=10&search=${search}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      )

      const data = await response.json()
      if (data.success) {
        setListings(data.listings)
      } else {
        toast.error('Failed to fetch listings')
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
      toast.error('Error loading listings')
    }
  }

  // Fetch all users
  const fetchUsers = async (page = 1, search = '') => {
    try {
      const response = await fetch(
        apiUrl(`/api/admin/users?page=${page}&limit=10&search=${search}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      )

      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      } else {
        toast.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error loading users')
    }
  }

  // Delete listing
  const deleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return
    }

    try {
      const response = await fetch(apiUrl(`/api/admin/listings/${listingId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Listing deleted successfully')
        fetchListings(listingsPage, searchTerm)
        fetchStats() // Refresh stats
      } else {
        toast.error(data.message || 'Failed to delete listing')
      }
    } catch (error) {
      console.error('Error deleting listing:', error)
      toast.error('Error deleting listing')
    }
  }

  // Update user role
  const updateUserRole = async (userId, newRole) => {
    if (
      !window.confirm(`Are you sure you want to make this user ${newRole}?`)
    ) {
      return
    }

    try {
      const response = await fetch(apiUrl(`/api/admin/users/${userId}/role`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`User role updated to ${newRole}`)
        fetchUsers(usersPage, searchTerm)
        fetchStats() // Refresh stats
      } else {
        toast.error(data.message || 'Failed to update user role')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Error updating user role')
    }
  }

  // Delete user
  const deleteUser = async (userId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this user? This will also delete all their listings.'
      )
    ) {
      return
    }

    try {
      const response = await fetch(apiUrl(`/api/admin/users/${userId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const data = await response.json()
      if (data.success) {
        toast.success('User deleted successfully')
        fetchUsers(usersPage, searchTerm)
        fetchStats() // Refresh stats
      } else {
        toast.error(data.message || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Error deleting user')
    }
  }

  // Initial load
  useEffect(() => {
    if (currentUser && token && currentUser.role === 'admin') {
      fetchStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, token]) // fetchStats is safe to omit since it doesn't use state

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'listings') {
      fetchListings(listingsPage, searchTerm)
    } else if (activeTab === 'users') {
      fetchUsers(usersPage, searchTerm)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, listingsPage, usersPage, searchTerm])

  // Search handler
  const handleSearch = () => {
    if (activeTab === 'listings') {
      setListingsPage(1)
      fetchListings(1, searchTerm)
    } else if (activeTab === 'users') {
      setUsersPage(1)
      fetchUsers(1, searchTerm)
    }
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return null
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <ToastContainer />

      {/* Header */}
      <div className='bg-white shadow'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-6'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Admin Dashboard
            </h1>
            <div className='flex items-center space-x-4'>
              <span className='text-sm text-gray-500'>
                Welcome, {currentUser.username}
              </span>
              <span className='px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full'>
                Admin
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='border-b border-gray-200'>
          <nav className='-mb-px flex space-x-8'>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'listings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manage Listings
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manage Users
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {stats && (
              <>
                <div className='bg-white overflow-hidden shadow rounded-lg'>
                  <div className='p-5'>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0'>
                        <div className='w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center'>
                          <span className='text-white text-sm font-bold'>
                            U
                          </span>
                        </div>
                      </div>
                      <div className='ml-5 w-0 flex-1'>
                        <dl>
                          <dt className='text-sm font-medium text-gray-500 truncate'>
                            Total Users
                          </dt>
                          <dd className='text-lg font-medium text-gray-900'>
                            {stats.users.total}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='bg-white overflow-hidden shadow rounded-lg'>
                  <div className='p-5'>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0'>
                        <div className='w-8 h-8 bg-green-500 rounded-md flex items-center justify-center'>
                          <span className='text-white text-sm font-bold'>
                            L
                          </span>
                        </div>
                      </div>
                      <div className='ml-5 w-0 flex-1'>
                        <dl>
                          <dt className='text-sm font-medium text-gray-500 truncate'>
                            Total Listings
                          </dt>
                          <dd className='text-lg font-medium text-gray-900'>
                            {stats.listings.total}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='bg-white overflow-hidden shadow rounded-lg'>
                  <div className='p-5'>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0'>
                        <div className='w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center'>
                          <span className='text-white text-sm font-bold'>
                            A
                          </span>
                        </div>
                      </div>
                      <div className='ml-5 w-0 flex-1'>
                        <dl>
                          <dt className='text-sm font-medium text-gray-500 truncate'>
                            Admins
                          </dt>
                          <dd className='text-lg font-medium text-gray-900'>
                            {stats.users.admins}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='bg-white overflow-hidden shadow rounded-lg'>
                  <div className='p-5'>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0'>
                        <div className='w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center'>
                          <span className='text-white text-sm font-bold'>
                            N
                          </span>
                        </div>
                      </div>
                      <div className='ml-5 w-0 flex-1'>
                        <dl>
                          <dt className='text-sm font-medium text-gray-500 truncate'>
                            New This Month
                          </dt>
                          <dd className='text-lg font-medium text-gray-900'>
                            {stats.users.recent} users, {stats.listings.recent}{' '}
                            listings
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <div>
            {/* Search Bar */}
            <div className='mb-6 flex gap-4'>
              <input
                type='text'
                placeholder='Search listings...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='flex-1 border border-gray-300 rounded-lg px-4 py-2'
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
              >
                Search
              </button>
            </div>

            {/* Listings Table */}
            <div className='bg-white shadow overflow-hidden sm:rounded-md'>
              <ul className='divide-y divide-gray-200'>
                {listings.map((listing) => (
                  <li key={listing._id} className='px-6 py-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center'>
                        <div className='flex-shrink-0 h-16 w-16'>
                          <img
                            className='h-16 w-16 rounded-md object-cover'
                            src={
                              listing.imageUrls[0] || '/placeholder-image.jpg'
                            }
                            alt={listing.name}
                          />
                        </div>
                        <div className='ml-4'>
                          <div className='text-sm font-medium text-gray-900'>
                            {listing.name}
                          </div>
                          <div className='text-sm text-gray-500'>
                            {listing.address}
                          </div>
                          <div className='text-sm text-gray-500'>
                            By: {listing.userRef?.username || 'Unknown User'}
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <span className='px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800'>
                          {listing.type}
                        </span>
                        <span className='text-sm font-medium text-gray-900'>
                          ${listing.regularPrice.toLocaleString()}
                        </span>
                        <button
                          onClick={() => navigate(`/listing/${listing._id}`)}
                          className='text-blue-600 hover:text-blue-900 text-sm'
                        >
                          View
                        </button>
                        <button
                          onClick={() => deleteListing(listing._id)}
                          className='text-red-600 hover:text-red-900 text-sm'
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            {/* Search Bar */}
            <div className='mb-6 flex gap-4'>
              <input
                type='text'
                placeholder='Search users...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='flex-1 border border-gray-300 rounded-lg px-4 py-2'
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
              >
                Search
              </button>
            </div>

            {/* Users Table */}
            <div className='bg-white shadow overflow-hidden sm:rounded-md'>
              <ul className='divide-y divide-gray-200'>
                {users.map((user) => (
                  <li key={user._id} className='px-6 py-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center'>
                        <div className='flex-shrink-0 h-12 w-12'>
                          <img
                            className='h-12 w-12 rounded-full object-cover'
                            src={user.avatar || '/default-avatar.png'}
                            alt={user.username}
                          />
                        </div>
                        <div className='ml-4'>
                          <div className='text-sm font-medium text-gray-900'>
                            {user.username}
                          </div>
                          <div className='text-sm text-gray-500'>
                            {user.email}
                          </div>
                          <div className='text-sm text-gray-500'>
                            Joined:{' '}
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.role}
                        </span>
                        {user._id !== currentUser._id && (
                          <>
                            <button
                              onClick={() =>
                                updateUserRole(
                                  user._id,
                                  user.role === 'admin' ? 'user' : 'admin'
                                )
                              }
                              className='text-blue-600 hover:text-blue-900 text-sm'
                            >
                              {user.role === 'admin'
                                ? 'Remove Admin'
                                : 'Make Admin'}
                            </button>
                            <button
                              onClick={() => deleteUser(user._id)}
                              className='text-red-600 hover:text-red-900 text-sm'
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
