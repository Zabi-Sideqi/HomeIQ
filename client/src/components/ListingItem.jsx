// client/src/components/ListingItem.jsx
import { Link } from 'react-router-dom'
import { MdLocationOn } from 'react-icons/md'
import axios from 'axios'
import { useSelector, useDispatch } from 'react-redux'
import { updateUserFavorites } from '../redux/user/userSlice' // ny, specifik action

export default function ListingItem({ listing, onFavoriteChange }) {
  const dispatch = useDispatch()
  const { currentUser, token } = useSelector((state) => state.user)

  const isFavorite = currentUser?.favorites?.includes(listing._id)

  const handleFavorite = async () => {
    if (!currentUser || !token) {
      console.warn('Du måste vara inloggad för att spara favoriter.')
      return
    }

    try {
      // Optimistisk uppdatering i UI (kan kombineras med toasts i framtiden)
      dispatch(updateUserFavorites(listing._id)) // lokal Redux-uppdatering först

      // Use Vite proxy for local development instead of direct API URL
      await axios.put(
        `/api/user/favorites/${listing._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (onFavoriteChange) onFavoriteChange()
    } catch (err) {
      console.error(
        'Kunde inte uppdatera favoritstatus:',
        err.response?.data || err.message
      )
      // Revert the optimistic update if there was an error
      dispatch(updateUserFavorites(listing._id))
    }
  }

  const openDirections = () => {
    if (!listing?.address) return alert('Ingen adress tillgänglig.')
    if (!navigator.geolocation)
      return alert('Din webbläsare stöder inte platsdelning.')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const origin = `${pos.coords.latitude},${pos.coords.longitude}`
        const destination = encodeURIComponent(listing.address)
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`
        window.open(url, '_blank')
      },
      () => alert('Kunde inte hämta din plats.')
    )
  }

  return (
    <div className='bg-white shadow-md hover:shadow-lg transition-shadow overflow-hidden rounded-lg w-full sm:w-[330px]'>
      <div className='relative'>
        <Link to={`/listing/${listing._id}`}>
          <img
            src={listing.imageUrls[0]}
            alt='listing cover'
            className='h-[320px] sm:h-[220px] w-full object-cover hover:scale-105 duration-300'
          />
        </Link>

        {token && (
          <button
            onClick={handleFavorite}
            className='absolute top-2 right-2 text-2xl'
            title={
              isFavorite ? 'Ta bort från favoriter' : 'Lägg till i favoriter'
            }
          >
            {isFavorite ? '💖' : '🤍'}
          </button>
        )}
      </div>

      <div className='p-3 flex flex-col gap-2 w-full'>
        <p className='text-lg font-semibold text-slate-700 truncate'>
          {listing.name}
        </p>

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <MdLocationOn className='h-5 w-5 text-green-500' />
            <span className='text-sm text-slate-500 truncate'>
              {listing.address}
            </span>
          </div>
          <button
            onClick={openDirections}
            className='text-blue-600 text-xs hover:underline'
          >
            Vägbeskrivning
          </button>
        </div>

        <p className='text-sm text-gray-600 line-clamp-2'>
          {listing.description}
        </p>

        <p className='text-lg font-semibold text-slate-500 mt-2'>
          {listing.offer ? listing.discountPrice : listing.regularPrice}
          {listing.type === 'rent' && '/månad'} $
        </p>

        <div className='text-slate-700 flex gap-4'>
          <div className='font-bold text-xs'>
            {listing.bedrooms > 1 ? `${listing.bedrooms} bäddar` : '1 bädd'}
          </div>
          <div className='font-bold text-xs'>
            {listing.bathrooms > 1 ? `${listing.bathrooms} badrum` : '1 badrum'}
          </div>
        </div>
      </div>
    </div>
  )
}
