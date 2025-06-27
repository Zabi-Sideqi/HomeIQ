//client/src/pages/Favorites.jsx

import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import axios from 'axios'
import ListingItem from '../components/ListingItem'
import { apiUrl } from '../utils/api'
import { logApiCall } from '../utils/errorHandler'

export default function Favorites() {
  const { token } = useSelector((state) => state.user)
  const [favoriteListings, setFavoriteListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      setError(null)

      const url = apiUrl('/api/listing/favorites')
      const options = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }

      // Log the API call for debugging
      logApiCall(url, options)

      const res = await axios.get(url, options)

      // Ensure we always have an array
      const data = Array.isArray(res.data) ? res.data : []
      setFavoriteListings(data)
    } catch (error) {
      console.error(
        'Kunde inte hämta favoriter:',
        error.response?.data || error.message
      )
      setError('Failed to load favorites')
      // Set empty array on error to prevent map error
      setFavoriteListings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchFavoritesEffect = async () => {
      if (token) {
        await fetchFavorites()
      }
    }
    fetchFavoritesEffect()
    // eslint-disable-next-line
  }, [token])

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>My Favorites</h1>

      {loading && (
        <div className='flex justify-center items-center p-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          <span className='ml-2'>Loading favorites...</span>
        </div>
      )}

      {error && (
        <div className='bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-4'>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className='flex flex-wrap gap-4'>
          {favoriteListings.length === 0 ? (
            <p className='text-gray-500'>You have no favorites yet.</p>
          ) : (
            favoriteListings.map((listing) => (
              <ListingItem
                key={listing._id}
                listing={listing}
                isFavorite={true}
                onFavoriteChange={fetchFavorites}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
