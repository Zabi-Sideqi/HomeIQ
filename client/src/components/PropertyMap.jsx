// client/src/components/PropertyMap.jsx
// client/src/components/PropertyMap.jsx
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from '@react-google-maps/api'
import { useEffect, useState, useRef } from 'react'

const containerStyle = {
  width: '100%',
  height: '500px',
}

const types = {
  school: 'Schools',
  hospital: 'Hospitals',
  subway_station: 'Subway Stations',
  restaurant: 'Restaurants',
}

const PropertyMap = ({ address }) => {
  const [center, setCenter] = useState(null)
  const [places, setPlaces] = useState([])
  const [selected, setSelected] = useState(null)
  const [activeType, setActiveType] = useState('school')
  const [loading, setLoading] = useState(false)
  const mapRef = useRef(null)

  // 🧭 Geocode address to get coordinates
  useEffect(() => {
    const geocode = async () => {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      )
      const data = await res.json()
      if (data.results[0]) {
        const loc = data.results[0].geometry.location
        setCenter(loc)
      }
    }
    geocode()
  }, [address])

  // 📍 Fetch nearby places every time center or category changes
  useEffect(() => {
    if (!center) {
      console.log('PropertyMap: No center coordinates available yet')
      return
    }

    if (!mapRef.current) {
      console.log('PropertyMap: Map not loaded yet, mapRef is null')
      return
    }

    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error(
        'PropertyMap: Google Maps API not loaded or Places library missing'
      )
      return
    }

    console.log('PropertyMap: Searching for', activeType, 'near', center)
    setLoading(true)

    const service = new window.google.maps.places.PlacesService(mapRef.current)

    const request = {
      location: center,
      radius: 1500,
      type: activeType,
    }

    console.log('PropertyMap: Making Places API request:', request)

    service.nearbySearch(request, (results, status) => {
      setLoading(false)
      console.log(
        'PropertyMap: Places API response:',
        status,
        'Results:',
        results?.length || 0
      )

      if (
        status === window.google.maps.places.PlacesServiceStatus.OK &&
        results
      ) {
        setPlaces(results)
        setSelected(null)
        console.log(
          'PropertyMap: Found',
          results.length,
          'places for',
          activeType
        )
        console.log(
          'PropertyMap: First few results:',
          results.slice(0, 3).map((r) => r.name)
        )
      } else {
        console.error('PropertyMap: Places API error:', status)
        console.error(
          'PropertyMap: Available status codes:',
          window.google.maps.places.PlacesServiceStatus
        )
        setPlaces([])
        setSelected(null)
      }
    })
  }, [activeType, center])

  return (
    <div className='mt-4'>
      <h2 className='text-lg font-semibold mb-2'>
        Nearby {types[activeType]}
        {loading && (
          <span className='ml-2 text-sm text-gray-500'>(Loading...)</span>
        )}
        {!loading && places.length > 0 && (
          <span className='ml-2 text-sm text-gray-500'>
            ({places.length} found)
          </span>
        )}
      </h2>

      <div className='flex flex-wrap gap-2 mb-4'>
        {Object.entries(types).map(([key, label]) => (
          <button
            key={key}
            className={`px-3 py-1 rounded border ${
              activeType === key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-600'
            }`}
            onClick={() => {
              console.log(
                'PropertyMap: Button clicked, changing from',
                activeType,
                'to',
                key
              )
              setActiveType(key)
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {center && (
        <LoadScript
          googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
          libraries={['places']}
        >
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={15}
            onLoad={(map) => {
              console.log('PropertyMap: GoogleMap loaded, setting mapRef')
              mapRef.current = map
              console.log(
                'PropertyMap: Map instance available, Google Maps API loaded:',
                !!window.google?.maps?.places
              )
            }}
          >
            {/* 🏠 Main property marker */}
            <Marker position={center} title='Property Location' />

            {/* 📌 Nearby markers */}
            {places.map((place, index) => (
              <Marker
                key={index}
                position={place.geometry.location}
                onClick={() => setSelected(place)}
                title={place.name}
              />
            ))}

            {/* 🪧 Info window for selected place */}
            {selected && (
              <InfoWindow
                position={selected.geometry.location}
                onCloseClick={() => setSelected(null)}
              >
                <div>
                  <strong>{selected.name}</strong>
                  <p>{selected.vicinity}</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      )}
    </div>
  )
}

export default PropertyMap
