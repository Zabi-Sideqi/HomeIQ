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

        // 1️⃣ Get user's favorite IDs
        const userRes = await axios.get(apiUrl(`/api/user/${currentUser._id}`), {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        })

        const favoriteIds = userRes.data?.favorites || []

        // 2️⃣ Get listings for those favorite IDs
        if (favoriteIds.length > 0) {
          const listingsRes = await axios.put(
            apiUrl('/api/listing/favorites'),
            { ids: favoriteIds },
            {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true,
            }
          )

          setFavoriteListings(listingsRes.data)
        } else {
          setFavoriteListings([])
        }

        setError(null)
      } catch (err) {
        console.error('Favorites fetch error:', err)
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
