// client/src/components/PropertyMap.jsx
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'
import { useEffect, useState } from 'react'

const containerStyle = {
  width: '100%',
  height: '500px',
}

const PropertyMap = ({ address }) => {
  const [center, setCenter] = useState(null)

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

  return (
    <div className='mt-4'>
      <h2 className='text-lg font-semibold mb-2'>Property Location</h2>

      {center && (
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={15}
          >
            {/* 🏠 Main property marker */}
            <Marker position={center} title='Property Location' />
          </GoogleMap>
        </LoadScript>
      )}
    </div>
  )
}

export default PropertyMap
