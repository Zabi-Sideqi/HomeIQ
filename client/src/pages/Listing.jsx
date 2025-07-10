//client/src/pages/Listing.jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import SwiperCore from 'swiper'
import { useSelector } from 'react-redux'
import { Navigation } from 'swiper/modules'
import 'swiper/css/bundle'
import {
  FaBath,
  FaBed,
  FaChair,
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaParking,
  FaShare,
  FaRoute,
  FaMap,
} from 'react-icons/fa'
import Contact from '../components/Contact'
import { apiUrl } from '../utils/api'

export default function Listing() {
  SwiperCore.use([Navigation])
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [contact, setContact] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [distance, setDistance] = useState(null)
  const params = useParams()
  const { currentUser } = useSelector((state) => state.user)

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true)
        const res = await fetch(apiUrl(`/api/listing/get/${params.listingId}`), {
          credentials: 'include',
        })
        const data = await res.json()
        if (data.success === false) {
          setError(true)
          setLoading(false)
          return
        }
        setListing(data)
        setLoading(false)
        setError(false)

        console.log('Listing loaded:', data)
        console.log('Image URLs:', data.imageUrls)
        console.log('Number of images:', data.imageUrls?.length || 0)

        if (data.imageUrls && data.imageUrls.length > 0) {
          data.imageUrls.forEach((url, index) => {
            console.log(`Testing image ${index + 1}:`, url)
            const img = new Image()
            img.onload = () => console.log(`✅ Image ${index + 1} loaded successfully`)
            img.onerror = () => console.log(`❌ Image ${index + 1} failed to load`)
            img.src = url
          })
        }
      } catch {
        setError(true)
        setLoading(false)
      }
    }
    fetchListing()
  }, [params.listingId])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.log('Location access denied:', error)
        }
      )
    }
  }, [])

  useEffect(() => {
    if (
      userLocation &&
      listing?.location?.coordinates?.lat &&
      listing?.location?.coordinates?.lng
    ) {
      const calculatedDistance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        listing.location.coordinates.lat,
        listing.location.coordinates.lng
      )
      setDistance(calculatedDistance)
    }
  }, [userLocation, listing])

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    return Math.round(distance * 10) / 10
  }

  const openInMaps = () => {
    const address = encodeURIComponent(listing.address)

    if (listing.location?.coordinates?.lat && listing.location?.coordinates?.lng) {
      const { lat, lng } = listing.location.coordinates
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )

      if (isMobile) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        if (isIOS) {
          window.open(`http://maps.apple.com/?q=${lat},${lng}&ll=${lat},${lng}`, '_blank')
        } else {
          window.open(`geo:${lat},${lng}?q=${lat},${lng}(${listing.name})`, '_blank')
        }
      } else {
        window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
      }
    } else {
      window.open(`https://www.google.com/maps/search/${address}`, '_blank')
    }
  }

  const getDirections = () => {
    if (!userLocation) {
      alert(
        'Location access required for directions. Please enable location services.'
      )
      return
    }

    const destination =
      listing.location?.coordinates?.lat && listing.location?.coordinates?.lng
        ? `${listing.location.coordinates.lat},${listing.location.coordinates.lng}`
        : encodeURIComponent(listing.address)

    const origin = `${userLocation.lat},${userLocation.lng}`

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )

    if (isMobile) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      if (isIOS) {
        window.open(
          `http://maps.apple.com/?saddr=${origin}&daddr=${destination}`,
          '_blank'
        )
      } else {
        window.open(
          `https://www.google.com/maps/dir/${origin}/${destination}`,
          '_blank'
        )
      }
    } else {
      window.open(
        `https://www.google.com/maps/dir/${origin}/${destination}`,
        '_blank'
      )
    }
  }

  return (
    <main>
      {loading && <p className='text-center my-7 text-2xl'>Loading...</p>}
      {error && (
        <p className='text-center my-7 text-2xl'>Something went wrong!</p>
      )}
      {listing && !loading && !error && (
        <div>
          <Swiper navigation>
            {listing.imageUrls.map((url, index) => (
              <SwiperSlide key={url}>
                <div
                  className='h-[550px] relative'
                  style={{
                    background: `url(${url}) center no-repeat`,
                    backgroundSize: 'cover',
                  }}
                >
                  <img
                    src={url}
                    alt={`Listing image ${index + 1}`}
                    className='hidden'
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          <div className='fixed top-[13%] right-[3%] z-10 border rounded-full w-12 h-12 flex justify-center items-center bg-slate-100 cursor-pointer'>
            <FaShare
              className='text-slate-500'
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                setCopied(true)
                setTimeout(() => {
                  setCopied(false)
                }, 2000)
              }}
            />
          </div>
          {copied && (
            <p className='fixed top-[23%] right-[5%] z-10 rounded-md bg-slate-100 p-2'>
              Link copied!
            </p>
          )}
          <div className='flex flex-col max-w-4xl mx-auto p-3 my-7 gap-4'>
            <p className='text-2xl font-semibold'>
              {listing.name} - ${' '}
              {listing.offer
                ? listing.discountPrice.toLocaleString('en-US')
                : listing.regularPrice.toLocaleString('en-US')}
              {listing.type === 'rent' && ' / month'}
            </p>
            <div className='mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200'>
              <div className='flex items-start gap-3 mb-3'>
                <FaMapMarkerAlt className='text-green-700 text-lg mt-1 flex-shrink-0' />
                <div className='flex-1'>
                  <h3 className='text-sm font-semibold text-gray-700 mb-1'>
                    Property Location
                  </h3>
                  <p
                    className='text-slate-800 text-base leading-relaxed cursor-pointer hover:text-blue-600 transition-colors'
                    onClick={openInMaps}
                    title='Click to open in maps'
                  >
                    {listing.address}
                  </p>
                  {distance && (
                    <p className='text-blue-600 font-semibold text-sm mt-2 flex items-center gap-1'>
                      📍 <span>{distance}km from your current location</span>
                    </p>
                  )}
                </div>
              </div>
              <div className='flex flex-wrap gap-3 items-center'>
                <button
                  onClick={openInMaps}
                  className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium'
                  title='Open in Maps'
                >
                  <FaMap className='h-4 w-4' />
                  View on Map
                </button>
                {userLocation && (
                  <button
                    onClick={getDirections}
                    className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium'
                    title='Get Directions'
                  >
                    <FaRoute className='h-4 w-4' />
                    Get Directions
                  </button>
                )}
                <span className='text-xs text-gray-500 italic'>
                  Click address or buttons to open in maps
                </span>
              </div>
            </div>
            <div className='flex gap-4'>
              <p className='bg-red-900 w-full max-w-[200px] text-white text-center p-1 rounded-md'>
                {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
              </p>
              {listing.offer && (
                <p className='bg-green-900 w-full max-w-[200px] text-white text-center p-1 rounded-md'>
                  ${+listing.regularPrice - +listing.discountPrice} OFF
                </p>
              )}
            </div>
            <p className='text-slate-800'>
              <span className='font-semibold text-black'>Description - </span>
              {listing.description}
            </p>
            <ul className='text-green-900 font-semibold text-sm flex flex-wrap items-center gap-4 sm:gap-6'>
              <li className='flex items-center gap-1 whitespace-nowrap '>
                <FaBed className='text-lg' />
                {listing.bedrooms > 1
                  ? `${listing.bedrooms} beds `
                  : `${listing.bedrooms} bed `}
              </li>
              <li className='flex items-center gap-1 whitespace-nowrap '>
                <FaBath className='text-lg' />
                {listing.bathrooms > 1
                  ? `${listing.bathrooms} baths `
                  : `${listing.bathrooms} bath `}
              </li>
              <li className='flex items-center gap-1 whitespace-nowrap '>
                <FaParking className='text-lg' />
                {listing.parking ? 'Parking spot' : 'No Parking'}
              </li>
              <li className='flex items-center gap-1 whitespace-nowrap '>
                <FaChair className='text-lg' />
                {listing.furnished ? 'Furnished' : 'Unfurnished'}
              </li>
            </ul>
            {currentUser && listing.userRef !== currentUser._id && !contact && (
              <button
                onClick={() => setContact(true)}
                className='bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 p-3'
              >
                Contact landlord
              </button>
            )}
            {contact && <Contact listing={listing} />}
          </div>
        </div>
      )}
    </main>
  )
}