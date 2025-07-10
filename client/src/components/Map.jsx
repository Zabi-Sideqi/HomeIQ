import { useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ChangeView component to update map center/zoom dynamically
function ChangeView({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

// Custom icon for property markers
const createPropertyIcon = (price, type) => {
  const color = type === 'sale' ? '#059669' : '#dc2626'
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        color: white;
        border-radius: 12px;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        min-width: 60px;
        text-align: center;
        border: 2px solid white;
      ">
        £${price ? price.toLocaleString() : '––'}
      </div>
    `,
    className: 'custom-property-marker',
    iconSize: [80, 30],
    iconAnchor: [40, 30],
  })
}

export default function Map({
  center = [53.8008, -1.5491], // Default Leeds
  zoom = 10,
  listings = [],
  searchLocation = null,
  height = '400px',
  areaData = null,
  selectedZone = null,
  onZoneSelect = null,
}) {
  const mapCenter = searchLocation
    ? [searchLocation.lat, searchLocation.lng]
    : center

  return (
    <div
      style={{ height, width: '100%' }}
      className='rounded-lg overflow-hidden border-2 border-gray-300'
    >
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={mapCenter} zoom={zoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {/* City boundary */}
        {areaData?.bounds && (
          <Polygon
            positions={areaData.bounds}
            pathOptions={{
              color: '#3b82f6',
              weight: 3,
              opacity: 0.8,
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
            }}
          >
            <Popup>
              <div className='text-center'>
                <strong>{areaData.city} Area</strong>
                <br />
                <small>City boundary</small>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* Zones within city */}
        {areaData?.zones?.map((zone, index) => {
          if (!Array.isArray(zone.bounds)) return null
          const isSelected = selectedZone?.name === zone.name
          return (
            <Polygon
              key={index}
              positions={zone.bounds}
              pathOptions={{
                color: isSelected ? '#f59e0b' : '#10b981',
                weight: isSelected ? 3 : 2,
                opacity: 0.9,
                fillColor: isSelected ? '#fbbf24' : '#10b981',
                fillOpacity: isSelected ? 0.3 : 0.2,
              }}
              eventHandlers={{
                click: () => onZoneSelect?.(zone),
              }}
            >
              <Popup>
                <div className='text-center'>
                  <strong>{zone.name}</strong>
                  {isSelected && (
                    <span className='text-orange-600 text-sm font-semibold'>
                      <br />Selected Area
                    </span>
                  )}
                  <br />
                  <small>Click to search this area</small>
                </div>
              </Popup>
            </Polygon>
          )
        })}

        {/* Zone markers */}
        {areaData?.zones?.map((zone, index) => {
          if (!zone.lat || !zone.lng) return null
          const isSelected = selectedZone?.name === zone.name
          return (
            <Marker
              key={`zone-${index}`}
              position={[zone.lat, zone.lng]}
              icon={L.divIcon({
                html: `
                  <div style="
                    background-color: ${isSelected ? '#f59e0b' : '#10b981'};
                    color: white;
                    border-radius: 50%;
                    width: ${isSelected ? '26px' : '20px'};
                    height: ${isSelected ? '26px' : '20px'};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: ${isSelected ? '12px' : '10px'};
                    font-weight: bold;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    border: 2px solid white;
                    cursor: pointer;
                    transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
                    transition: all 0.2s ease;
                  ">
                    ${isSelected ? '★' : index + 1}
                  </div>
                `,
                className: 'zone-marker',
                iconSize: [isSelected ? 30 : 24, isSelected ? 30 : 24],
                iconAnchor: [isSelected ? 15 : 12, isSelected ? 15 : 12],
              })}
              eventHandlers={{
                click: () => onZoneSelect?.(zone),
              }}
            >
              <Popup>
                <div className='text-center'>
                  <strong>{zone.name}</strong>
                  {isSelected && (
                    <>
                      <br />
                      <span className='text-orange-600 text-sm font-semibold'>
                        Currently Selected
                      </span>
                    </>
                  )}
                  <br />
                  <button
                    onClick={() => onZoneSelect?.(zone)}
                    className={`mt-2 px-3 py-1 rounded text-sm transition-colors ${
                      isSelected
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isSelected ? 'Search Again' : 'Search This Area'}
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* Search location marker */}
        {searchLocation && (
          <Marker
            position={[searchLocation.lat, searchLocation.lng]}
            icon={L.divIcon({
              html: `
                <div style="
                  background-color: #3b82f6;
                  color: white;
                  border-radius: 50%;
                  width: 24px;
                  height: 24px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 14px;
                  font-weight: bold;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  border: 3px solid white;
                ">
                  📍
                </div>
              `,
              className: 'search-location-marker',
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            })}
          >
            <Popup>
              <div className='text-center'>
                <strong>Search Location</strong>
                <br />
                {searchLocation.foundCity || searchLocation.address}
                <br />
                <small className='text-gray-500'>
                  {searchLocation.lat.toFixed(4)}, {searchLocation.lng.toFixed(4)}
                </small>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Property listings */}
        {listings.map((listing) => {
          const { lat, lng } = listing.location?.coordinates || {}
          if (!lat || !lng) return null

          const price = listing.discountPrice || listing.regularPrice

          return (
            <Marker
              key={listing._id}
              position={[lat, lng]}
              icon={createPropertyIcon(price, listing.type)}
            >
              <Popup>
                <div className='max-w-xs'>
                  {listing.imageUrls?.[0] && (
                    <img
                      src={listing.imageUrls[0]}
                      alt={listing.name}
                      className='w-full h-32 object-cover rounded mb-2'
                    />
                  )}
                  <div className='space-y-1'>
                    <h3 className='font-semibold text-lg truncate'>
                      {listing.name}
                    </h3>
                    <p className='text-sm text-gray-600'>{listing.address}</p>
                    <div className='flex items-center justify-between'>
                      <span className='font-bold text-lg text-green-600'>
                        £{price ? price.toLocaleString() : '––'}
                        {listing.type === 'rent' && ' / month'}
                      </span>
                      <span className='text-xs bg-gray-200 px-2 py-1 rounded'>
                        {listing.type === 'sale' ? 'For Sale' : 'For Rent'}
                      </span>
                    </div>
                    {listing.propertyType && (
                      <p className='text-sm text-gray-500'>
                        {listing.propertyType}
                      </p>
                    )}
                    <div className='flex items-center gap-4 text-sm text-gray-600'>
                      <span>{listing.bedrooms} bed</span>
                      <span>{listing.bathrooms} bath</span>
                    </div>
                    <a
                      href={`/listing/${listing._id}`}
                      className='inline-block mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors'
                    >
                      View Details
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
