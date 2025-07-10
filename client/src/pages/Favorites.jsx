//client/src/pages/Favorites.jsx

import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import axios from 'axios'
import ListingItem from '../components/ListingItem'
import { apiUrl } from '../utils/api'

export default function Favorites() {
  const { currentUser, token } = useSelector((state) => state.user)
  const [favoriteListings, setFavoriteListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!currentUser || !token) {
        setError('Please log in to view your favorites')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log('Fetching favorites for user:', currentUser._id) // Debug log

        // 1️⃣ Get user's favorite IDs
        const userApiUrl = apiUrl(`/api/user/${currentUser._id}`)
        console.log('User API URL:', userApiUrl) // Debug log
        
        const userRes = await axios.get(userApiUrl, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        })

        console.log('User response:', userRes.data) // Debug log
        const favoriteIds = userRes.data?.favorites || []
        console.log('Favorite IDs:', favoriteIds) // Debug log

        // 2️⃣ Get listings for those favorite IDs
        if (favoriteIds.length > 0) {
          const listingsApiUrl = apiUrl('/api/listing/favorites')
          console.log('Listings API URL:', listingsApiUrl) // Debug log
          
          const listingsRes = await axios.put(
            listingsApiUrl,
            { ids: favoriteIds },
            {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              withCredentials: true,
            }
          )

          console.log('Listings response:', listingsRes.data) // Debug log
          setFavoriteListings(listingsRes.data)
        } else {
          console.log('No favorite IDs found') // Debug log
          setFavoriteListings([])
        }

        setError(null)
      } catch (err) {
        console.error('Favorites fetch error:', err)
        console.error('Error response:', err.response?.data) // Debug log
        setError('Could not load favorites. Please try again.')
        setFavoriteListings([])
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [currentUser, token])

  if (!currentUser) {
    return (
      <div className='p-4'>
        <h1 className='text-2xl font-bold mb-4'>My Favorites</h1>
        <p className='text-gray-600'>Please log in to view your favorites.</p>
      </div>
    )
  }

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>My Favorites</h1>

      {loading && <p className='text-gray-600'>Loading your favorites...</p>}

      {error && (
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className='flex flex-wrap gap-4'>
          {favoriteListings.length === 0 ? (
            <p className='text-gray-600'>You don't have any favorites yet.</p>
          ) : (
            favoriteListings.map((listing) => (
              <ListingItem key={listing._id} listing={listing} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
