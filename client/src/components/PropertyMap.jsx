import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { MdLocationOn } from 'react-icons/md'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export default function PropertyMap({
  center,
  listings = [],
  searchLocation = null,
}) {
  const defaultCenter = center || [59.3293, 18.0686] // Stockholm default

  return (
    <div className='w-full h-96 rounded-lg overflow-hidden shadow-lg'>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className='z-10'
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {/* Search location marker (if searching for an area) */}
        {searchLocation && (
          <Marker position={[searchLocation.lat, searchLocation.lng]}>
            <Popup>
              <div className='text-center'>
                <strong>📍 Search Area</strong>
                <br />
                <span className='text-sm text-gray-600'>
                  {searchLocation.address || 'Searched Location'}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Property markers */}
        {listings.map((listing) => {
          if (
            !listing.coordinates ||
            !listing.coordinates.lat ||
            !listing.coordinates.lng
          ) {
            return null
          }

          return (
            <Marker
              key={listing._id}
              position={[listing.coordinates.lat, listing.coordinates.lng]}
            >
              <Popup>
                <div className='max-w-xs'>
                  <img
                    src={listing.imageUrls[0]}
                    alt={listing.name}
                    className='w-full h-24 object-cover rounded mb-2'
                  />
                  <h3 className='font-semibold text-sm mb-1'>{listing.name}</h3>
                  <p className='text-xs text-gray-600 mb-1 flex items-center gap-1'>
                    <MdLocationOn className='text-green-500' />
                    {listing.address}
                  </p>
                  <p className='text-sm font-bold text-blue-600'>
                    $
                    {listing.offer
                      ? listing.discountPrice
                      : listing.regularPrice}
                    {listing.type === 'rent' && '/month'}
                  </p>
                  <a
                    href={`/listing/${listing._id}`}
                    className='text-xs text-blue-500 hover:underline'
                  >
                    View Details →
                  </a>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
