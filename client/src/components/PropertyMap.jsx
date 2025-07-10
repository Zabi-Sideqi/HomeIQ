import React from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
} from 'react-leaflet'
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

// Create custom icons
const searchIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const propertyIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function PropertyMap({
  center,
  listings = [],
  searchLocation = null,
  areaBoundary = null,
}) {
  const defaultCenter = center || [59.3293, 18.0686] // Stockholm default

  // Handle boundary data - it can be either direct coordinates or GeoJSON
  const getBoundaryPolygon = () => {
    if (!areaBoundary) {
      console.log('No areaBoundary provided')
      return null
    }

    console.log('Processing areaBoundary:', areaBoundary)

    // If areaBoundary is already an array of coordinates [lat, lng]
    if (Array.isArray(areaBoundary) && areaBoundary.length > 0) {
      // Check if first element is an array (coordinates)
      if (Array.isArray(areaBoundary[0]) && areaBoundary[0].length === 2) {
        console.log(
          'Using direct coordinate array with',
          areaBoundary.length,
          'points'
        )
        return areaBoundary // Already in correct format [lat, lng]
      }
    }

    // If areaBoundary is GeoJSON format
    if (areaBoundary.coordinates) {
      if (areaBoundary.type === 'Polygon') {
        console.log('Converting GeoJSON Polygon to coordinates')
        return areaBoundary.coordinates[0].map((coord) => [coord[1], coord[0]]) // [lng, lat] to [lat, lng]
      } else if (areaBoundary.type === 'MultiPolygon') {
        console.log('Converting GeoJSON MultiPolygon to coordinates')
        return areaBoundary.coordinates[0][0].map((coord) => [
          coord[1],
          coord[0],
        ])
      }
    }

    console.log('No valid boundary found, returning null')
    return null
  }

  const boundaryPolygon = getBoundaryPolygon()
  console.log(
    'Final boundaryPolygon:',
    boundaryPolygon ? `Array with ${boundaryPolygon.length} points` : 'null'
  )

  return (
    <div className='w-full h-96 rounded-lg overflow-hidden shadow-lg relative'>
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

        {/* Search area highlight - ALWAYS use boundary polygon if available, otherwise circle */}
        {searchLocation && (
          <>
            {boundaryPolygon && boundaryPolygon.length > 0 ? (
              <Polygon
                positions={boundaryPolygon}
                pathOptions={{
                  fillColor: '#3b82f6',
                  fillOpacity: 0.1,
                  color: '#3b82f6',
                  weight: 2,
                  opacity: 0.8,
                }}
              />
            ) : (
              <Circle
                center={[searchLocation.lat, searchLocation.lng]}
                radius={searchLocation.radius || 3000}
                pathOptions={{
                  fillColor: '#3b82f6',
                  fillOpacity: 0.1,
                  color: '#3b82f6',
                  weight: 2,
                  opacity: 0.8,
                }}
              />
            )}
          </>
        )}

        {/* Search location marker (if searching for an area) */}
        {searchLocation && (
          <Marker
            position={[searchLocation.lat, searchLocation.lng]}
            icon={searchIcon}
          >
            <Popup>
              <div className='text-center'>
                <strong>🎯 Search Center: {searchLocation.address}</strong>
                <br />
                <span className='text-sm text-gray-600'>
                  {boundaryPolygon
                    ? 'Showing exact area boundary'
                    : 'Showing properties within 3km radius'}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Property markers */}
        {listings.map((listing) => {
          // Try both coordinate structures
          let lat, lng
          if (listing.coordinates?.lat && listing.coordinates?.lng) {
            lat = listing.coordinates.lat
            lng = listing.coordinates.lng
          } else if (
            listing.location?.coordinates?.lat &&
            listing.location?.coordinates?.lng
          ) {
            lat = listing.location.coordinates.lat
            lng = listing.location.coordinates.lng
          } else {
            return null
          }

          return (
            <Marker key={listing._id} position={[lat, lng]} icon={propertyIcon}>
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

      {/* Map Legend */}
      <div className='absolute top-2 right-2 bg-white p-3 rounded-lg shadow-md z-20 text-xs'>
        <h4 className='font-semibold mb-2'>Map Legend</h4>
        <div className='flex items-center gap-2 mb-1'>
          <div className='w-3 h-3 bg-red-500 rounded-full'></div>
          <span>Search Center</span>
        </div>
        <div className='flex items-center gap-2 mb-1'>
          <div className='w-3 h-3 bg-green-500 rounded-full'></div>
          <span>Properties</span>
        </div>
        <div className='flex items-center gap-2'>
          {boundaryPolygon ? (
            <>
              <div className='w-3 h-3 border-2 border-blue-500 bg-blue-100'></div>
              <span>Exact Area Boundary</span>
            </>
          ) : (
            <>
              <div className='w-3 h-3 border-2 border-blue-500 rounded-full bg-blue-100'></div>
              <span>
                Search Area (
                {Math.round((searchLocation?.radius || 3000) / 1000)}km)
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
