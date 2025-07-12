// client/src/pages/Search.jsx
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ListingItem from '../components/ListingItem'
import PropertyMap from '../components/PropertyMap'
import { apiUrl } from '../utils/api'

export default function Search() {
  const navigate = useNavigate()
  const location = useLocation()

  const [propertyTypes, setPropertyTypes] = useState([])
  const [sidebardata, setSidebarData] = useState({
    searchTerm: '',
    type: 'all',
    propertyType: 'all',
    minBedrooms: '',
    maxBedrooms: '',
    minPrice: '',
    maxPrice: '',
    parking: false,
    furnished: false,
    offer: false,
    sort: 'createdAt',
    order: 'desc',
  })

  const [loading, setLoading] = useState(false)
  const [listings, setListings] = useState([])
  const [showMore, setShowMore] = useState(false)
  const [geocodeLoading, setGeocodeLoading] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [mapCenter, setMapCenter] = useState(null)
  const [searchLocation, setSearchLocation] = useState(null)
  const [areaBoundary, setAreaBoundary] = useState(null)

  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const res = await fetch(apiUrl('/api/listing/property-types'))
        const data = await res.json()
        setPropertyTypes(data)
      } catch (err) {
        console.error('Failed to fetch property types:', err)
      }
    }
    fetchPropertyTypes()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const urlParms = new URLSearchParams(location.search)

      const searchTerm = urlParms.get('searchTerm')
      if (searchTerm) {
        try {
          const geoRes = await fetch(
            apiUrl(
              `/api/listing/geocodeAddress?address=${encodeURIComponent(
                searchTerm
              )}`
            )
          )
          const geoData = await geoRes.json()
          if (geoData.success && geoData.coordinates) {
            urlParms.set('lat', geoData.coordinates.lat)
            urlParms.set('lng', geoData.coordinates.lng)
          }
        } catch (err) {
          console.error('Geocoding failed:', err)
        }
      }

      try {
        const res = await fetch(
          apiUrl(`/api/listing/get?${urlParms.toString()}`)
        )
        const data = await res.json()
        setListings(data)
        setShowMore(data.length > 8)
      } catch (err) {
        console.error('Failed to fetch listings:', err)
      }

      setLoading(false)
    }

    const urlParms = new URLSearchParams(location.search)
    const get = (key, fallback = '') => urlParms.get(key) || fallback
    setSidebarData({
      searchTerm: get('searchTerm'),
      type: get('type', 'all'),
      propertyType: get('propertyType', 'all'),
      minBedrooms: get('minBedrooms'),
      maxBedrooms: get('maxBedrooms'),
      minPrice: get('minPrice'),
      maxPrice: get('maxPrice'),
      parking: get('parking') === 'true',
      furnished: get('furnished') === 'true',
      offer: get('offer') === 'true',
      sort: get('sort', 'createdAt'),
      order: get('order', 'desc'),
    })

    fetchData()
  }, [location.search])

  // Helper function to build nearby API URL with filters
  const buildNearbyUrl = (lat, lng, radius = 3) => {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
    })

    // Add bedroom filters if selected
    if (sidebardata.minBedrooms && sidebardata.minBedrooms !== '') {
      params.set('minBedrooms', sidebardata.minBedrooms)
    }
    if (sidebardata.maxBedrooms && sidebardata.maxBedrooms !== '') {
      params.set('maxBedrooms', sidebardata.maxBedrooms)
    }

    return `/api/listing/nearby?${params.toString()}`
  }

  const handleChange = (e) => {
    const { id, value, checked } = e.target
    if (['all', 'rent', 'sale'].includes(id)) {
      setSidebarData((prev) => ({ ...prev, type: id }))
    } else if (id === 'propertyType') {
      setSidebarData((prev) => ({ ...prev, propertyType: value }))
    } else if (
      [
        'minPrice',
        'maxPrice',
        'minBedrooms',
        'maxBedrooms',
        'searchTerm',
      ].includes(id)
    ) {
      setSidebarData((prev) => ({ ...prev, [id]: value }))
    } else if (['parking', 'furnished', 'offer'].includes(id)) {
      setSidebarData((prev) => ({ ...prev, [id]: checked }))
    } else if (id === 'sort_order') {
      const [sort, order] = value.split('_')
      setSidebarData((prev) => ({ ...prev, sort, order }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const urlParams = new URLSearchParams()
    Object.entries(sidebardata).forEach(([key, value]) => {
      if (value !== '' && value !== 'all') urlParams.set(key, value)
    })
    // Hide map when doing normal search
    setShowMap(false)
    navigate(`/search?${urlParams.toString()}`)
  }

  const handleGeocodeSearch = async () => {
    if (!sidebardata.searchTerm.trim()) return
    setGeocodeLoading(true)

    try {
      // Get area boundaries from our API
      const boundaryRes = await fetch(
        apiUrl(
          `/api/listing/area-boundaries?searchTerm=${encodeURIComponent(
            sidebardata.searchTerm
          )}`
        )
      )

      const boundaryData = await boundaryRes.json()

      if (boundaryData.success) {
        const { center, boundary, displayName, useCircle, radius } =
          boundaryData

        // Set map center and search location
        setMapCenter([center.lat, center.lng])
        setSearchLocation({
          lat: center.lat,
          lng: center.lng,
          address: displayName || sidebardata.searchTerm,
          radius: radius || 5000,
        })
        setAreaBoundary(boundary)
        setShowMap(true)

        // Determine search radius based on boundary or default
        const searchRadius = useCircle ? radius / 1000 : 10 // Convert to km

        // Fetch nearby listings from backend
        const nearbyRes = await fetch(
          apiUrl(buildNearbyUrl(center.lat, center.lng, searchRadius))
        )
        const listingsData = await nearbyRes.json()
        setListings(listingsData)
        setShowMore(false)
        setGeocodeLoading(false)
        return
      }

      // Fallback to the old method if boundary API fails
      console.warn('Boundary API failed, falling back to geocoding')

      // Try Google Maps API first
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

      if (apiKey) {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              sidebardata.searchTerm
            )}&key=${apiKey}`
          )

          const data = await response.json()

          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const result = data.results[0]
            const { lat, lng } = result.geometry.location

            // Set map center and search location
            setMapCenter([lat, lng])
            setSearchLocation({
              lat,
              lng,
              address: sidebardata.searchTerm,
              radius: 3000,
            })
            setAreaBoundary(null) // No boundary data
            setShowMap(true)

            // Fetch nearby listings from backend
            const nearbyRes = await fetch(apiUrl(buildNearbyUrl(lat, lng, 3)))
            const listingsData = await nearbyRes.json()
            setListings(listingsData)
            setShowMore(false)
            setGeocodeLoading(false)
            return
          }
        } catch (error) {
          console.warn('Google Maps API failed, trying fallback:', error)
        }
      }

      // Fallback: Use OpenStreetMap Nominatim API (free, no API key needed)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            sidebardata.searchTerm
          )}&limit=1`
        )

        const data = await response.json()

        if (data && data.length > 0) {
          const result = data[0]
          const lat = parseFloat(result.lat)
          const lng = parseFloat(result.lon)

          // Set map center and search location
          setMapCenter([lat, lng])
          setSearchLocation({
            lat,
            lng,
            address: sidebardata.searchTerm,
            radius: 3000,
          })
          setAreaBoundary(null) // No boundary data
          setShowMap(true)

          // Fetch nearby listings from backend
          const nearbyRes = await fetch(apiUrl(buildNearbyUrl(lat, lng, 3)))
          const listingsData = await nearbyRes.json()
          setListings(listingsData)
          setShowMore(false)
        } else {
          alert(
            'No results found for this location. Please try a different search term.'
          )
        }
      } catch (error) {
        console.error('Fallback geocoding failed:', error)
        alert('Error searching for location. Please try again.')
      }
    } catch (error) {
      console.error('Error searching for location:', error)
      alert('Error searching for location. Please try again.')
    } finally {
      setGeocodeLoading(false)
    }
  }

  const ShowMore = async () => {
    const numberOfListings = listings.length
    const urlParams = new URLSearchParams(location.search)
    urlParams.set('startIndex', numberOfListings)
    urlParams.set('limit', 9)
    const res = await fetch(apiUrl(`/api/listing/get?${urlParams.toString()}`))
    const data = await res.json()
    if (data.length < 9) setShowMore(false)
    setListings((prev) => [...prev, ...data])
  }

  return (
    <div className='flex flex-col md:flex-row'>
      <div className='bg-slate-200 p-5 border-r md:min-h-screen w-full sm:w-[300px] md:w-[360px]'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-8'>
          <div>
            <label className='whitespace-nowrap font-semibold'>
              🔍 Search Term
            </label>
            <input
              id='searchTerm'
              onChange={handleChange}
              value={sidebardata.searchTerm}
              placeholder='Enter address, city, or area'
              className='bg-slate-400 p-3 rounded-lg w-full'
            />
          </div>

          <div className='flex gap-2 flex-wrap items-center'>
            <label className='font-semibold'>Type:</label>
            <div className='flex gap-4'>
              {['all', 'rent', 'sale'].map((opt) => (
                <label
                  key={opt}
                  className='flex items-center gap-1 text-gray-600'
                >
                  <input
                    type='radio'
                    id={opt}
                    checked={sidebardata.type === opt}
                    onChange={handleChange}
                  />
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor='propertyType'
              className='font-semibold text-gray-700 block mb-1'
            >
              🏠 Property Type
            </label>
            <select
              id='propertyType'
              onChange={handleChange}
              value={sidebardata.propertyType}
              className='bg-slate-400 p-3 rounded-lg w-full'
            >
              <option value='all'>All Types</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

{/*           <div>
            <label className='font-semibold text-gray-700 block mb-1'>
              🛏️ Bedrooms
            </label>
            <div className='flex gap-2'>
              <input
                type='number'
                id='minBedrooms'
                
                placeholder='Min'
                onChange={handleChange}
                value={sidebardata.minBedrooms}
                className='bg-slate-400 p-3 rounded-lg w-full'
                min='0'
              />
              <input
                type='number'
                id='maxBedrooms'
                
                placeholder='Max'
                onChange={handleChange}
                value={sidebardata.maxBedrooms}
                className='bg-slate-400 p-3 rounded-lg w-full'
                min='0'
              />
            </div>
          </div> */}
          <div>
  <label htmlFor='minBedrooms' className='font-semibold text-gray-700 block mb-1'>
    🛏️ Min Bedrooms
  </label>
  <input
    type='number'
    id='minBedrooms'
    name='minBedrooms'
    placeholder='Min'
    onChange={handleChange}
    value={sidebardata.minBedrooms}
    className='bg-slate-400 p-3 rounded-lg w-full'
    min='0'
  />
</div>

<div>
  <label htmlFor='maxBedrooms' className='font-semibold text-gray-700 block mb-1'>
    🛏️ Max Bedrooms
  </label>
  <input
    type='number'
    id='maxBedrooms'
    name='maxBedrooms'
    placeholder='Max'
    onChange={handleChange}
    value={sidebardata.maxBedrooms}
    className='bg-slate-400 p-3 rounded-lg w-full'
    min='0'
  />
</div>


          <div>
            <label className='font-semibold text-gray-700 block mb-1'>
              💰 Price Range
            </label>
            <div className='flex gap-2'>
              <input
                type='number'
                id='minPrice'
                placeholder='Min'
                onChange={handleChange}
                value={sidebardata.minPrice}
                className='bg-slate-400 p-3 rounded-lg w-full'
                min='0'
              />
              <input
                type='number'
                id='maxPrice'
                placeholder='Max'
                onChange={handleChange}
                value={sidebardata.maxPrice}
                className='bg-slate-400 p-3 rounded-lg w-full'
                min='0'
              />
            </div>
          </div>

          <div>
            <p className='font-semibold text-gray-700 mb-1'>🛠️ Amenities</p>
            {['parking', 'furnished', 'offer'].map((key) => (
              <label key={key} className='block text-gray-800'>
                <input
                  type='radio'
                  id={key}
                  checked={sidebardata[key]}
                  onChange={handleChange}
                  className='mr-2'
                />
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
            ))}
          </div>

          <div>
            <label
              htmlFor='sort_order'
              className='font-semibold text-gray-700 block mb-1'
            >
              🔃 Sort By
            </label>
            <select
              id='sort_order'
              onChange={handleChange}
              value={`${sidebardata.sort}_${sidebardata.order}`}
              className='bg-slate-400 p-3 rounded-lg w-full'
            >
              <option value='createdAt_desc'>Newest</option>
              <option value='createdAt_asc'>Oldest</option>
              <option value='regularPrice_asc'>Price: Low → High</option>
              <option value='regularPrice_desc'>Price: High → Low</option>
            </select>
          </div>

          <button className='bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-90 font-semibold transition-all'>
            Search
          </button>

          <div className='border-t pt-4'>
            <div className='flex flex-col gap-3'>
              <label className='font-semibold'>📍 Area Search</label>
              <p className='text-sm text-gray-600'>
                Search for cities, districts, or areas worldwide. The system
                automatically finds exact administrative boundaries when
                available.
                <br />
                <strong>Examples:</strong> "Stockholm", "Manhattan", "Solna
                Sweden", "Birmingham UK", "Munich Germany"
              </p>
              <button
                type='button'
                onClick={handleGeocodeSearch}
                disabled={geocodeLoading || !sidebardata.searchTerm.trim()}
                className='bg-blue-600 text-white p-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all'
              >
                {geocodeLoading ? 'Searching...' : 'Search Area on Map'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className='flex-1'>
        <h1 className='text-3xl font-bold p-4 text-slate-700'>
          Listing Results:
        </h1>

        {showMap && (
          <div className='px-4 pb-4'>
            <div className='mb-4 flex justify-between items-center'>
              <h2 className='text-xl font-semibold text-slate-700'>
                📍 Map View - {searchLocation?.address}
              </h2>
              <button
                onClick={() => setShowMap(false)}
                className='text-gray-500 hover:text-gray-700 text-sm underline'
              >
                Hide Map
              </button>
            </div>
            <PropertyMap
              center={mapCenter}
              listings={listings}
              searchLocation={searchLocation}
              areaBoundary={areaBoundary}
            />
          </div>
        )}

        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4'>
          {loading ? (
            <p>Loading...</p>
          ) : (
            listings.map((l) => <ListingItem key={l._id} listing={l} />)
          )}
        </div>
        {showMore && (
          <div className='text-center mt-4 mb-10'>
            <button
              onClick={ShowMore}
              className='text-blue-600 underline text-lg'
            >
              Show More
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
